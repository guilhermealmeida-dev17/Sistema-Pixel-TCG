// Histórico de pedidos vem exclusivamente de GET /api/pedidos.
const Orders = (() => {
  const STATUS = { aguardando: 'Aguardando pagamento', aprovado: 'Pagamento aprovado', separacao: 'Em preparação', enviado: 'Enviado', entregue: 'Entregue', cancelado: 'Cancelado' };
  const normalize = row => {
    const status = ({ AGUARDANDO_PAGAMENTO: 'aguardando', PAGAMENTO_APROVADO: 'aprovado', EM_PREPARACAO: 'separacao', ENVIADO: 'enviado', ENTREGUE: 'entregue', CANCELADO: 'cancelado' })[row.status] || 'aguardando';
    return { id: row.id, createdAt: new Date(row.criadoEm).getTime(), status, total: Number(row.total), entrega: row.entrega,
      endereco: row.endereco, itens: (row.itens || []).map(item => ({ id: item.produtoId, qty: item.quantidade, preco: Number(item.precoUnitario), nome: item.nome })) };
  };
  async function request(path, options = {}) {
    const token = Conta.token();
    if (!token) throw new Error('Entre para consultar seus pedidos.');
    const response = await fetch(path, { ...options, headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}) } });
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.erro || `A API respondeu com erro (${response.status}).`);
    return data;
  }
  return {
    STATUS,
    label(order) { return 'PTCG-' + String(order.id).replace(/-/g, '').slice(0, 8).toUpperCase(); },
    async mine() { return (await request('/api/pedidos')).map(normalize); },
    async cancel(id) { return normalize(await request(`/api/pedidos/${encodeURIComponent(id)}/cancelamento`, { method: 'POST' })); },
    status(order) { return order.status; },
    raw() { return []; }
  };
})();
