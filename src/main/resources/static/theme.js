// Tema em memória durante a aba; ao abrir o site, segue a preferência do sistema.
(function () {
  var root = document.documentElement, manual = null;
  function system() { return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  function current() { return manual || system(); }
  function apply(theme) {
    root.setAttribute('data-theme', theme);
    document.querySelectorAll('[data-theme-set]').forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.themeSet === theme)); });
    document.querySelectorAll('.theme-btn').forEach(function (button) { button.setAttribute('aria-label', theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'); button.title = button.getAttribute('aria-label'); });
    document.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
  }
  window.Theme = {
    get: current,
    set: function (theme) { manual = theme === 'dark' ? 'dark' : 'light'; apply(manual); },
    toggle: function () { Theme.set(current() === 'dark' ? 'light' : 'dark'); },
    button: function () { var button = document.createElement('button'); button.type = 'button'; button.className = 'theme-btn'; button.innerHTML = '<i class="fa-solid fa-moon" aria-hidden="true"></i><i class="fa-solid fa-sun" aria-hidden="true"></i>'; button.addEventListener('click', Theme.toggle); return button; }
  };
  apply(current());
  if (window.matchMedia) {
    var media = matchMedia('(prefers-color-scheme: dark)');
    var update = function () { if (!manual) apply(system()); };
    if (media.addEventListener) media.addEventListener('change', update); else if (media.addListener) media.addListener(update);
  }
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-theme-set]').forEach(function (button) { button.addEventListener('click', function () { Theme.set(button.dataset.themeSet); }); });
    apply(current());
  });
})();
