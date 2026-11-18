// Controle de estoque conectado ao PostgreSQL por meio da API administrativa.
document.addEventListener('admin:ready', () => {
  if (document.body.dataset.page !== 'estoque') return;

  const { view, esc } = window.AdminCtx;
  const token = (() => {
    try { return sessionStorage.getItem('pixelTcgAccessToken'); }
    catch (error) { return null; }
  })();
  const number = value => Number(value || 0).toLocaleString('pt-BR');
  const dateTime = value => value ? new Date(value).toLocaleString('pt-BR') : '—';

  view.innerHTML = `
    <div class="ad-title">
      <div><h1>Estoque</h1><p>Consulte quantidades e registre entradas, saídas e ajustes.</p></div>
      <button class="btn-primary-ad" type="button" data-refresh><i class="fa-solid fa-rotate"></i> Atualizar</button>
    </div>
    <div class="ad-dashboard-status" data-status role="status" aria-live="polite">Carregando produtos…</div>
    <section class="kpis">
      <article class="kpi"><small>Produtos monitorados</small><strong data-total>—</strong><em>Ativos e arquivados</em></article>
      <article class="kpi"><small>Unidades em estoque</small><strong data-units>—</strong><em>Soma das quantidades atuais</em></article>
      <article class="kpi"><small>Estoque baixo</small><strong data-low>—</strong><em>Quantidade menor ou igual ao mínimo</em></article>
      <article class="kpi"><small>Sem estoque</small><strong data-empty>—</strong><em>Produtos com quantidade zero</em></article>
    </section>
    <section class="panel">
      <div class="panel-h"><div><h2>Registrar movimentação</h2><p>As alterações são salvas no banco e registradas no histórico.</p></div></div>
      <form class="form cols" data-movement-form>
        <label class="span2">Produto
          <select name="produtoId" required data-product-select><option value="">Carregando produtos…</option></select>
        </label>
        <label>Tipo de movimentação
          <select name="tipo" required>
            <option value="ENTRADA">Entrada — adicionar unidades</option>
            <option value="SAIDA">Saída — remover unidades</option>
            <option value="AJUSTE">Ajuste — definir quantidade final</option>
          </select>
        </label>
        <label>Quantidade
          <input name="quantidade" type="number" min="1" step="1" required placeholder="Ex.: 10">
        </label>
        <label class="span2">Motivo (opcional)
          <input name="motivo" type="text" maxlength="250" placeholder="Ex.: reposição de fornecedor, avaria, inventário">
        </label>
        <div class="span2"><button class="btn-primary-ad" type="submit" data-submit><i class="fa-solid fa-check"></i> Registrar movimentação</button></div>
      </form>
    </section>
    <section class="panel">
      <div class="panel-h">
        <div><h2>Posição atual do estoque</h2><p>Quantidade disponível registrada em cada produto.</p></div>
        <div class="tools"><input type="search" data-search placeholder="Buscar por nome ou SKU"><select data-filter><option value="TODOS">Todos</option><option value="BAIXO">Estoque baixo</option><option value="ZERADO">Sem estoque</option><option value="OK">Estoque normal</option></select></div>
      </div>
      <div class="tbl-wrap" data-products><div class="ad-dashboard-loading">Carregando estoque…</div></div>
    </section>
    <section class="panel">
      <div class="panel-h"><div><h2>Histórico de movimentações</h2><p>Últimas 100 movimentações registradas.</p></div></div>
      <div class="tbl-wrap" data-history><div class="ad-dashboard-loading">Carregando histórico…</div></div>
    </section>`;

  const status = view.querySelector('[data-status]');
  const productSelect = view.querySelector('[data-product-select]');
  const productTarget = view.querySelector('[data-products]');
  const historyTarget = view.querySelector('[data-history]');
  const form = view.querySelector('[data-movement-form]');
  let products = [];

  async function api(url, options = {}) {
    if (!token) throw new Error('Sua sessão não foi encontrada. Saia da conta e entre novamente.');
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      }
    });
    const payload = response.status === 204 ? null : await response.json().catch(() => null);
    if (response.status === 401) throw new Error('Sua sessão expirou. Entre novamente.');
    if (response.status === 403) throw new Error('Sua conta não tem permissão de administrador.');
    if (!response.ok) throw new Error((payload && (payload.message || payload.erro || payload.detail)) || `Erro HTTP ${response.status}.`);
    return payload;
  }

  function statusProduto(item) {
    const current = Number(item.estoque) || 0;
    const minimum = Number(item.estoqueMinimo) || 0;
    if (current === 0) return '<span class="pill p-esgotado">Sem estoque</span>';
    if (current <= minimum) return '<span class="pill p-baixo">Estoque baixo</span>';
    return '<span class="pill p-ativo">Normal</span>';
  }

  function renderProducts() {
    const query = (view.querySelector('[data-search]').value || '').trim().toLocaleLowerCase('pt-BR');
    const filter = view.querySelector('[data-filter]').value;
    const filtered = products.filter(item => {
      const matches = `${item.nome || ''} ${item.sku || ''} ${item.franquia || ''}`.toLocaleLowerCase('pt-BR').includes(query);
      const stock = Number(item.estoque) || 0;
      const min = Number(item.estoqueMinimo) || 0;
      const category = stock === 0 ? 'ZERADO' : stock <= min ? 'BAIXO' : 'OK';
      return matches && (filter === 'TODOS' || filter === category);
    });
    if (!filtered.length) {
      productTarget.innerHTML = '<div class="ad-dashboard-empty">Nenhum produto corresponde ao filtro.</div>';
      return;
    }
    productTarget.innerHTML = `<table class="tbl"><thead><tr><th>Produto</th><th>SKU</th><th class="num">Estoque atual</th><th class="num">Mínimo</th><th>Situação</th><th>Status na loja</th></tr></thead><tbody>${filtered.map(item => `
      <tr>
        <td><b>${esc(item.nome)}</b><small>${esc(item.franquia || '')}</small></td>
        <td>${esc(item.sku || '—')}</td>
        <td class="num">${number(item.estoque)}</td>
        <td class="num">${number(item.estoqueMinimo)}</td>
        <td>${statusProduto(item)}</td>
        <td>${item.ativo ? '<span class="pill p-ativo">Ativo</span>' : '<span class="pill">Arquivado</span>'}</td>
      </tr>`).join('')}</tbody></table>`;
  }

  async function loadHistory() {
    const history = await api('/api/admin/estoque/movimentacoes');
    if (!Array.isArray(history) || !history.length) {
      historyTarget.innerHTML = '<div class="ad-dashboard-empty">Nenhuma movimentação foi registrada ainda.</div>';
      return;
    }
    historyTarget.innerHTML = `<table class="tbl"><thead><tr><th>Data</th><th>Produto</th><th>Tipo</th><th class="num">Quantidade</th><th class="num">Antes</th><th class="num">Depois</th><th>Motivo</th></tr></thead><tbody>${history.map(item => `
      <tr>
        <td>${esc(dateTime(item.criadoEm))}</td>
        <td><b>${esc(item.produtoNome)}</b><small>${esc(item.sku || '')}</small></td>
        <td><span class="pill ${item.tipo === 'ENTRADA' ? 'p-ativo' : item.tipo === 'SAIDA' ? 'p-baixo' : 's-separacao'}">${esc(item.tipo)}</span></td>
        <td class="num">${number(item.quantidade)}</td>
        <td class="num">${number(item.estoqueAnterior)}</td>
        <td class="num">${number(item.estoquePosterior)}</td>
        <td>${esc(item.motivo || '—')}</td>
      </tr>`).join('')}</tbody></table>`;
  }

  async function loadAll() {
    const refresh = view.querySelector('[data-refresh]');
    refresh.disabled = true;
    status.className = 'ad-dashboard-status';
    status.textContent = 'Consultando produtos e movimentações…';
    try {
      const data = await api('/api/admin/produtos');
      if (!Array.isArray(data)) throw new Error('A API retornou uma lista de produtos inválida.');
      products = data;
      const units = products.reduce((sum, item) => sum + (Number(item.estoque) || 0), 0);
      const low = products.filter(item => Number(item.estoque) <= Number(item.estoqueMinimo)).length;
      const empty = products.filter(item => Number(item.estoque) === 0).length;
      view.querySelector('[data-total]').textContent = number(products.length);
      view.querySelector('[data-units]').textContent = number(units);
      view.querySelector('[data-low]').textContent = number(low);
      view.querySelector('[data-empty]').textContent = number(empty);
      productSelect.innerHTML = '<option value="">Selecione um produto</option>' + products.map(item =>
        `<option value="${esc(item.id)}">${esc(item.nome)} — ${esc(item.sku)} (estoque: ${number(item.estoque)})</option>`
      ).join('');
      renderProducts();
      await loadHistory();
      status.textContent = `${number(products.length)} produto(s) carregado(s).`;
      status.classList.add('success');
    } catch (error) {
      status.textContent = error.message || 'Não foi possível carregar o estoque.';
      status.classList.add('error');
      productTarget.innerHTML = '<div class="ad-dashboard-empty">Não foi possível consultar o estoque.</div>';
      historyTarget.innerHTML = '<div class="ad-dashboard-empty">Não foi possível consultar o histórico.</div>';
    } finally {
      refresh.disabled = false;
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = form.querySelector('[data-submit]');
    const data = new FormData(form);
    const produtoId = data.get('produtoId');
    if (!produtoId) {
      status.textContent = 'Selecione um produto antes de registrar a movimentação.';
      status.className = 'ad-dashboard-status error';
      return;
    }
    const request = {
      tipo: data.get('tipo'),
      quantidade: Number(data.get('quantidade')),
      motivo: String(data.get('motivo') || '').trim() || null
    };
    if (!Number.isInteger(request.quantidade) || request.quantidade < 1) {
      status.textContent = 'Informe uma quantidade inteira maior que zero.';
      status.className = 'ad-dashboard-status error';
      return;
    }
    const selected = products.find(item => item.id === produtoId);
    if (request.tipo === 'SAIDA' && selected && request.quantidade > Number(selected.estoque)) {
      status.textContent = `Saída não permitida: há somente ${number(selected.estoque)} unidade(s) deste produto.`;
      status.className = 'ad-dashboard-status error';
      return;
    }
    submit.disabled = true;
    submit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando…';
    try {
      await api(`/api/admin/estoque/produtos/${encodeURIComponent(produtoId)}/movimentacoes`, {
        method: 'POST',
        body: JSON.stringify(request)
      });
      form.reset();
      status.textContent = 'Movimentação registrada e estoque atualizado com sucesso.';
      status.className = 'ad-dashboard-status success';
      await loadAll();
    } catch (error) {
      status.textContent = error.message || 'Não foi possível registrar a movimentação.';
      status.className = 'ad-dashboard-status error';
    } finally {
      submit.disabled = false;
      submit.innerHTML = '<i class="fa-solid fa-check"></i> Registrar movimentação';
    }
  });

  view.querySelector('[data-refresh]').addEventListener('click', loadAll);
  view.querySelector('[data-search]').addEventListener('input', renderProducts);
  view.querySelector('[data-filter]').addEventListener('change', renderProducts);
  loadAll();
});
