// O carrinho é sempre lido e alterado pela API autenticada; nenhum item fica no navegador.
const Cart = {
  MAX_QTY: 99,
  async request(path, options = {}) {
    const token = typeof Conta !== 'undefined' ? Conta.token() : null;
    if (!token) {
      const next = encodeURIComponent(location.pathname.split('/').pop() + location.search);
      location.href = `login.html?next=${next}`;
      throw new Error('Entre na sua conta para usar o carrinho.');
    }
    let response;
    try {
      response = await fetch(`/api/carrinho${path}`, { ...options, headers: {
        Accept: 'application/json', Authorization: `Bearer ${token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {})
      }});
    } catch { throw new Error('Não foi possível conectar ao servidor.'); }
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.erro || data?.detalhe || `Falha ao atualizar carrinho (${response.status}).`);
    this.updateBadge(data?.quantidadeItens);
    return data;
  },
  async get() { return this.request(''); },
  async add(id, _variant, quantidade = 1) {
    return this.request('/itens', { method: 'POST', body: JSON.stringify({ produtoId: id, quantidade }) });
  },
  async setQty(id, _variant, quantidade) {
    return this.request(`/itens/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ quantidade }) });
  },
  async remove(id) { return this.request(`/itens/${encodeURIComponent(id)}`, { method: 'DELETE' }); },
  async clear() { return this.request('/itens', { method: 'DELETE' }); },
  count(cart) { return Number(cart?.quantidadeItens || 0); },
  round2(value) { return Math.round(Number(value) * 100) / 100; },
  updateBadge(count = null) {
    if (count !== null) document.querySelectorAll('.cart-count').forEach(el => el.textContent = String(count));
    else if (typeof Conta !== 'undefined' && Conta.token()) this.get().catch(() => {
      document.querySelectorAll('.cart-count').forEach(el => el.textContent = '0');
    });
    else document.querySelectorAll('.cart-count').forEach(el => el.textContent = '0');
  }
};
document.addEventListener('DOMContentLoaded', () => Cart.updateBadge());
