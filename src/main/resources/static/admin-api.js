// Catálogo administrativo conectado ao banco de dados pela API Spring Boot.
document.addEventListener('admin:ready', async () => {
  if (document.body.dataset.page !== 'produtos') return;
  const { view, esc, brl } = AdminCtx;
  const token = (() => { try { return sessionStorage.getItem('pixelTcgAccessToken'); } catch (e) { return null; } })();
  view.innerHTML = '<div class="ad-title"><div><h1>Catálogo de Produtos</h1><p>Produtos carregados do banco de dados</p></div><a class="btn-primary-ad" href="produto-novo.html">Novo produto</a></div>';
  const box = document.createElement('section');
  box.className = 'panel';
  box.style.cssText = 'margin:0 0 22px;padding:22px;';
  box.innerHTML = '<h2 style="margin:0 0 6px">Produtos persistidos no banco de dados</h2><p style="margin:0;color:var(--muted,#697586)">Este catálogo alimenta a vitrine pública da loja. Cadastros, alterações e status são salvos pela API.</p><div data-db-list style="margin-top:16px">Carregando catálogo…</div>';
  view.append(box);
  const target = box.querySelector('[data-db-list]');

  async function carregar() {
    target.innerHTML = 'Carregando catálogo…';
    try {
      const response = await fetch('/api/admin/produtos', {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error((data && (data.erro || data.message)) || 'Não foi possível carregar o catálogo.');
      if (!Array.isArray(data) || !data.length) {
        target.innerHTML = '<div style="padding:20px;border:1px dashed #ccd4df;border-radius:10px;text-align:center;color:#586779">Nenhum produto foi cadastrado no banco ainda. Use “Novo produto” para cadastrar o primeiro.</div>';
        return;
      }
      target.innerHTML = `<div style="overflow:auto"><table style="width:100%;border-collapse:collapse;min-width:900px"><thead><tr><th style="text-align:left;padding:10px">Produto</th><th style="text-align:left;padding:10px">SKU</th><th style="text-align:left;padding:10px">Categoria</th><th style="text-align:right;padding:10px">Preço</th><th style="text-align:right;padding:10px">Estoque</th><th style="text-align:center;padding:10px">Status</th><th style="text-align:right;padding:10px">Ações</th></tr></thead><tbody>${data.map(item => `<tr style="border-top:1px solid #e7ebf0;opacity:${item.ativo ? '1' : '.65'}"><td style="padding:10px"><b>${esc(item.nome)}</b><small style="display:block;color:#697586">${esc(item.franquia)}</small></td><td style="padding:10px">${esc(item.sku)}</td><td style="padding:10px">${esc(item.categoria)}</td><td style="padding:10px;text-align:right">${brl(Number(item.preco))}</td><td style="padding:10px;text-align:right">${Number(item.estoque)}</td><td style="padding:10px;text-align:center"><span style="display:inline-block;padding:4px 8px;border-radius:20px;background:${item.ativo ? '#e7f7ef' : '#f1f2f4'};color:${item.ativo ? '#166534' : '#596273'};font-size:12px">${item.ativo ? 'Ativo na loja' : 'Arquivado'}</span></td><td style="padding:10px;text-align:right;white-space:nowrap"><a href="produto-novo.html?editar=${encodeURIComponent(item.id)}" style="font-weight:700;margin-right:12px">Editar</a><button type="button" data-toggle="${esc(item.id)}" data-active="${item.ativo ? 'true' : 'false'}" style="border:1px solid #cbd5e1;border-radius:8px;padding:7px 10px;background:transparent;cursor:pointer">${item.ativo ? 'Desativar' : 'Reativar'}</button></td></tr>`).join('')}</tbody></table></div>`;
      target.querySelectorAll('[data-toggle]').forEach(button => button.addEventListener('click', async () => {
        const id = button.dataset.toggle;
        const next = button.dataset.active !== 'true';
        const action = next ? 'reativar' : 'desativar';
        if (!confirm(`Deseja ${action} este produto? ${next ? 'Ele voltará a aparecer na loja.' : 'Ele deixará de aparecer na vitrine pública.'}`)) return;
        button.disabled = true;
        try {
          const result = await fetch(`/api/admin/produtos/${encodeURIComponent(id)}/status`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ ativo: next })
          });
          const payload = await result.json().catch(() => null);
          if (!result.ok) throw new Error((payload && (payload.erro || payload.message)) || 'Não foi possível atualizar o status.');
          await carregar();
        } catch (error) {
          alert(error.message || 'Não foi possível atualizar o produto.');
          button.disabled = false;
        }
      }));
    } catch (error) {
      target.innerHTML = `<div role="alert" style="padding:14px;border-radius:10px;background:#fff4f3;color:#8c2620">${esc(error.message)}</div>`;
    }
  }

  await carregar();
});
