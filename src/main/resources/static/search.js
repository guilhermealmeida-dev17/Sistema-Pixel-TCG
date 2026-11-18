// Busca com painel de filtros laterais. Usa o catálogo PRODUCTS (produtos.js).
document.addEventListener('DOMContentLoaded', async () => {
  await (window.PixelCatalogReady || Promise.resolve());
  const bar = document.querySelector('.search-bar');
  const input = bar && bar.querySelector('input');
  const header = document.querySelector('header');
  if (!input || !header || typeof PRODUCTS === 'undefined') return;

  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const brl = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const items = Object.entries(PRODUCTS).map(([id, p]) => ({
    id, p, preco: Math.min(...p.versoes.map(v => v.preco)),
    hay: norm([p.nome, p.categoria, p.marca, p.descricao].join(' '))
  }));
  const uniq = k => [...new Set(items.map(i => i.p[k]))].sort();
  const state = { q: '', cats: new Set(), marcas: new Set(), min: null, max: null, sort: 'rel' };

  // monta o painel
  const backdrop = Object.assign(document.createElement('div'), { className: 'sx-backdrop' });
  const panel = Object.assign(document.createElement('div'), { className: 'sx-panel', id: 'sx-panel' });
  const opts = (k, set) => uniq(k).map(v => `<label class="sx-check"><input type="checkbox" data-k="${set}" value="${esc(v)}"> ${esc(v)}<span class="c" data-count="${set}:${esc(v)}"></span></label>`).join('');
  panel.innerHTML = `
    <div class="sx-inner">
      <button type="button" class="sx-close" id="sx-close" aria-label="Fechar busca"><i class="fa-solid fa-xmark"></i><span>Fechar</span></button>
      <aside class="sx-filters" id="sx-filters" aria-label="Filtros">
        <div class="sx-fh"><h3>Filtros</h3><button type="button" class="sx-toggle" id="sx-toggle"><i class="fa-solid fa-sliders"></i> Filtros<span class="sx-n" id="sx-n" hidden></span></button><button type="button" class="sx-clear" id="sx-clear">Limpar filtros</button></div>
        <div class="sx-body">
          <div class="sx-group"><h4>Categoria</h4>${opts('categoria', 'cats')}</div>
          <div class="sx-group"><h4>Marca</h4>${opts('marca', 'marcas')}</div>
          <div class="sx-group"><h4>Preço</h4>
            <div class="sx-presets"><button type="button" data-preset="0-50">Até R$ 50</button><button type="button" data-preset="50-100">R$ 50–100</button><button type="button" data-preset="100-">Acima de R$ 100</button></div>
            <div class="sx-price"><input id="sx-min" type="number" min="0" placeholder="Mín. R$" inputmode="numeric"><span>até</span><input id="sx-max" type="number" min="0" placeholder="Máx. R$" inputmode="numeric"></div></div>
          <button type="button" class="sx-apply" id="sx-apply">Ver resultados</button>
        </div>
      </aside>
      <section>
        <div class="sx-top"><div class="sx-count" id="sx-count"></div>
          <label class="sx-sort">Ordenar por
            <select id="sx-sort"><option value="rel">Relevância</option><option value="asc">Menor preço</option><option value="desc">Maior preço</option><option value="az">Nome (A–Z)</option></select></label></div>
        <div class="sx-chips" id="sx-chips" aria-label="Filtros ativos"></div>
        <div id="sx-results"></div>
      </section>
    </div>`;
  header.appendChild(panel);
  document.body.appendChild(backdrop);
  const clearBtn = Object.assign(document.createElement('button'), { type: 'button', className: 'sx-x', innerHTML: '<i class="fa-solid fa-xmark"></i>', ariaLabel: 'Limpar busca' });
  bar.appendChild(clearBtn);
  input.setAttribute('aria-controls', 'sx-panel');
  input.setAttribute('autocomplete', 'off');

  const $ = s => panel.querySelector(s);
  const matchQ = i => norm(state.q).split(/\s+/).filter(Boolean).every(t => i.hay.includes(t));
  const hl = txt => {
    let out = esc(txt);
    norm(state.q).split(/\s+/).filter(t => t.length > 1).forEach(t => {
      const n = norm(txt), idx = n.indexOf(t);
      if (idx >= 0 && n.length === txt.length) out = esc(txt.slice(0, idx)) + '<mark>' + esc(txt.slice(idx, idx + t.length)) + '</mark>' + esc(txt.slice(idx + t.length));
    });
    return out;
  };

  const inPrice = i => (state.min == null || i.preco >= state.min) && (state.max == null || i.preco <= state.max);
  const passes = (i, skip) => matchQ(i) &&
    (skip === 'cats' || !state.cats.size || state.cats.has(i.p.categoria)) &&
    (skip === 'marcas' || !state.marcas.size || state.marcas.has(i.p.marca)) && inPrice(i);

  function renderChips() {
    const chips = [];
    if (state.q.trim()) chips.push(['q', `“${state.q.trim()}”`]);
    state.cats.forEach(c => chips.push(['cat:' + c, c]));
    state.marcas.forEach(m => chips.push(['marca:' + m, m]));
    if (state.min != null || state.max != null)
      chips.push(['preco', state.min != null && state.max != null ? `${brl(state.min)} – ${brl(state.max)}` : state.min != null ? `A partir de ${brl(state.min)}` : `Até ${brl(state.max)}`]);
    $('#sx-chips').innerHTML = chips.length
      ? chips.map(([k, t]) => `<button type="button" class="sx-chip" data-chip="${esc(k)}" aria-label="Remover filtro ${esc(t)}">${esc(t)} <i class="fa-solid fa-xmark"></i></button>`).join('') + '<button type="button" class="sx-chip-clear" data-chip="all">Limpar tudo</button>'
      : '';
    const n = state.cats.size + state.marcas.size + (state.min != null || state.max != null ? 1 : 0);
    const badge = $('#sx-n'); badge.hidden = !n; badge.textContent = n;
    $('#sx-clear').style.visibility = chips.length ? 'visible' : 'hidden';
    panel.querySelectorAll('[data-preset]').forEach(b => {
      const [a, z] = b.dataset.preset.split('-');
      b.classList.toggle('on', state.min === (a === '' || a === '0' ? null : +a) && state.max === (z === '' ? null : +z));
    });
  }

  const instal = () => '';
  function render() {
    // contadores das facetas: respeitam busca, preço e os demais filtros (zero = opção esmaecida)
    panel.querySelectorAll('[data-count]').forEach(el => {
      const [set, val] = el.dataset.count.split(':'); const k = set === 'cats' ? 'categoria' : 'marca';
      const n = items.filter(i => passes(i, set) && i.p[k] === val).length;
      el.textContent = n; el.closest('.sx-check').classList.toggle('zero', n === 0);
    });
    let res = items.filter(i => passes(i));
    $('#sx-apply').innerHTML = `Ver <b>${res.length}</b> ${res.length === 1 ? 'resultado' : 'resultados'}`;
    renderChips();
    if (state.sort === 'asc') res.sort((a, b) => a.preco - b.preco);
    else if (state.sort === 'desc') res.sort((a, b) => b.preco - a.preco);
    else if (state.sort === 'az') res.sort((a, b) => a.p.nome.localeCompare(b.p.nome, 'pt-BR'));
    $('#sx-count').innerHTML = state.q.trim()
      ? `<b>${res.length}</b> ${res.length === 1 ? 'resultado' : 'resultados'} para “<b>${esc(state.q.trim())}</b>”`
      : `Sugestões da loja · <b>${res.length}</b> ${res.length === 1 ? 'produto' : 'produtos'}`;
    $('#sx-results').innerHTML = res.length ? `<div class="sx-grid">${res.map(i => `
      <a class="sx-item" href="produto.html?id=${i.id}">
        <div class="im"><img src="${esc(window.PixelProductImage ? window.PixelProductImage(i.p.imagens[0]) : i.p.imagens[0])}" alt="" onerror="this.onerror=null;this.src='/IMG/produtos/produto-placeholder.svg'"></div>
        <div class="bd"><div class="ct">${esc(i.p.categoria)}</div><div class="nm">${hl(i.p.nome.replace(/ Copag.*/, ''))}</div>
        <div class="pr">${i.p.versoes.length > 1 ? '<small style="font-weight:500;font-size:11px;color:#64748B">a partir de </small>' : ''}${brl(i.preco)}</div>${instal(i)}</div>
      </a>`).join('')}</div>`
      : `<div class="sx-empty"><i class="fa-regular fa-face-frown"></i>Nenhum produto encontrado.<br>Tente outro termo ou limpe os filtros.</div>`;
    bar.classList.toggle('has-q', !!input.value);
  }

  const open = () => { panel.classList.add('open'); backdrop.classList.add('open'); input.setAttribute('aria-expanded', 'true'); render(); };
  const close = () => { panel.classList.remove('open'); backdrop.classList.remove('open'); input.setAttribute('aria-expanded', 'false'); };

  input.addEventListener('focus', open);
  input.addEventListener('click', open);
  input.addEventListener('input', () => { state.q = input.value; open(); });
  bar.querySelector('button:not(.sx-x)').addEventListener('click', e => { e.preventDefault(); open(); input.focus(); });
  clearBtn.addEventListener('click', () => { input.value = ''; state.q = ''; render(); input.focus(); });
  backdrop.addEventListener('click', close);
  $('#sx-close').addEventListener('click', () => { close(); input.blur(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { close(); input.blur(); } });

  panel.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.k) { (t.checked ? state[t.dataset.k].add(t.value) : state[t.dataset.k].delete(t.value)); }
    if (t.id === 'sx-sort') state.sort = t.value;
    render();
  });
  const num = v => (v === '' ? null : Math.max(0, +v));
  $('#sx-min').addEventListener('input', e => { state.min = num(e.target.value); render(); });
  $('#sx-max').addEventListener('input', e => { state.max = num(e.target.value); render(); });
  function resetFilters() {
    state.cats.clear(); state.marcas.clear(); state.min = state.max = null; state.sort = 'rel';
    panel.querySelectorAll('input[type=checkbox]').forEach(c => c.checked = false);
    $('#sx-min').value = $('#sx-max').value = ''; $('#sx-sort').value = 'rel';
  }
  $('#sx-clear').addEventListener('click', () => { resetFilters(); render(); });
  panel.addEventListener('click', e => {
    const chip = e.target.closest('[data-chip]');
    if (chip) {
      const [k, ...r] = chip.dataset.chip.split(':'), v = r.join(':');
      if (k === 'all') { resetFilters(); input.value = ''; state.q = ''; }
      else if (k === 'q') { input.value = ''; state.q = ''; }
      else if (k === 'preco') { state.min = state.max = null; $('#sx-min').value = $('#sx-max').value = ''; }
      else { state[k === 'cat' ? 'cats' : 'marcas'].delete(v); const b = [...panel.querySelectorAll(`input[data-k="${k === 'cat' ? 'cats' : 'marcas'}"]`)].find(i => i.value === v); if (b) b.checked = false; }
      return render();
    }
    const pre = e.target.closest('[data-preset]');
    if (pre) {
      const [a, z] = pre.dataset.preset.split('-'); const same = pre.classList.contains('on');
      state.min = same || a === '' ? null : +a; state.max = same || z === '' ? null : +z;
      if (!same && a === '0') state.min = null;
      $('#sx-min').value = state.min == null ? '' : state.min; $('#sx-max').value = state.max == null ? '' : state.max;
      render();
    }
    if (e.target.closest('#sx-apply')) { $('#sx-filters').classList.remove('open'); $('#sx-results').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
  $('#sx-toggle').addEventListener('click', () => $('#sx-filters').classList.toggle('open'));

  // API pública: abre o painel já com categoria(s) e/ou termo aplicados (usada pela home, menu e rodapé).
  function openWith({ cats = [], q = '' } = {}) {
    resetFilters();
    cats.forEach(c => {
      state.cats.add(c);
      const box = [...panel.querySelectorAll('input[data-k="cats"]')].find(i => i.value === c);
      if (box) box.checked = true;
    });
    input.value = q; state.q = q;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    $('#sx-filters').classList.add('open'); // no celular, já mostra os filtros
    open();
  }
  window.PixelSearch = { open: openWith, close };

  // Qualquer elemento com data-sx abre o painel: data-sx-cats="Acessórios|Outra" data-sx-q="termo"
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-sx]');
    if (!el) return;
    e.preventDefault();
    openWith({ cats: (el.dataset.sxCats || '').split('|').filter(Boolean), q: el.dataset.sxQ || '' });
  });

  // Menu de categorias do cabeçalho (todas as páginas): "Todas as categorias" abre o painel de filtros.
  document.querySelectorAll('.nav-categories .nav-all').forEach(a => a.setAttribute('data-sx', ''));
  // Nas demais páginas (sem a vitrine da home), os itens do menu também abrem o painel já filtrado.
  if (!document.getElementById('categorias')) {
    const MAP = { 'boosters': { c: 'Boosters & Boxes' }, 'boxes e colecoes': { c: 'Boosters & Boxes' }, 'acessorios': { c: 'Acessórios' }, 'cartas avulsas': { q: 'carta avulsa' } };
    document.querySelectorAll('.nav-categories a:not(.nav-all)').forEach(a => {
      const m = MAP[norm(a.textContent.trim())];
      if (!m) return;
      a.setAttribute('data-sx', '');
      if (m.c) a.dataset.sxCats = m.c;
      if (m.q) a.dataset.sxQ = m.q;
    });
  }
});
