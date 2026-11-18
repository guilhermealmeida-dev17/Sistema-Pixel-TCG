// Dashboard operacional conectado ao catálogo administrativo do PostgreSQL.
document.addEventListener('admin:ready', () => {
  if (document.body.dataset.page !== 'painel') return;

  const { view, esc, brl } = window.AdminCtx;
  const token = (() => {
    try { return sessionStorage.getItem('pixelTcgAccessToken'); }
    catch (error) { return null; }
  })();

  view.innerHTML = `
    <div class="ad-title ad-dashboard-title">
      <div>
        <h1>Painel operacional</h1>
        <p>Visão geral do catálogo e do estoque cadastrados na loja.</p>
      </div>
      <div class="ad-dashboard-actions">
        <span class="ad-live-label"><i class="fa-solid fa-circle"></i> Dados do banco de dados</span>
        <button class="btn-primary-ad" type="button" data-refresh><i class="fa-solid fa-rotate"></i> Atualizar dados</button>
      </div>
    </div>
    <div data-dashboard-status class="ad-dashboard-status" role="status" aria-live="polite">Carregando informações do catálogo…</div>
    <section class="kpis ad-dashboard-kpis" aria-label="Indicadores do catálogo">
      <article class="kpi"><span class="ic blue"><i class="fa-solid fa-boxes-stacked"></i></span><small>Produtos cadastrados</small><strong data-total>—</strong><em>Ativos e arquivados</em></article>
      <article class="kpi"><span class="ic green"><i class="fa-solid fa-store"></i></span><small>Produtos ativos</small><strong data-active>—</strong><em>Disponíveis na loja</em></article>
      <article class="kpi"><span class="ic amber"><i class="fa-solid fa-box-open"></i></span><small>Unidades em estoque</small><strong data-units>—</strong><em>Soma das quantidades cadastradas</em></article>
      <article class="kpi"><span class="ic red"><i class="fa-solid fa-triangle-exclamation"></i></span><small>Alertas de estoque</small><strong data-low>—</strong><em>Produtos no mínimo ou abaixo dele</em></article>
    </section>
    <section class="panel ad-dashboard-panel">
      <div class="panel-h">
        <div><h2>Produtos que precisam de atenção</h2><p>Itens com estoque zerado ou igual/abaixo do limite configurado.</p></div>
        <a class="lk" href="estoque.html">Ver estoque <i class="fa-solid fa-arrow-right"></i></a>
      </div>
      <div class="tbl-wrap" data-low-stock>
        <div class="ad-dashboard-loading">Carregando estoque…</div>
      </div>
    </section>
    <section class="panel ad-dashboard-panel">
      <div class="panel-h">
        <div><h2>Resumo do catálogo</h2><p>Distribuição dos produtos cadastrados por situação.</p></div>
        <a class="lk" href="produtos.html">Gerenciar produtos <i class="fa-solid fa-arrow-right"></i></a>
      </div>
      <div class="ad-dashboard-summary" data-summary></div>
    </section>`;

  const status = view.querySelector('[data-dashboard-status]');
  const refresh = view.querySelector('[data-refresh]');
  const number = value => Number(value || 0).toLocaleString('pt-BR');

  async function carregar() {
    refresh.disabled = true;
    refresh.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Atualizando…';
    status.textContent = 'Consultando os produtos salvos no banco de dados…';
    status.className = 'ad-dashboard-status';

    try {
      if (!token) throw new Error('Sua sessão não foi encontrada. Saia da conta e entre novamente.');
      const response = await fetch('/api/admin/produtos', {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      });
      const payload = await response.json().catch(() => null);
      if (response.status === 401) throw new Error('Sua sessão expirou. Entre novamente para acessar o painel.');
      if (response.status === 403) throw new Error('A API recusou o acesso. Confira se sua conta possui permissão de administrador.');
      if (!response.ok) throw new Error((payload && (payload.erro || payload.message)) || `Falha ao consultar produtos (HTTP ${response.status}).`);
      if (!Array.isArray(payload)) throw new Error('A API retornou um formato inesperado para a lista de produtos.');

      const products = payload;
      const active = products.filter(item => item.ativo === true);
      const totalUnits = products.reduce((sum, item) => sum + Math.max(0, Number(item.estoque) || 0), 0);
      const lowStock = products.filter(item => {
        const stock = Number(item.estoque) || 0;
        const minimum = Number(item.estoqueMinimo) || 0;
        return stock <= minimum;
      }).sort((a, b) => (Number(a.estoque) || 0) - (Number(b.estoque) || 0));
      const archived = products.length - active.length;

      view.querySelector('[data-total]').textContent = number(products.length);
      view.querySelector('[data-active]').textContent = number(active.length);
      view.querySelector('[data-units]').textContent = number(totalUnits);
      view.querySelector('[data-low]').textContent = number(lowStock.length);

      const lowTarget = view.querySelector('[data-low-stock]');
      if (!lowStock.length) {
        lowTarget.innerHTML = '<div class="ad-dashboard-empty"><i class="fa-solid fa-circle-check"></i><b>Nenhum alerta de estoque</b><span>Todos os produtos estão acima do limite mínimo configurado.</span></div>';
      } else {
        lowTarget.innerHTML = `<table class="tbl ad-dashboard-table"><thead><tr><th>Produto</th><th>SKU</th><th class="num">Estoque atual</th><th class="num">Mínimo configurado</th><th>Situação</th></tr></thead><tbody>${lowStock.slice(0, 8).map(item => {
          const stock = Number(item.estoque) || 0;
          const minimum = Number(item.estoqueMinimo) || 0;
          const empty = stock === 0;
          return `<tr><td><b>${esc(item.nome || 'Produto sem nome')}</b><small>${esc(item.franquia || '')}</small></td><td>${esc(item.sku || '—')}</td><td class="num">${number(stock)}</td><td class="num">${number(minimum)}</td><td><span class="pill ${empty ? 's-cancelado' : 's-aguardando'}">${empty ? 'Sem estoque' : 'Estoque baixo'}</span></td></tr>`;
        }).join('')}</tbody></table>${lowStock.length > 8 ? `<p class="ad-dashboard-more">Exibindo 8 de ${number(lowStock.length)} produtos com alerta.</p>` : ''}`;
      }

      const summary = view.querySelector('[data-summary]');
      const activePercent = products.length ? Math.round(active.length / products.length * 100) : 0;
      const archivedPercent = products.length ? 100 - activePercent : 0;
      summary.innerHTML = `
        <div class="ad-dashboard-summary-row"><div><span class="ad-summary-dot active"></span>Ativos na loja</div><b>${number(active.length)} <small>${activePercent}%</small></b></div>
        <div class="ad-dashboard-track"><span class="active" style="width:${activePercent}%"></span></div>
        <div class="ad-dashboard-summary-row"><div><span class="ad-summary-dot archived"></span>Arquivados</div><b>${number(archived)} <small>${archivedPercent}%</small></b></div>
        <div class="ad-dashboard-track"><span class="archived" style="width:${archivedPercent}%"></span></div>
        <p class="ad-dashboard-footnote">Os indicadores são calculados a partir da lista retornada pela API administrativa de produtos.</p>`;

      status.textContent = `Dados atualizados. ${number(products.length)} produto(s) encontrado(s).`;
      status.classList.add('success');
    } catch (error) {
      status.textContent = error.message || 'Não foi possível carregar os dados do painel.';
      status.classList.add('error');
      view.querySelectorAll('[data-total], [data-active], [data-units], [data-low]').forEach(element => element.textContent = '—');
      view.querySelector('[data-low-stock]').innerHTML = '<div class="ad-dashboard-empty"><i class="fa-solid fa-triangle-exclamation"></i><b>Não foi possível consultar o estoque</b><span>Confira a conexão com o servidor e as permissões da sua conta.</span></div>';
      view.querySelector('[data-summary]').innerHTML = '';
    } finally {
      refresh.disabled = false;
      refresh.innerHTML = '<i class="fa-solid fa-rotate"></i> Atualizar dados';
    }
  }

  refresh.addEventListener('click', carregar);
  carregar();
});
