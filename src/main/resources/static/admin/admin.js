// Estrutura compartilhada do painel. Dados e ações de catálogo são carregados por admin-api.js.
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const brl = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const view = document.createElement('main');
  view.className = 'ad-main';

  const links = page === 'produto-novo'
    ? '<a href="produtos.html">Voltar ao catálogo</a>'
    : '<a href="produtos.html">Catálogo</a>';
  document.querySelector('#shell').innerHTML = `
    <header class="ad-header"><div class="inner">
      <a class="logo" href="../home.html"><img src="../IMG/logo.png" alt="Pixel TCG"></a>
      <div class="ad-user"><span id="theme-slot"></span>${links}<a href="../home.html">Ver loja</a></div>
    </div></header>`;
  document.querySelector('#shell').append(view);
  const themeSlot = $('#theme-slot');
  if (window.Theme && themeSlot) themeSlot.replaceWith(Theme.button());

  const toast = message => {
    let element = $('.toast');
    if (!element) {
      element = document.createElement('div');
      element.className = 'toast';
      element.setAttribute('role', 'status');
      document.body.append(element);
    }
    element.textContent = message;
    element.classList.add('show');
    setTimeout(() => element.classList.remove('show'), 2400);
  };
  const PRODUCTS = window.PRODUCTS || Object.create(null);
  const ids = Object.keys(PRODUCTS);
  const STOCK_BASE = Object.create(null);
  window.AdminCtx = {
    $, brl, esc, view, toast, ids, PRODUCTS, STOCK_BASE,
    stock: id => STOCK_BASE[id] || { sku: '', estoque: 0, minimo: 0 }
  };

  if (!['produtos', 'produto-novo', 'painel', 'estoque'].includes(page)) {
    const names = { painel: 'Painel operacional', pedidos: 'Pedidos', despacho: 'Despacho', clientes: 'Clientes', estoque: 'Estoque', cupons: 'Cupons', relatorios: 'Relatórios', config: 'Configurações' };
    view.innerHTML = `<div class="ad-title"><h1>${esc(names[page] || 'Administração')}</h1></div>
      <section class="panel" style="padding:24px"><h2>Este módulo ainda não está ligado a uma API</h2>
      <p>O conteúdo foi ocultado porque ainda não é carregado do banco de dados.</p>
      <a class="btn-primary-ad" href="produtos.html">Abrir catálogo conectado</a></section>`;
  }
  document.dispatchEvent(new CustomEvent('admin:ready'));
});
