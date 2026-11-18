// Protege as telas administrativas e valida o papel no servidor antes de exibi-las.
(async function () {
  document.documentElement.style.visibility = 'hidden';
  const tokenKey = 'pixelTcgAccessToken';
  let token = null;
  try { token = sessionStorage.getItem(tokenKey); } catch (e) {}
  if (!token) return goLogin();

  try {
    const response = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
    if (response.status === 401) {
      ['pixelTcgAccessToken', 'pixelTcgSessionUser', 'pixelTcgSessionExpiry'].forEach(key => { try { sessionStorage.removeItem(key); } catch (e) {} });
      return goLogin();
    }
    if (!response.ok) throw new Error('Não foi possível validar o acesso administrativo.');
    const user = await response.json();
    if (!user.admin) {
      try { sessionStorage.setItem('pixelTcgFlash', 'Esta área é exclusiva para administradores.'); } catch (e) {}
      location.replace('/home.html');
      return;
    }
    document.documentElement.style.visibility = '';
  } catch (error) {
    document.body.replaceChildren();
    const message = document.createElement('main');
    message.setAttribute('role', 'alert');
    message.style.cssText = 'max-width:640px;margin:12vh auto;padding:28px;border:1px solid #e7b4b4;border-radius:14px;background:#fff7f7;color:#7f1d1d;font:16px/1.5 system-ui;text-align:center';
    message.textContent = error.message || 'Não foi possível validar o acesso. Confira a conexão e atualize a página.';
    document.body.append(message);
    document.documentElement.style.visibility = '';
  }

  function goLogin() {
    const next = location.pathname.replace(/^\//, '') + location.search;
    location.replace('/login.html?next=' + encodeURIComponent(next));
  }
})();
