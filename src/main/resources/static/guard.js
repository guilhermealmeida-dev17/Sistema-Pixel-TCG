// Protege as páginas internas usando a sessão emitida pela API de autenticação.
(function () {
  var token = null, expiry = 0;
  try {
    token = window.sessionStorage.getItem('pixelTcgAccessToken');
    expiry = Number(window.sessionStorage.getItem('pixelTcgSessionExpiry'));
  } catch (e) {}
  if (token && expiry && Date.now() < expiry) return;
  try {
    ['pixelTcgAccessToken', 'pixelTcgSessionUser', 'pixelTcgSessionExpiry'].forEach(function (key) {
      window.sessionStorage.removeItem(key);
    });
  } catch (e) {}
  var here = (location.pathname.split('/').pop() || 'home.html') + location.search;
  if (!/^[\w-]+\.html(\?[\w=&%.-]*)?$/.test(here)) here = 'home.html';
  document.documentElement.style.display = 'none';
  location.replace('login.html?next=' + encodeURIComponent(here));
})();
