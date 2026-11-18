document.addEventListener('DOMContentLoaded', async () => {
  await (window.PixelCatalogReady || Promise.resolve());
  const brl = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const root = document.getElementById('pdp');
  const id = new URLSearchParams(location.search).get('id');
  const p = PRODUCTS[id];

  if (!p) {
    root.innerHTML = '<div class="not-found"><h1>Produto não encontrado</h1><a href="home.html">Voltar para a loja</a></div>';
    return;
  }
  document.title = p.nome + ' - Pixel TCG';
  const esc = value => String(value == null ? '' : value).replace(/[&<>\"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[c]));
  const img = f => window.PixelProductImage ? window.PixelProductImage(f) : '/IMG/produtos/produto-placeholder.svg';
  let vIdx = 0, qty = 1;

  const related = Object.entries(PRODUCTS).filter(([k]) => k !== id).slice(0, 4).map(([k, r]) => `
    <article class="product-card">
      <div class="card-image"><a href="produto.html?id=${encodeURIComponent(k)}"><img src="${img(r.imagens[0])}" alt="${esc(r.nome)}" onerror="this.onerror=null;this.src='/IMG/produtos/produto-placeholder.svg'"></a></div>
      <div class="card-info">
        <h3 class="product-title"><a class="card-link" href="produto.html?id=${encodeURIComponent(k)}">${esc(r.nome)}</a></h3>
        <div class="price-container"><span class="price">${brl(r.versoes[0].preco)}</span></div>
        <a class="btn-add-cart" href="produto.html?id=${encodeURIComponent(k)}">Ver produto <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
      </div>
    </article>`).join('');

  root.innerHTML = `
    <nav class="breadcrumb">
      <a href="home.html">Início</a><span class="sep">›</span>
      <a href="home.html#produtos">Catálogo de Produtos</a><span class="sep">›</span>
      <a href="#">${esc(p.categoria)}</a><span class="sep">›</span>
      <a href="#">${esc(p.marca)}</a><span class="sep">›</span>
      <span class="current">${esc(p.nome.split(' Copag')[0].replace(/ \(.*/, ''))}</span>
    </nav>
    <div class="pdp-grid">
      <section class="gallery">
        <div class="gallery-main">
          ${p.badge ? `<span class="pdp-badge">${esc(p.badge)}</span>` : ''}
          <img id="main-img" src="${img(p.imagens[0])}" alt="${esc(p.nome)}" onerror="this.onerror=null;this.src='/IMG/produtos/produto-placeholder.svg'">
        </div>
        <div class="thumbs">${p.imagens.map((f, i) => `<button class="thumb ${i ? '' : 'active'}" data-i="${i}"><img src="${img(f)}" alt="Foto ${i + 1}" onerror="this.onerror=null;this.src='/IMG/produtos/produto-placeholder.svg'"></button>`).join('')}</div>
      </section>
      <section class="buybox">
        <h1>${esc(p.nome)}</h1>
        <div class="price-box"><div class="big" id="price"></div><div class="inst" id="inst"></div></div>
        <div class="opt-label">Selecione a versão / edição:</div>
        <div id="variants"></div>
        <button class="btn-buy" id="buy" ${Number.isFinite(Number(p.estoque)) && Number(p.estoque) <= 0 ? 'disabled' : ''}>Comprar agora</button>
        <div class="buy-row">
          <div class="qty"><button id="minus" aria-label="Diminuir">−</button><span id="qty">1</span><button id="plus" aria-label="Aumentar">+</button></div>
          <button class="btn-cart" id="add" ${Number.isFinite(Number(p.estoque)) && Number(p.estoque) <= 0 ? 'disabled' : ''}><i class="fa-solid fa-cart-plus"></i> Adicionar ao carrinho</button>
        </div>
        <div class="ship-result" id="shipres">Cálculo de frete ainda não integrado.</div>
        <div class="perks">
          <div><i class="fa-solid fa-box-open"></i> Produto original e lacrado</div>
          <div><i class="fa-solid fa-shield-halved"></i> Embalagem protegida, cuidado de colecionador</div>
          <div><i class="fa-solid fa-truck-fast"></i> Frete definido após integração com transportadora.</div>
        </div>
      </section>
    </div>
    <section class="details">
      <h2>Sobre o produto</h2><p>${esc(p.descricao)}</p>
      <h2>Especificações</h2>
      <table class="specs">${p.specs.map(s => `<tr><td>${esc(s[0])}</td><td>${esc(s[1])}</td></tr>`).join('')}</table>
    </section>
    <section class="related"><h2>Você também pode gostar</h2><div class="products-grid">${related}</div></section>`;

  const $ = s => document.getElementById(s);
  function render() {
    const v = p.versoes[vIdx];
    $('price').textContent = brl(v.preco * qty);
    $('inst').textContent = 'Pagamento ainda não integrado nesta versão.';
    $('qty').textContent = qty;
    $('variants').innerHTML = p.versoes.map((x, i) => `
      <button class="variant ${i === vIdx ? 'active' : ''}" data-i="${i}">
        <span class="radio">${i === vIdx ? '<i class="fa-solid fa-check"></i>' : ''}</span>
        <span class="txt"><strong>${esc(x.nome)}</strong><span>${esc(x.desc)}</span></span>
        <span class="vp">${brl(x.preco)}</span>
      </button>`).join('');
    $('variants').querySelectorAll('.variant').forEach(b => b.onclick = () => { vIdx = +b.dataset.i; render(); });
  }
  render();

  document.querySelectorAll('.thumb').forEach(t => t.onclick = () => {
    document.querySelectorAll('.thumb').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    const m = $('main-img'); m.style.visibility = 'visible'; m.src = img(p.imagens[+t.dataset.i]);
  });
  $('minus').onclick = () => { qty = Math.max(1, qty - 1); render(); };
  $('plus').onclick = () => { const max = Number.isFinite(Number(p.estoque)) ? Math.max(1, Number(p.estoque)) : 99; qty = Math.min(max, qty + 1); render(); };

  async function addToCart() {
    await Cart.add(id, vIdx, qty);
  }
  $('add').onclick = async () => {
    const b = $('add'), old = b.innerHTML; b.disabled = true;
    try { await addToCart(); } catch (error) { alert(error.message); b.disabled = false; return; }
    b.innerHTML = 'Adicionado! <i class="fa-solid fa-check"></i>'; b.style.background = '#10b981';
    setTimeout(() => { b.innerHTML = old; b.style.background = ''; b.disabled = false; }, 1500);
  };
  $('buy').onclick = async () => { try { await addToCart(); location.href = 'carrinho.html'; } catch (error) { alert(error.message); } };
});
