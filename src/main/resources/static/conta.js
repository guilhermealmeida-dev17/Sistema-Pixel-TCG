// Sessão e dados de conta passam pela API; o navegador guarda apenas o token temporário.
const Conta = (() => {
  const TOKEN_KEY = 'pixelTcgAccessToken';
  const USER_KEY = 'pixelTcgSessionUser';
  const EXPIRY_KEY = 'pixelTcgSessionExpiry';
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const digits = value => String(value || '').replace(/\D/g, '');
  const norm = value => String(value || '').trim().toLowerCase();

  class ApiError extends Error {
    constructor(status, message, detail) { super(message || 'Não foi possível concluir a operação.'); this.status = status; this.detail = detail; }
  }

  const read = key => { try { return sessionStorage.getItem(key); } catch { return null; } };
  const write = (key, value) => { try { sessionStorage.setItem(key, value); return true; } catch { return false; } };
  const clear = () => { [TOKEN_KEY, USER_KEY, EXPIRY_KEY].forEach(key => { try { sessionStorage.removeItem(key); } catch {} }); };
  const fromApi = user => user ? ({ ...user, tel: user.telefone || '', avatar: user.urlImagem || '' }) : null;
  const saveUser = user => { const normalized = fromApi(user); write(USER_KEY, JSON.stringify(normalized)); return normalized; };

  async function request(path, options = {}) {
    const headers = { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
    const token = read(TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
    let response;
    try { response = await fetch(`/api/auth${path}`, { ...options, headers }); }
    catch { throw new ApiError(0, 'Não foi possível conectar ao servidor. Confira se a API está iniciada e tente novamente.'); }
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 401 && token) clear();
      const errors = data && data.erro ? [data.erro, data.detalhe].filter(Boolean).join(' ') : null;
      throw new ApiError(response.status, errors || 'Não foi possível concluir a operação.');
    }
    return data;
  }

  const validCpf = value => {
    const cpf = digits(value);
    if (!/^\d{11}$/.test(cpf) || /^([\d])\1+$/.test(cpf)) return false;
    const check = length => {
      let sum = 0;
      for (let index = 0; index < length; index++) sum += Number(cpf[index]) * (length + 1 - index);
      const digit = (sum * 10) % 11;
      return digit === 10 ? 0 : digit;
    };
    return check(9) === Number(cpf[9]) && check(10) === Number(cpf[10]);
  };

  const api = {
    ApiError,
    user() {
      if (!read(TOKEN_KEY)) return null;
      const expiry = read(EXPIRY_KEY);
      if (expiry && Date.now() >= Number(expiry)) { clear(); return null; }
      try { return JSON.parse(read(USER_KEY)) || null; } catch { return null; }
    },
    token: () => read(TOKEN_KEY),
    async refresh() {
      try { const user = await request('/me'); return saveUser(user); }
      catch (error) { clear(); throw error; }
    },
    async register({ nome, email, cpf, senha, termosAceitos }) {
      return request('/register', { method: 'POST', body: JSON.stringify({
        nome: String(nome || '').trim(), email: norm(email), cpf: digits(cpf), senha, termosAceitos: Boolean(termosAceitos)
      }) });
    },
    async login(email, senha) {
      const result = await request('/login', { method: 'POST', body: JSON.stringify({ email: norm(email), senha }) });
      if (!write(TOKEN_KEY, result.accessToken) || !write(EXPIRY_KEY, String(new Date(result.expiresAt).getTime()))) {
        clear(); throw new ApiError(0, 'O navegador não conseguiu guardar sua sessão. Ative o armazenamento do site e tente novamente.');
      }
      const user = saveUser(result.usuario);
      if (!user || !read(USER_KEY)) { clear(); throw new ApiError(0, 'O navegador não conseguiu guardar sua sessão. Ative o armazenamento do site e tente novamente.'); }
      return user;
    },
    async update(patch) {
      const body = {};
      if (patch.nome !== undefined) body.nome = patch.nome;
      if (patch.email !== undefined) body.email = norm(patch.email);
      if (patch.cpf !== undefined) body.cpf = digits(patch.cpf);
      if (patch.tel !== undefined) body.telefone = patch.tel;
      if (patch.cidade !== undefined) body.cidade = patch.cidade;
      if (patch.avatar !== undefined) body.urlImagem = patch.avatar;
      const result = await request('/me', { method: 'PATCH', body: JSON.stringify(body) });
      const user = saveUser(result);
      return user;
    },
    async changeEmail(email) {
      try { await api.update({ email }); return 'ok'; }
      catch (error) { return error.status === 409 ? 'taken' : error.status === 400 ? 'invalid' : 'error'; }
    },
    async changePassword(current, next) {
      try { await request('/me/password', { method: 'PUT', body: JSON.stringify({ senhaAtual: current, novaSenha: next }) }); return 'ok'; }
      catch (error) { return error.status === 401 ? 'wrong' : 'error'; }
    },
    async deleteAccount() {
      await request('/me', { method: 'DELETE' });
      clear();
      return true;
    },
    logout() {
      clear();
    },
    exists: () => false,
    cpfTaken: () => false,
    validEmail: value => EMAIL_RE.test(norm(value)),
    validCpf,
    passwordIssue(password) { return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password) ? '' : 'A senha precisa ter pelo menos 8 caracteres, com letras e números.'; },
    firstName: user => String((user && user.nome) || '').trim().split(/\s+/)[0] || '',
    initials(user) { const parts = String((user && user.nome) || '?').trim().split(/\s+/); return ((parts[0] || '?')[0] + (parts.length > 1 ? parts.at(-1)[0] : '')).toUpperCase(); },
    avatarHtml(user, className) { return user && user.avatar ? `<span class="${className}"><img src="${esc(user.avatar)}" alt=""></span>` : `<span class="${className}">${esc(api.initials(user))}</span>`; },
    requireLogin() {
      if (api.user()) return true;
      const page = location.pathname.split('/').pop();
      const next = page + location.search;
      location.replace('login.html' + (/^[\w-]+\.html(\?[\w=&%.\-]*)?$/.test(next) ? '?next=' + encodeURIComponent(next) : ''));
      return false;
    },
    menu: [
      ['conta-pedidos.html', 'fa-box-archive', 'Meus Pedidos'],
      ['conta-dados.html', 'fa-user-gear', 'Meus dados e senha'],
      ['conta-config.html', 'fa-sliders', 'Configurações']
    ],
    mountHeader() {
      const actions = document.querySelector('.header-actions');
      if (!actions || actions.querySelector('.acct')) return;
      const link = actions.querySelector('.user-account'), current = api.user();
      if (!current) { if (!actions.querySelector('.theme-btn') && window.Theme) actions.insertBefore(Theme.button(), actions.firstChild); if (window.Theme) Theme.set(Theme.get()); return; }
      const wrapper = document.createElement('div'); wrapper.className = 'acct';
      wrapper.innerHTML = `<button type="button" class="acct-btn" aria-haspopup="true" aria-expanded="false" aria-controls="acct-menu">${api.avatarHtml(current, 'acct-avatar')}<span><b>Minha conta</b></span><i class="fa-solid fa-chevron-down"></i></button><div class="acct-menu" id="acct-menu" hidden><div class="acct-list">${current.admin ? '<a href="admin/painel.html"><i class="fa-solid fa-gauge-high"></i><span>Painel administrativo</span></a>' : ''}<a href="conta-pedidos.html"><i class="fa-solid fa-box"></i><span>Meus pedidos</span></a><a href="conta-dados.html"><i class="fa-solid fa-user"></i><span>Meus dados</span></a><a href="conta-config.html"><i class="fa-solid fa-gear"></i><span>Configurações</span></a></div><button type="button" class="acct-out" id="acct-out"><i class="fa-solid fa-right-from-bracket"></i><span>Sair da conta</span></button></div>`;
      if (link) link.replaceWith(wrapper); else actions.prepend(wrapper);
      const button = wrapper.querySelector('.acct-btn'), menu = wrapper.querySelector('.acct-menu');
      const close = () => { menu.hidden = true; button.setAttribute('aria-expanded', 'false'); };
      button.addEventListener('click', () => { menu.hidden = !menu.hidden; button.setAttribute('aria-expanded', String(!menu.hidden)); });
      document.addEventListener('click', event => { if (!wrapper.contains(event.target)) close(); });
      wrapper.querySelector('#acct-out').addEventListener('click', () => { api.logout(); location.href = 'login.html'; });
      if (window.Theme) Theme.set(Theme.get());
    }
  };
  return api;
})();

document.addEventListener('DOMContentLoaded', () => {
  Conta.mountHeader();
  let message = null;
  try { message = sessionStorage.getItem('pixelTcgFlash'); sessionStorage.removeItem('pixelTcgFlash'); } catch {}
  if (message) {
    const toast = document.createElement('div'); toast.className = 'ac-toast show'; toast.setAttribute('role', 'status'); toast.textContent = message; document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }
});

