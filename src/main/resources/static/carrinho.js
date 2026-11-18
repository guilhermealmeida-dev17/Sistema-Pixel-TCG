document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('cart-root');
  const brl = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const img = value => window.PixelProductImage ? window.PixelProductImage(value) : '/IMG/produtos/produto-placeholder.svg';
  const errorView = message => { root.innerHTML = `<div class="empty"><h1>Não foi possível carregar o carrinho</h1><p>${esc(message)}</p><a href="home.html">Voltar para a loja</a></div>`; };
  let cart;
  try { cart = await Cart.get(); }
  catch (error) { errorView(error.message); return; }

  async function render() {
    const items = cart.itens || [];
    if (!items.length) {
      root.innerHTML = '<div class="empty"><i class="fa-solid fa-cart-shopping"></i><h1>Seu carrinho está vazio</h1><p>Adicione produtos cadastrados no catálogo para começar seu pedido.</p><a href="home.html">Explorar produtos</a></div>';
      return;
    }
    root.innerHTML = `<div class="cart-head"><div><div class="cart-title"><h1>Seu carrinho</h1><span class="items-badge">${cart.quantidadeItens} ${cart.quantidadeItens === 1 ? 'item' : 'itens'}</span></div><p class="cart-sub">Itens consultados diretamente do banco de dados.</p></div><a class="back-link" href="home.html"><i class="fa-solid fa-arrow-left"></i> Continuar comprando</a></div>
      <div class="cart-grid"><div><div class="card-box"><div class="cart-table-head"><span>PRODUTO</span><span>QUANTIDADE</span><span>SUBTOTAL</span></div>
      ${items.map(item => `<div class="cart-row" data-id="${esc(item.produtoId)}"><div class="prod"><a class="thumb-box" href="produto.html?id=${encodeURIComponent(item.produtoId)}"><img src="${esc(img(item.imagens?.[0]))}" alt=""></a><div><h3><a href="produto.html?id=${encodeURIComponent(item.produtoId)}">${esc(item.nome)}</a></h3><div class="u">${brl(item.precoUnitario)} / un.</div><button class="remove" data-act="rm"><i class="fa-regular fa-trash-can"></i> Remover</button></div></div><div class="qty-box"><button data-act="minus" aria-label="Diminuir" ${item.quantidade <= 1 ? 'disabled' : ''}>−</button><span>${item.quantidade}</span><button data-act="plus" aria-label="Aumentar">+</button></div><div class="sub">${brl(item.subtotal)}</div></div>`).join('')}
      </div><div class="cart-tools"><button type="button" class="clear-cart" id="clear-cart"><i class="fa-regular fa-trash-can"></i> Esvaziar carrinho</button><a href="home.html"><i class="fa-solid fa-arrow-left"></i> Continuar comprando</a></div></div>
      <aside class="card-box summary"><div class="summary-head"><h2>Resumo do pedido</h2></div><div class="line"><span>Subtotal (${cart.quantidadeItens} ${cart.quantidadeItens === 1 ? 'item' : 'itens'})</span><b>${brl(cart.subtotal)}</b></div><div class="line"><span>Entrega</span><b>A confirmar no fechamento</b></div><div class="total"><span>Total parcial</span><strong>${brl(cart.subtotal)}</strong></div><p class="note">O valor e o estoque dos produtos são conferidos pelo servidor.</p><button class="btn-checkout" id="checkout">Continuar para entrega <i class="fa-solid fa-arrow-right"></i></button><div class="secure"><i class="fa-solid fa-lock"></i> Pedido associado à sua conta</div></aside></div>`;
    root.querySelectorAll('.cart-row').forEach(row => row.addEventListener('click', async event => {
      const action = event.target.closest('[data-act]')?.dataset.act;
      if (!action) return;
      const id = row.dataset.id, item = items.find(entry => entry.produtoId === id);
      try {
        if (action === 'rm') cart = await Cart.remove(id);
        else cart = await Cart.setQty(id, 0, item.quantidade + (action === 'plus' ? 1 : -1));
        await render();
      } catch (error) { errorView(error.message); }
    }));
    document.getElementById('clear-cart').onclick = async () => { try { cart = await Cart.clear(); await render(); } catch (e) { errorView(e.message); } };
    document.getElementById('checkout').onclick = () => { location.href = 'checkout.html'; };
  }
  await render();
});
