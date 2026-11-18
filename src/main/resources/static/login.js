(() => {
  const loginForm = document.getElementById('form-login');
  const cadastroForm = document.getElementById('form-cadastro');
  const passInput = document.getElementById('password-cadastro');
  const confirmInput = document.getElementById('password-confirm');

  window.switchTab = tab => {
    const isSignup = tab === 'cadastro';
    const signupForm = document.getElementById('form-cadastro');
    const signinForm = document.getElementById('form-login');
    signupForm.hidden = !isSignup;
    signinForm.hidden = isSignup;
    signupForm.classList.toggle('active', isSignup);
    signinForm.classList.toggle('active', !isSignup);
    document.querySelectorAll('[data-tab]').forEach(button => {
      const active = button.dataset.tab === tab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
  };

  const requestedTab = new URLSearchParams(location.search).get('aba');
  window.switchTab(requestedTab === 'cadastro' ? 'cadastro' : 'login');

  window.togglePasswordVisibility = (inputId, button) => {
    const input = document.getElementById(inputId);
    if (!input) return;
    const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    button.setAttribute('aria-label', visible ? 'Ocultar senha' : 'Mostrar senha');
    button.querySelector('i')?.classList.toggle('fa-eye', !visible);
    button.querySelector('i')?.classList.toggle('fa-eye-slash', visible);
  };

  const next = (() => {
    const raw = new URLSearchParams(location.search).get('next') || 'home.html';
    return /^(?:admin\/)?[\w-]+\.html(?:[?#][\w=&%.\-]*)?$/.test(raw) ? raw : 'home.html';
  })();
  const showMsg = (id, message, { info = false, extra = null } = {}) => {
    const box = document.getElementById(id);
    if (!box) return;
    box.hidden = false;
    box.classList.toggle('info', info);
    box.replaceChildren(document.createTextNode(message));
    if (extra) {
      box.append(' ');
      const link = document.createElement('button'); link.type = 'button'; link.className = 'msg-link'; link.textContent = extra.label;
      link.addEventListener('click', extra.onClick); box.append(link);
    }
  };
  const clearMsg = id => { const box = document.getElementById(id); if (box) { box.hidden = true; box.textContent = ''; } };
  const passwordIssue = password => Conta.passwordIssue(password);
  const passwordsMatch = () => {
    const same = passInput.value === confirmInput.value;
    const hint = document.getElementById('password-match');
    if (hint) hint.textContent = confirmInput.value && !same ? 'As senhas ainda não coincidem.' : '';
    return same;
  };
  confirmInput?.addEventListener('input', passwordsMatch);
  passInput?.addEventListener('input', passwordsMatch);

  const forgot = document.getElementById('forgot-link');
  forgot?.addEventListener('click', event => {
    event.preventDefault();
    showMsg('msg-login', 'A recuperação de senha por e-mail ainda não está disponível. Fale com a nossa equipe pelo WhatsApp.', { info: true });
  });
  document.getElementById('google-btn')?.addEventListener('click', () => {
    showMsg('msg-login', 'O login com Google ainda não está disponível. Por enquanto, entre com seu e-mail.', { info: true });
  });

  if (Conta.user()) {
    Conta.refresh().then(() => location.replace(next)).catch(() => {});
  }

  loginForm?.addEventListener('submit', async event => {
    event.preventDefault(); clearMsg('msg-login');
    const email = document.getElementById('email-login').value.trim();
    const senha = document.getElementById('password-login').value;
    if (!Conta.validEmail(email)) return showMsg('msg-login', 'Confira o e-mail: ele parece estar incompleto.');
    if (!senha) return showMsg('msg-login', 'Digite a sua senha para entrar.');
    const submit = loginForm.querySelector('[type="submit"]');
    const oldText = submit?.textContent;
    if (submit) { submit.disabled = true; submit.textContent = 'Entrando…'; }
    try {
      const user = await Conta.login(email, senha);
      try { sessionStorage.setItem('pixelTcgFlash', `Que bom te ver de novo, ${Conta.firstName(user)}!`); } catch {}
      location.replace(next);
    } catch (error) {
      showMsg('msg-login', error.status === 401 ? 'E-mail ou senha incorretos. Confira e tente de novo.' : error.message || 'Não foi possível entrar agora. Tente novamente.');
    } finally {
      if (submit) { submit.disabled = false; submit.textContent = oldText || 'Entrar'; }
    }
  });

  cadastroForm?.addEventListener('submit', async event => {
    event.preventDefault(); clearMsg('msg-cadastro');
    const nome = document.getElementById('nome-cadastro').value.trim();
    const email = document.getElementById('email-cadastro').value.trim();
    const cpf = document.getElementById('cpf-cadastro').value;
    const senha = passInput.value;
    if (nome.length < 2) return showMsg('msg-cadastro', 'Digite seu nome.');
    if (!Conta.validCpf(cpf)) return showMsg('msg-cadastro', 'Confira o CPF: ele parece inválido.');
    if (!Conta.validEmail(email)) return showMsg('msg-cadastro', 'Confira o e-mail: ele parece estar incompleto.');
    const issue = passwordIssue(senha);
    if (issue) return showMsg('msg-cadastro', issue);
    if (!passwordsMatch()) return showMsg('msg-cadastro', 'As duas senhas precisam ser iguais.');
    if (!cadastroForm.elements.termos.checked) return showMsg('msg-cadastro', 'Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.');
    const submit = cadastroForm.querySelector('[type="submit"]');
    const oldText = submit?.textContent;
    if (submit) { submit.disabled = true; submit.textContent = 'Criando conta…'; }
    try {
      await Conta.register({ nome, email, cpf, senha, termosAceitos: true });
      cadastroForm.reset();
      document.getElementById('email-login').value = email;
      document.getElementById('password-login').value = '';
      window.switchTab('login');
      showMsg('msg-login', 'Conta criada com sucesso! Agora entre com seu e-mail e senha.', { info: true });
      document.getElementById('password-login').focus();
    } catch (error) {
      showMsg('msg-cadastro', error.message || 'Não foi possível criar a conta. Confira os dados e tente novamente.');
    } finally {
      if (submit) { submit.disabled = false; submit.textContent = oldText || 'Criar conta'; }
    }
  });

  const cpfInput = document.getElementById('cpf-cadastro');
  cpfInput?.addEventListener('input', () => {
    const value = cpfInput.value.replace(/\D/g, '').slice(0, 11);
    cpfInput.value = value.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  });
})();
