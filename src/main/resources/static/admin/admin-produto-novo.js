// Cadastro e edição de produtos persistidos exclusivamente pela API Spring Boot.
document.addEventListener('admin:ready', async () => {
  const { $, brl, esc, view, toast, ids, PRODUCTS } = AdminCtx;
  if (document.body.dataset.page !== 'produto-novo') return;

  const MAX_IMG = 5, MAX_NOME = 90, MAX_DESC = 600, OUTRO = '__outro';
  const uniq = a => [...new Set(a.filter(Boolean))];
  const CATEGORIAS = uniq(['Boosters & Boxes', 'Acessórios', 'Cartas avulsas', ...Object.values(PRODUCTS).map(p => p.categoria)]);
  const MARCAS = uniq(['Pokémon TCG', 'Pixel TCG', 'Magic: The Gathering', 'Yu-Gi-Oh!', ...Object.values(PRODUCTS).map(p => p.marca)]);
  // [texto do botão, nome da versão salva no produto]
  const IDIOMAS = [['PT-BR Copag', 'Português Copag'], ['EN Inglês', 'Inglês (Importado)'], ['JP Japonês', 'Japonês (Importado)']];
  let idioma = IDIOMAS[0][1], imgs = [], dragFrom = null;
  // Modo edição: produtos do banco são carregados pela API; os exemplos antigos seguem locais.
  const editId = new URLSearchParams(location.search).get('editar');
  let dbOrig = null;
  let orig = editId ? PRODUCTS[editId] : null;
  const token = (() => { try { return sessionStorage.getItem('pixelTcgAccessToken'); } catch (e) { return null; } })();
  if (editId && token) {
    try {
      const response = await fetch('/api/admin/produtos', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
      const list = await response.json().catch(() => null);
      if (response.ok && Array.isArray(list)) dbOrig = list.find(item => String(item.id) === String(editId)) || null;
    } catch (error) {
      console.warn('Não foi possível consultar o produto para edição.', error);
    }
  }
  if (dbOrig) {
    orig = {
      nome: dbOrig.nome, badge: dbOrig.selo || '', categoria: dbOrig.categoria, marca: dbOrig.franquia,
      colecao: dbOrig.edicao || '', subtitulo: dbOrig.subtitulo || '', imagens: dbOrig.imagens || [],
      versoes: [{ nome: dbOrig.idioma || dbOrig.nome, desc: dbOrig.subtitulo || '', preco: Number(dbOrig.preco), parcelas: dbOrig.parcelas }],
      descricao: dbOrig.descricao || '', specs: (dbOrig.especificacoes || []).map(x => [x.rotulo, x.valor]),
      sku: dbOrig.sku, estoque: dbOrig.estoque, minimo: dbOrig.estoqueMinimo
    };
    PRODUCTS[editId] = orig;
    if (!ids.includes(editId)) ids.push(editId);
    AdminCtx.STOCK_BASE[editId] = { sku: dbOrig.sku, estoque: dbOrig.estoque, minimo: dbOrig.estoqueMinimo };
  }
  if (editId && !orig) { view.innerHTML = '<div class="panel" style="padding:24px"><h2>Produto não encontrado</h2><p>Ele pode ter sido removido ou a sessão expirou. <a href="produtos.html">Voltar ao catálogo</a></p></div>'; return; }
  const imgSrc = n => (/^(data:|https?:|\/)/.test(n) ? n : '../IMG/produtos/' + n);

  const slug = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
  const allSkus = () => ids.map(i => (AdminCtx.stock(i) || {}).sku).filter(Boolean);
  const opts = (list, sel) => list.map(o => `<option value="${esc(o)}" ${o === sel ? 'selected' : ''}>${esc(o)}</option>`).join('');
  // Ajuda ao passar o mouse: <span class="lb">Rótulo + (?)</span>. Também abre com Tab no ícone (teclado) e no toque.
  const L = (txt, ajuda, req) => `<span class="lb">${txt}${req ? '<em class="req">*</em>' : ''}<i class="tip" tabindex="0" role="button" aria-label="Ajuda sobre ${esc(String(txt).trim())}"><i class="fa-regular fa-circle-question" aria-hidden="true"></i></i><span class="tip-box" role="tooltip">${ajuda}</span></span>`;

  view.innerHTML = `
    <div class="pn">
    <div class="pn-head">
      <nav class="pn-crumb" aria-label="Navegação"><a href="painel.html">Painel Operacional</a><i class="fa-solid fa-angle-right"></i><a href="produtos.html">Catálogo</a><i class="fa-solid fa-angle-right"></i><b>Novo Produto</b></nav>
      <h1>Cadastrar Novo Produto</h1>
      <p>Preencha os dados e salve o produto no catálogo do sistema. Campos com <em class="req">*</em> são obrigatórios.</p>
    </div>
    <form id="f" novalidate>

      <section class="pn-card" aria-labelledby="s1">
        <h2 id="s1"><span class="pn-num blue">1</span>Identificação do Produto</h2>
        <div class="pn-grid">
          <div class="pn-f"><div class="pn-lr">${L('Nome Oficial do Produto', 'Como o cliente vê o produto na loja e na busca. Seja claro: tipo + coleção + quantidade. Ex.: <b>Booster Box Pokémon: Escarlate e Violeta</b>. O endereço da página (id) é criado a partir do nome.', true)}<small class="pn-cnt" id="cnt-nome">0 / ${MAX_NOME}</small></div>
            <input name="nome" maxlength="${MAX_NOME}" placeholder="Ex.: Booster Box Pokémon: Escarlate e Violeta Copag (36 Boosters)" autocomplete="off"></div>
          <div class="pn-f"><div class="pn-lr">${L('Subtítulo Comercial', 'Frase curta que aparece abaixo do nome da versão na página do produto. Ex.: <b>Válido para torneios oficiais Play! Pokémon</b>. Opcional.')}</div>
            <input name="subtitulo" maxlength="80" placeholder="Ex.: Caixa display com 36 pacotes lacrados" autocomplete="off"></div>

          <div class="pn-f"><div class="pn-lr">${L('Categoria do Produto', 'A <b>categoria</b> define em qual filtro o produto aparece na busca da loja. Escolha <b>Outra categoria…</b> para criar uma nova.', true)}</div>
            <div class="pn-sel"><select name="categoria">${opts(CATEGORIAS, CATEGORIAS[0])}<option value="${OUTRO}">Outra categoria…</option></select><i class="fa-solid fa-angle-down"></i></div>
            <input name="categoria_outra" maxlength="40" placeholder="Ex.: Pelúcias" hidden></div>
          <div class="pn-f"><div class="pn-lr">${L('Franquia / Card Game', 'Fabricante ou linha do produto. Aparece como filtro <b>Marca</b> na busca da loja. Ex.: Pokémon TCG, Pixel TCG.', true)}</div>
            <div class="pn-sel"><select name="marca">${opts(MARCAS, MARCAS[0])}<option value="${OUTRO}">Outra franquia…</option></select><i class="fa-solid fa-angle-down"></i></div>
            <input name="marca_outra" maxlength="40" placeholder="Ex.: Digimon Card Game" hidden></div>

          <div class="pn-f"><div class="pn-lr">${L('Edição / Coleção Oficial', 'Nome da coleção ou expansão do produto. Ex.: <b>Paldea Evolved</b>. Aparece na ficha técnica da página do produto. Opcional.')}</div>
            <div class="pn-ico"><i class="fa-solid fa-layer-group"></i><input name="colecao" maxlength="60" placeholder="Ex.: Escarlate e Violeta — Paldea Evolved" autocomplete="off"></div></div>
          <div class="pn-f"><div class="pn-lr">${L('Idioma / Edição da Embalagem', 'Idioma ou edição em que o produto é vendido. Vira o <b>nome da versão</b> na página do produto. Clique de novo no botão marcado para não usar nenhum (ex.: acessórios).')}</div>
            <div class="pn-seg" id="idiomas" role="radiogroup" aria-label="Idioma da embalagem"></div></div>
        </div>
      </section>

      <section class="pn-card" aria-labelledby="s2">
        <h2 id="s2"><span class="pn-num">2</span>Preço &amp; Detalhes Operacionais</h2>
        <div class="pn-two">
          <div class="pn-box">
            <div class="pn-box-h"><i class="fa-solid fa-tag"></i>VALOR</div>
            <div class="pn-f"><div class="pn-lr">${L('Preço', 'Valor <b>à vista</b> de uma unidade, em reais. Precisa ser maior que zero. O parcelamento exibido na loja é definido em <b>Configurações</b>.', true)}</div>
              <div class="pn-price"><span>R$</span><input name="preco" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0,00"></div></div>
            <div class="pn-box-f"><span>O valor à vista, em reais</span><div class="pn-sel sm"><select name="parcelas" aria-label="Parcelamento"></select><i class="fa-solid fa-angle-down"></i></div></div>
          </div>
          <div class="pn-box">
            <div class="pn-box-h"><i class="fa-solid fa-warehouse"></i>ESTOQUE</div>
            <div class="pn-stock"><div><b>${L('Disponibilidade em Estoque', 'Quantas unidades você tem agora, <b>somando todas as versões</b>. Cada venda reduz esse número. Use 0 se ainda não chegou.')}</b><small>Unidades disponíveis</small></div>
              <input name="estoque" type="number" min="0" step="1" value="0" aria-label="Unidades disponíveis"></div>
            <div class="pn-mini">
              <div class="pn-f"><div class="pn-lr">${L('SKU', '<b>Código interno do produto</b> (Stock Keeping Unit): serve para controlar o estoque e o cliente não vê. De 3 a 15 caracteres, só letras, números e hífen, e <b>nunca repita</b>. Ex.: <code>BB-ESC-36</code>. Se deixar vazio, ele é gerado automaticamente.')}</div>
                <span class="inline"><input name="sku" maxlength="15" placeholder="Gerado automaticamente" autocomplete="off" spellcheck="false"><button type="button" class="pn-btn-s" id="gen-sku">Gerar</button></span></div>
              <div class="pn-f"><div class="pn-lr">${L('Estoque mínimo', 'Quando o estoque chegar a esse número (ou menos), o painel avisa que é hora de <b>repor</b>. Ex.: com mínimo 5, o alerta aparece ao chegar em 5 unidades.')}</div>
                <input name="minimo" type="number" min="0" step="1" value="5"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="pn-card" aria-labelledby="s3">
        <div class="pn-card-h"><div><h2 id="s3"><span class="pn-num">3</span><span>Galeria de Fotos do Produto <span id="g-n"></span></span></h2><p class="pn-sub">A primeira foto é a capa (card da home e busca). Arraste as fotos para alterar a ordem.</p></div>
          <span class="pn-chip" id="g-chip"></span></div>
        <div class="pn-gal" id="imgs"></div>
        <p class="pn-hint">Formatos aceitos: JPG, PNG ou WebP. As fotos são reduzidas automaticamente. Use a ★ para trocar a capa.</p>
        <div class="pn-err" id="e-img" role="alert"></div>
      </section>

      <section class="pn-card" aria-labelledby="s4">
        <h2 id="s4"><span class="pn-num">4</span>Descrição</h2>
        <div class="pn-f"><div class="pn-lr">${L('Corpo da Descrição Editorial', 'Texto da página do produto: o que vem na embalagem, para quem é e o que o diferencia. Até 600 caracteres.')}<small class="pn-cnt" id="cnt">0 / ${MAX_DESC}</small></div>
          <textarea name="descricao" rows="5" maxlength="${MAX_DESC}" placeholder="Conte o que vem no produto, para quem é e o que o diferencia."></textarea></div>
        <details class="pn-more">
          <summary><i class="fa-solid fa-angle-right"></i>Selo da vitrine e especificações técnicas <small>(opcional)</small></summary>
          <div class="pn-more-b">
            <div class="pn-f pn-badge"><div class="pn-lr">${L('Selo na vitrine', 'Etiqueta curta que aparece sobre o card do produto na home. Ex.: <b>NOVO</b>, <b>EM ALTA</b>, <b>RARIDADE</b>. Deixe vazio se não quiser selo (máx. 16 letras).')}</div><input name="badge" maxlength="16" placeholder="Ex.: NOVO" autocomplete="off"></div>
            <div class="pn-spec-h"><b>${L('Especificações', 'Tabela de <b>ficha técnica</b> da página do produto: cada linha tem um rótulo e um valor. Ex.: <code>Conteúdo</code> → <code>36 boosters</code>. Idioma e coleção entram sozinhos.')}</b><button type="button" class="lk-btn" id="add-s"><i class="fa-solid fa-plus"></i> Adicionar linha</button></div>
            <div id="specs" class="pn-specs"></div>
          </div>
        </details>
      </section>

      <div class="pn-err" id="e-geral" role="alert"></div>
      <div class="pn-actions"><a class="pn-cancel" href="produtos.html">Cancelar</a><button type="submit" class="pn-publish"><i class="fa-solid fa-circle-check"></i> Salvar produto no sistema</button></div>
    </form></div>`;

  const f = $('#f'), g = n => f.elements[n];
  const counter = (el, out, max) => { const u = () => { out.textContent = el.value.length + ' / ' + max; }; el.addEventListener('input', u); u(); };
  counter(g('nome'), $('#cnt-nome'), MAX_NOME); counter(g('descricao'), $('#cnt'), MAX_DESC);

  // ----- selects com opção "outra…" -----
  const other = (sel, inp) => { const u = () => { inp.hidden = sel.value !== OUTRO; if (!inp.hidden) inp.focus(); }; sel.addEventListener('change', u); };
  other(g('categoria'), g('categoria_outra')); other(g('marca'), g('marca_outra'));
  const val = (sel, inp) => (sel.value === OUTRO ? inp.value : sel.value).trim();

  // ----- idioma (vira o nome da versão) -----
  const idChips = [...IDIOMAS];
  const paintIdiomas = (adding) => {
    $('#idiomas').innerHTML = idChips.map(c => `<button type="button" class="${c[1] === idioma ? 'on' : ''}" role="radio" aria-checked="${c[1] === idioma}" data-v="${esc(c[1])}">${esc(c[0])}</button>`).join('')
      + (adding ? `<span class="pn-add"><input id="idi-new" maxlength="20" placeholder="Ex.: ES Espanhol" aria-label="Novo idioma"><button type="button" id="idi-ok" aria-label="Confirmar"><i class="fa-solid fa-check"></i></button></span>` : `<button type="button" class="add" id="idi-add"><i class="fa-solid fa-plus"></i> Adicionar</button>`);
    if (adding) $('#idi-new').focus();
  };
  const addIdioma = () => { const v = $('#idi-new').value.trim(); if (v) { idChips.push([v, v]); idioma = v; } paintIdiomas(false); };
  $('#idiomas').addEventListener('click', e => {
    if (e.target.closest('#idi-add')) return paintIdiomas(true);
    if (e.target.closest('#idi-ok')) return addIdioma();
    const b = e.target.closest('[data-v]'); if (!b) return;
    idioma = idioma === b.dataset.v ? '' : b.dataset.v; paintIdiomas(false);
  });
  $('#idiomas').addEventListener('keydown', e => { if (e.target.id === 'idi-new') { if (e.key === 'Enter') { e.preventDefault(); addIdioma(); } if (e.key === 'Escape') paintIdiomas(false); } });
  paintIdiomas(false);

  // ----- preço e parcelamento -----
  const paintParc = () => {
    const p = Number(g('preco').value) || 0, keep = g('parcelas').value || '6';
    g('parcelas').innerHTML = Array.from({ length: 12 }, (_, i) => i + 1).map(n => `<option value="${n}" ${String(n) === keep ? 'selected' : ''}>${n === 1 ? 'Somente à vista' : `Até ${n}x de ${brl(p / n)} sem juros`}</option>`).join('');
  };
  g('preco').addEventListener('input', paintParc); paintParc();

  // ----- SKU -----
  const genSku = () => { const w = slug(g('nome').value).split('-').filter(Boolean); const pre = (w[0] || 'PRD').slice(0, 3).toUpperCase(), mid = (w[1] || 'NEW').slice(0, 3).toUpperCase(); let s, n = 1; do { s = `${pre}-${mid}-${String(n++).padStart(2, '0')}`; } while (allSkus().includes(s)); return s; };
  $('#gen-sku').onclick = () => { g('sku').value = genSku(); };
  g('sku').addEventListener('input', () => { g('sku').value = g('sku').value.toUpperCase().replace(/[^A-Z0-9-]/g, ''); });

  // ----- especificações -----
  const sRow = (k = '', v = '') => `<div class="pn-spec"><input data-k="k" maxlength="40" placeholder="Rótulo · ex.: Conteúdo" aria-label="Rótulo" value="${esc(k)}"><input data-k="v" maxlength="80" placeholder="Valor · ex.: 36 boosters" aria-label="Valor" value="${esc(v)}"><button type="button" class="pn-x" data-rm aria-label="Remover linha"><i class="fa-regular fa-trash-can"></i></button></div>`;
  const sWrap = $('#specs'); sWrap.innerHTML = sRow();
  $('#add-s').onclick = () => { if (sWrap.children.length < 10) sWrap.insertAdjacentHTML('beforeend', sRow()); else toast('No máximo 10 linhas.'); };
  sWrap.addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (!b) return; if (sWrap.children.length > 1) b.closest('.pn-spec').remove(); else b.closest('.pn-spec').querySelectorAll('input').forEach(i => { i.value = ''; }); });

  // ----- galeria -----
  const shrink = file => new Promise((ok, no) => {
    if (!/^image\/(jpeg|png|webp)/.test(file.type)) return no(new Error('Use JPG, PNG ou WebP.'));
    const im = new Image(), url = URL.createObjectURL(file);
    im.onload = () => { const r = Math.min(1, 700 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * r); c.height = Math.round(im.height * r); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); ok(c.toDataURL('image/jpeg', .82)); };
    im.onerror = () => { URL.revokeObjectURL(url); no(new Error('Não foi possível ler essa imagem.')); }; im.src = url;
  });
  const drawImgs = () => {
    const n = imgs.length;
    $('#g-n').textContent = n ? `(${n} ${n === 1 ? 'imagem' : 'imagens'})` : '';
    $('#g-chip').textContent = `Fotos adicionadas ${n} / ${MAX_IMG}`;
    $('#imgs').innerHTML = imgs.map((s, i) => `<figure class="pn-ph ${i === 0 ? 'main' : ''}" draggable="true" data-i="${i}">
        <div class="pn-ph-i"><img src="${imgSrc(s)}" alt="Foto ${i + 1}" draggable="false">${i === 0 ? '<span class="pn-cover">Capa</span>' : ''}
          <div class="pn-ph-a">${i ? `<button type="button" data-main="${i}" title="Tornar capa" aria-label="Tornar foto ${i + 1} a capa">★</button>` : ''}<button type="button" data-x="${i}" title="Remover" aria-label="Remover foto ${i + 1}">×</button></div></div>
        <figcaption>Foto ${i + 1} / ${n}</figcaption></figure>`).join('')
      + (n < MAX_IMG ? `<label class="pn-ph-add"><i class="fa-solid fa-plus"></i><b>Adicionar Foto</b><small>JPG, PNG ou WebP</small><input type="file" id="file" accept="image/jpeg,image/png,image/webp" multiple hidden></label>` : '');
    const inp = $('#file');
    if (inp) inp.onchange = async () => { $('#e-img').textContent = ''; for (const file of [...inp.files]) { if (imgs.length >= MAX_IMG) break; try { imgs.push(await shrink(file)); } catch (e) { $('#e-img').textContent = e.message; } } drawImgs(); };
  };
  const gal = $('#imgs');
  gal.addEventListener('click', e => { const x = e.target.closest('[data-x]'), m = e.target.closest('[data-main]'); if (x) imgs.splice(+x.dataset.x, 1); if (m) imgs.unshift(imgs.splice(+m.dataset.main, 1)[0]); if (x || m) drawImgs(); });
  gal.addEventListener('dragstart', e => { const t = e.target.closest('.pn-ph'); if (!t) return; dragFrom = +t.dataset.i; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(dragFrom)); } catch (x) {} t.classList.add('drag'); });
  gal.addEventListener('dragover', e => { if (dragFrom != null && e.target.closest('.pn-ph')) e.preventDefault(); });
  gal.addEventListener('drop', e => { const t = e.target.closest('.pn-ph'); if (!t || dragFrom == null) return; e.preventDefault(); const to = +t.dataset.i; if (to !== dragFrom) imgs.splice(to, 0, imgs.splice(dragFrom, 1)[0]); dragFrom = null; drawImgs(); });
  gal.addEventListener('dragend', () => { dragFrom = null; gal.querySelectorAll('.drag').forEach(el => el.classList.remove('drag')); });
  drawImgs();

  // ----- modo edição: preenche o formulário -----
  if (orig) {
    const v0 = orig.versoes[0], st = dbOrig ? { estoque: dbOrig.estoque, minimo: dbOrig.estoqueMinimo, sku: dbOrig.sku } : AdminCtx.stock(editId);
    document.title = 'Editar produto - Admin Pixel TCG';
    view.querySelector('h1').textContent = 'Editar Produto';
    view.querySelector('.pn-head p').innerHTML = 'Altere o que precisar e salve. Campos com <em class="req">*</em> são obrigatórios.';
    view.querySelector('.pn-crumb b').textContent = 'Editar Produto';
    view.querySelector('.pn-publish').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar alterações';
    g('nome').value = orig.nome; g('subtitulo').value = orig.subtitulo || v0.desc || '';
    const pick = (sel, inp, v) => { if (![...sel.options].some(o => o.value === v)) { sel.value = OUTRO; inp.hidden = false; inp.value = v; } else sel.value = v; };
    pick(g('categoria'), g('categoria_outra'), orig.categoria); pick(g('marca'), g('marca_outra'), orig.marca);
    g('colecao').value = orig.colecao || '';
    if (v0.nome && !idChips.some(c => c[1] === v0.nome)) idChips.push([v0.nome, v0.nome]);
    idioma = v0.nome || ''; paintIdiomas(false);
    g('preco').value = v0.preco; paintParc(); g('parcelas').value = String(v0.parcelas || 6);
    g('estoque').value = st.estoque; g('minimo').value = st.minimo; g('sku').value = st.sku || '';
    g('descricao').value = orig.descricao || ''; g('badge').value = orig.badge || '';
    imgs = (orig.imagens || []).slice(); drawImgs();
    if ((orig.specs || []).length) { sWrap.innerHTML = orig.specs.map(r => sRow(r[0], r[1])).join(''); f.querySelector('.pn-more').open = true; }
    g('nome').dispatchEvent(new Event('input')); g('descricao').dispatchEvent(new Event('input'));
  }

  // ----- salvar -----
  f.addEventListener('submit', async e => {
    e.preventDefault(); const er = $('#e-geral'); er.textContent = '';
    f.querySelectorAll('.bad').forEach(el => el.classList.remove('bad'));
    const fail = (m, el) => { er.textContent = m; if (el) { el.classList.add('bad'); el.focus(); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } else er.scrollIntoView({ block: 'center', behavior: 'smooth' }); };
    const nome = g('nome').value.trim(), id = editId || slug(nome);
    if (nome.length < 3) return fail('Informe o nome do produto.', g('nome'));
    if (!id) return fail('O nome precisa ter letras ou números.', g('nome'));
    if (!editId && PRODUCTS[id]) return fail('Já existe um produto com este nome.', g('nome'));
    const categoria = val(g('categoria'), g('categoria_outra'));
    if (!categoria) return fail('Informe a categoria.', g('categoria_outra'));
    const marca = val(g('marca'), g('marca_outra')) || 'Pixel TCG';
    const preco = Number(g('preco').value);
    if (!(preco > 0)) return fail('Informe um preço maior que zero.', g('preco').closest('.pn-price'));
    let sku = g('sku').value.trim(); if (!sku) sku = genSku();
    if (!/^[A-Z0-9-]{3,15}$/.test(sku)) return fail('Informe um SKU de 3 a 15 caracteres (letras, números e hífen).', g('sku'));
    if (sku !== (editId && AdminCtx.stock(editId).sku) && allSkus().includes(sku)) return fail('Este SKU já está em uso.', g('sku'));
    const estoque = Number(g('estoque').value), minimo = Number(g('minimo').value);
    if (!Number.isInteger(estoque) || estoque < 0 || !Number.isInteger(minimo) || minimo < 0) return fail('Estoque e mínimo devem ser números inteiros iguais ou maiores que zero.', g('estoque'));
    if (!imgs.length) return fail('Adicione ao menos uma foto do produto.', null);
    const colecao = g('colecao').value.trim();
    const specs = [...sWrap.querySelectorAll('.pn-spec')].map(r => [r.querySelector('[data-k=k]').value.trim(), r.querySelector('[data-k=v]').value.trim()]).filter(s => s[0] && s[1]);
    const has = k => specs.some(s => s[0].toLowerCase() === k);
    if (idioma && !has('idioma')) specs.unshift(['Idioma', idioma]);
    if (colecao && !has('coleção') && !has('colecao')) specs.unshift(['Coleção', colecao]);
    const versoes = [{ nome: idioma || nome.slice(0, 60), desc: g('subtitulo').value.trim(), preco: Math.round(preco * 100) / 100, parcelas: Number(g('parcelas').value) || 6 }];
    if (orig) versoes.push(...orig.versoes.slice(1)); // outras versões do produto (ex.: edição importada) continuam como estão
    const prod = { nome, badge: g('badge').value.trim().toUpperCase(), categoria, marca, colecao, subtitulo: g('subtitulo').value.trim(), imagens: imgs.slice(), versoes, descricao: g('descricao').value.trim(), specs, sku, estoque, minimo, criadoEm: (orig && orig.criadoEm) || Date.now() };
    if (!token) return fail('Sua sessão administrativa expirou. Entre novamente.', null);
    const button = f.querySelector('[type="submit"]'), previous = button.innerHTML;
    button.disabled = true; button.textContent = 'Salvando no banco…';
    try {
      const response = await fetch(dbOrig ? `/api/admin/produtos/${encodeURIComponent(editId)}` : '/api/admin/produtos', {
        method: dbOrig ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          nome, subtitulo: g('subtitulo').value.trim(), categoria, franquia: marca, edicao: colecao,
          idioma, preco: versoes[0].preco, estoque, selo: prod.badge, sku, parcelas: versoes[0].parcelas,
          estoqueMinimo: minimo, descricao: prod.descricao, imagens: imgs,
          especificacoes: specs.map(([rotulo, valor]) => ({ rotulo, valor }))
        })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error((result && (result.erro || result.detalhe)) || `Não foi possível salvar (${response.status}).`);
      location.href = 'produtos.html';
    } catch (error) {
      fail(error.message || 'Não foi possível conectar à API.', null);
    } finally {
      button.disabled = false; button.innerHTML = previous;
    }
  });
});
