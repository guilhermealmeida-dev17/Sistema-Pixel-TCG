document.addEventListener('DOMContentLoaded', async () => {
  const page = document.getElementById('co-page');
  const form = document.getElementById('co-form');
  const $ = selector => document.querySelector(selector);
  const brl = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const token = Conta.token();
  if (!token) { location.replace('login.html?next=checkout.html'); return; }

  async function request(path, options = {}) {
    let response;
    try { response = await fetch(path, { ...options, headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}) } }); }
    catch { throw new Error('Não foi possível conectar à API.'); }
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.erro || data?.detalhe || `A API respondeu com erro (${response.status}).`);
    return data;
  }

  let cart, addresses = [], selectedAddress = null;
  try {
    [cart, addresses] = await Promise.all([Cart.get(), request('/api/enderecos')]);
  } catch (error) {
    page.innerHTML = `<div class="done"><h1>Não foi possível iniciar a compra</h1><p>${esc(error.message)}</p><a class="btn" href="carrinho.html">Voltar ao carrinho</a></div>`;
    return;
  }
  if (!cart.itens?.length) { location.replace('carrinho.html'); return; }

  const buyerSection = Array.from(form.querySelectorAll('.co-card')).find(section => section.querySelector('#guest-hint'));
  if (buyerSection) buyerSection.hidden = true;
  const paymentSection = Array.from(form.querySelectorAll('.co-card')).find(section => /Pagamento/.test(section.innerText));
  if (paymentSection) paymentSection.innerHTML = '<div class="co-head"><span class="ico"><i class="fa-solid fa-circle-info"></i></span><div><h2>Pagamento</h2><p>Esta versão registra pedidos no banco, sem integração de cobrança.</p></div></div><p class="co-hint co-hint--demo">O pedido ficará aguardando pagamento. Nenhum dado de cartão será solicitado ou armazenado.</p>';
  const freightNote = $('.co-hint--demo');
  if (freightNote && freightNote.closest('.co-card') !== paymentSection) freightNote.textContent = 'O tipo de entrega fica registrado no pedido. Cálculo de frete e integração com transportadora ainda não estão disponíveis.';

  $('#items').innerHTML = `<div class="co-head"><span class="ico"><i class="fa-solid fa-cart-shopping"></i></span><div><h2>Itens do pedido</h2><p>Valores confirmados pela API</p></div></div>${cart.itens.map(item => `<div class="item-row"><div class="th"><img src="${esc(window.PixelProductImage ? window.PixelProductImage(item.imagens?.[0]) : '/IMG/produtos/produto-placeholder.svg')}" alt=""></div><div><h3>${esc(item.nome)}</h3><div class="pr">${brl(item.subtotal)}<small>${item.quantidade} × ${brl(item.precoUnitario)}</small></div></div></div>`).join('')}`;

  const cepInput = form.elements.cep;
  cepInput.addEventListener('input', () => {
    const digits = cepInput.value.replace(/\D/g, '').slice(0, 8);
    cepInput.value = digits.length > 5 ? digits.slice(0, 5) + '-' + digits.slice(5) : digits;
  });
  form.elements.uf.addEventListener('input', event => event.target.value = event.target.value.replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase());

  function fillAddress(address) {
    selectedAddress = address || null;
    $('#addr-view').hidden = !address;
    $('#addr-form').hidden = !!address;
    if (!address) return;
    $('#addr-view').innerHTML = `<div class="l"><i class="fa-solid fa-location-dot loc"></i><div><strong>${esc(address.rua)}, Nº ${esc(address.numero)}${address.complemento ? ' – ' + esc(address.complemento) : ''}</strong><small>CEP ${esc(address.cep)} • ${esc(address.bairro)}, ${esc(address.cidade)} - ${esc(address.uf)}</small></div></div><button type="button" class="link-btn" id="addr-edit">Alterar endereço</button>`;
    $('#addr-edit').onclick = () => {
      for (const [field, key] of [['cep', 'cep'], ['rua', 'rua'], ['numero', 'numero'], ['compl', 'complemento'], ['bairro', 'bairro'], ['cidade', 'cidade'], ['uf', 'uf']]) form.elements[field].value = address[key] || '';
      $('#addr-view').hidden = true; $('#addr-form').hidden = false;
    };
  }
  if (addresses.length) fillAddress(addresses[0]);
  else { $('#addr-view').hidden = true; $('#addr-form').hidden = false; }

  $('#addr-save').onclick = async () => {
    const value = {
      cep: cepInput.value.replace(/\D/g, ''), rua: form.elements.rua.value.trim(), numero: form.elements.numero.value.trim(),
      complemento: form.elements.compl.value.trim(), bairro: form.elements.bairro.value.trim(),
      cidade: form.elements.cidade.value.trim(), uf: form.elements.uf.value.trim().toUpperCase()
    };
    if (value.cep.length !== 8 || !value.rua || !value.numero || !value.bairro || !value.cidade || value.uf.length !== 2) {
      $('#addr-message').textContent = 'Preencha todos os campos obrigatórios e confira o CEP.';
      return;
    }
    const button = $('#addr-save'); button.disabled = true;
    try {
      const saved = await request('/api/enderecos', { method: 'POST', body: JSON.stringify(value) });
      addresses.push(saved); fillAddress(saved); $('#addr-message').textContent = '';
    } catch (error) { $('#addr-message').textContent = error.message; }
    finally { button.disabled = false; }
  };

  $('#ship-opts').innerHTML = '<label class="opt active"><input type="radio" name="ship" value="ENTREGA" checked><span class="radio"></span><span class="n">Entrega no endereço<small>Frete ainda não integrado</small></span><span class="v">A confirmar</span></label>';

  $('#summary').innerHTML = `<h2>Resumo do pedido</h2><div class="s-line"><span>Produtos (${cart.quantidadeItens} ${cart.quantidadeItens === 1 ? 'item' : 'itens'})</span><b>${brl(cart.subtotal)}</b></div><div class="s-line"><span>Entrega</span><b>A confirmar</b></div><div class="s-total"><div><span>Total parcial</span><small>Calculado a partir dos preços do banco</small></div><strong>${brl(cart.subtotal)}</strong></div><div class="form-err" id="form-err"></div><button type="submit" class="btn-pay" id="pay-btn">Registrar pedido <i class="fa-solid fa-arrow-right"></i></button><p class="terms">Nenhuma cobrança será feita nesta versão.</p>`;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const errorBox = $('#form-err');
    if (!selectedAddress) { errorBox.textContent = 'Salve e selecione um endereço antes de continuar.'; errorBox.classList.add('show'); return; }
    const button = $('#pay-btn'); button.disabled = true; button.textContent = 'Registrando pedido…'; errorBox.textContent = '';
    try {
      const order = await request('/api/pedidos', { method: 'POST', body: JSON.stringify({ entrega: form.elements.ship.value, enderecoId: selectedAddress.id }) });
      page.innerHTML = `<div class="done"><div class="ok"><i class="fa-solid fa-check"></i></div><h1>Pedido registrado</h1><p>O pedido foi salvo no banco e está aguardando pagamento. Esta versão não processa cobrança.</p><div class="num">Pedido ${esc(String(order.id).slice(0, 8).toUpperCase())}</div><p>Total: <b>${brl(order.total)}</b> · status: ${esc(order.status)}</p><a class="btn" href="conta-pedidos.html">Ver meus pedidos</a></div>`;
      window.scrollTo(0, 0);
    } catch (error) { errorBox.textContent = error.message; errorBox.classList.add('show'); button.disabled = false; button.innerHTML = 'Registrar pedido <i class="fa-solid fa-arrow-right"></i>'; }
  });
});
