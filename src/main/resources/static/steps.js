// Barra de etapas da compra (Carrinho > Entrega e pagamento > Pagamento). As etapas anteriores viram links para voltar.
document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('main');
  if (!main) return;
  const page = location.pathname.split('/').pop().replace('.html', '');
  const cur = { carrinho: 0, checkout: 1, pay: 2 }[page];
  if (cur == null) return;
  const S = [['carrinho.html', 'fa-cart-shopping', 'Carrinho'], ['checkout.html', 'fa-truck', 'Entrega e pagamento'], ['pay.html', 'fa-credit-card', 'Pagamento']];
  const nav = document.createElement('nav');
  nav.className = 'steps'; nav.setAttribute('aria-label', 'Etapas da compra');
  nav.innerHTML = '<ol>' + S.map((s, i) => {
    const st = i < cur ? 'done' : i === cur ? 'now' : 'next';
    const inner = `<span class="n">${i < cur ? '<i class="fa-solid fa-check"></i>' : i + 1}</span><span class="t">${s[2]}</span>`;
    return `<li class="${st}">${i < cur ? `<a href="${s[0]}">${inner}</a>` : `<span ${i === cur ? 'aria-current="step"' : ''}>${inner}</span>`}</li>`;
  }).join('') + '</ol>';
  main.insertAdjacentElement('beforebegin', nav);
});
