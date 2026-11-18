// Páginas da conta do cliente: Meus Pedidos, Dados Cadastrais & Senha e Configurações (com exclusão de conta).
document.addEventListener('DOMContentLoaded', async () => {
  await (window.PixelCatalogReady || Promise.resolve());
  if (!Conta.requireLogin()) return;
  const page = document.body.dataset.page;
  const $ = (s, r = document) => r.querySelector(s);
  const brl = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const fmt = t => { const d = new Date(t); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} às ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  let u = Conta.user();
  const nPedidos = 0;

  // ---------- casca ----------
  const titles = { pedidos: ['Meus Pedidos', 'Acompanhe suas compras e o código de rastreio.'], dados: ['Meus dados e senha', 'Mantenha seus dados e a segurança da sua conta em dia.'], config: ['Configurações', 'Ajuste o site do seu jeito ou encerre sua conta.'] };
  const nav = [['pedidos', 'fa-box-archive', 'Meus Pedidos', 'conta-pedidos.html'], ['dados', 'fa-user-gear', 'Meus dados e senha', 'conta-dados.html'], ['config', 'fa-sliders', 'Configurações', 'conta-config.html']];
  document.body.insertAdjacentHTML('afterbegin', `
    <div class="top-notice">SEU PRÓXIMO PULL COMEÇA AQUI. Produtos cadastrados no catálogo da Pixel TCG.</div>
    <header>
      <div class="header-main">
        <a href="home.html" class="logo"><img src="IMG/logo.png" alt="Pixel TCG Logo"></a>
        <div class="search-bar"><input type="text" placeholder="Buscar cartas, boosters, coleções e muito mais..."><button type="button"><i class="fa-solid fa-magnifying-glass"></i></button></div>
        <div class="header-actions">
          <a href="login.html" class="user-account"><i class="fa-regular fa-user"></i><div><span class="subtext">Olá, colecionador</span><span class="action-text">Entre ou cadastre-se</span></div></a>
          <a href="carrinho.html" class="cart-btn"><i class="fa-solid fa-cart-shopping"></i><span class="cart-label">Carrinho</span><span class="cart-count">0</span></a>
        </div>
      </div>
      <nav class="nav-categories"><ul>
        <li><a href="#" class="nav-all"><i class="fa-solid fa-bars"></i> Todas as categorias</a></li>
        <li><a href="#">Boosters</a></li><li><a href="#">Boxes e coleções</a></li><li><a href="#">Acessórios</a></li>
      </ul></nav>
    </header>
    <div class="ac-wrap">
      <aside class="ac-side" aria-label="Menu da conta"><div class="ac-me" id="ac-me"></div>
        ${nav.map(n => `<a href="${n[3]}" class="${n[0] === page ? 'active' : ''}" ${n[0] === page ? 'aria-current="page"' : ''}><i class="fa-solid ${n[1]}"></i>${n[2]}${n[0] === 'pedidos' && nPedidos ? `<span class="ac-count">${nPedidos}</span>` : ''}</a>`).join('')}
        <a href="home.html" class="ac-back"><i class="fa-solid fa-store"></i>Continuar comprando</a>
        <a href="#" id="side-out"><i class="fa-solid fa-arrow-right-from-bracket"></i>Sair da conta</a></aside>
      <main class="ac-main"><nav class="ac-crumbs" aria-label="Você está em"><a href="home.html"><i class="fa-solid fa-house"></i> Início</a><i class="fa-solid fa-chevron-right"></i><span>Minha conta</span><i class="fa-solid fa-chevron-right"></i><b>${titles[page][0]}</b></nav><div class="ac-title"><h1>${titles[page][0]}</h1><p>${titles[page][1]}</p></div><div id="view"></div></main>
    </div>
    <footer class="site-footer"><div class="footer-container">
      <div class="footer-col brand-col"><img src="IMG/logo.png" alt="Pixel TCG" class="footer-logo"><p>Loja oficial de cartas Pokémon, boosters e acessórios para colecionadores. Originalidade, curadoria e envio seguro para todo o Brasil.</p></div>
      <div class="footer-col"><h3>LOJA</h3><ul><li><a href="#" data-sx data-sx-cats="Boosters &amp; Boxes">Boosters</a></li><li><a href="#" data-sx data-sx-cats="Boosters &amp; Boxes">Boxes e coleções</a></li><li><a href="#" data-sx data-sx-cats="Acessórios">Acessórios</a></li></ul></div>
      <div class="footer-col"><h3>MINHA CONTA</h3><ul>${nav.map(n => `<li><a href="${n[3]}">${n[2]}</a></li>`).join('')}</ul></div>
      <div class="footer-col"><h3>PODEMOS AJUDAR?</h3><ul><li><a href="#">WhatsApp</a></li><li><a href="#">Termos de Uso</a></li></ul></div>
    </div><div class="footer-bottom"><p>&copy; 2026 Pixel TCG. Todos os direitos reservados.</p><div class="security-badge"><i class="fa-solid fa-shield-halved"></i> AMBIENTE SEGURO</div></div></footer>
    <div class="ac-toast" id="toast" role="status" aria-live="polite"></div>`);
  const view = $('#view');
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600); };
  const paintMe = () => { u = Conta.user(); $('#ac-me').innerHTML = `${Conta.avatarHtml(u, 'acct-avatar sm')}<div><b>${esc(u.nome)}</b><small>${esc(u.email)}</small></div>`; };
  paintMe();
  Conta.refresh().then(user => { u = user; paintMe(); }).catch(() => { Conta.logout(); location.replace('login.html'); });
  $('#side-out').addEventListener('click', e => { e.preventDefault(); Conta.logout(); location.href = 'login.html'; });
  Conta.mountHeader(); Cart.updateBadge();
  document.title = `${titles[page][0]} - Pixel TCG`;

  // ---------- Meus Pedidos ----------
  if (page === 'pedidos') {
    let orders = [];
    try { orders = await Orders.mine(); }
    catch (error) { view.innerHTML = `<div class="ac-card"><div class="ac-empty">${esc(error.message || 'Não foi possível carregar os pedidos.')}</div></div>`; return; }
    const groups = [['todos', 'Todos', () => true], ['andamento', 'Em andamento', o => ['aguardando', 'separacao'].includes(Orders.status(o))], ['enviado', 'Enviados', o => Orders.status(o) === 'enviado'], ['entregue', 'Entregues', o => Orders.status(o) === 'entregue'], ['cancelado', 'Cancelados', o => Orders.status(o) === 'cancelado']];
    let tab = 'todos';
    const card = o => {
      const st = Orders.status(o);
      return `<article class="ac-order"><div class="ac-order-h"><div><b>Pedido ${esc(Orders.label(o))}</b><small>${fmt(o.createdAt)}</small></div><span class="ac-pill ${st}">${Orders.STATUS[st]}</span></div>
        <div class="ac-lines">${o.itens.map(i => `<div><span>${i.qty}× ${esc(i.nome || (PRODUCTS[i.id] ? nomeCurto(PRODUCTS[i.id]) : 'Produto'))}</span><span>${brl(i.preco * i.qty)}</span></div>`).join('')}</div>
        ${st === 'aguardando' ? `<div class="ac-track"><i class="fa-regular fa-clock"></i> Aguardando pagamento. Esta versão não processa cobranças.</div><button type="button" class="btn-ghost" data-cancel="${esc(o.id)}">Cancelar pedido</button>` : ''}
        <div class="ac-order-f"><span>Entrega: ${esc(o.entrega)} · ${esc(o.endereco?.cidade || '')}/${esc(o.endereco?.uf || '')}</span><span>Total <b>${brl(o.total)}</b></span></div></article>`;
    };
    const paint = () => {
      const g = groups.find(x => x[0] === tab), list = orders.filter(g[2]);
      const tabs = orders.length ? `<div class="ac-tabs" role="tablist">${groups.map(x => { const n = orders.filter(x[2]).length; return `<button type="button" role="tab" aria-selected="${x[0] === tab}" class="${x[0] === tab ? 'on' : ''}" data-tab="${x[0]}">${x[1]}<span>${n}</span></button>`; }).join('')}</div>` : '';
      view.innerHTML = tabs + `<div class="ac-card">${list.length ? list.map(card).join('') : orders.length
        ? `<div class="ac-empty"><i class="fa-regular fa-folder-open"></i>Nenhum pedido em “${g[1]}”.<br><br><button type="button" class="btn-ghost" data-tab="todos">Ver todos os pedidos</button></div>`
        : `<div class="ac-empty"><i class="fa-solid fa-box-open"></i>Você ainda não fez nenhum pedido por aqui.<br><br><a class="btn-blue" href="home.html">Explorar a loja</a></div>`}</div>`;
    };
    view.addEventListener('click', e => { const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; paint(); } });
    view.addEventListener('click', async e => {
      const button = e.target.closest('[data-cancel]'); if (!button) return;
      button.disabled = true;
      try { await Orders.cancel(button.dataset.cancel); orders = await Orders.mine(); paint(); }
      catch (error) { toast(error.message || 'Não foi possível cancelar o pedido.'); button.disabled = false; }
    });
    paint();
  }

  // ---------- Dados Cadastrais & Senha ----------
  if (page === 'dados') {
    const maskCpf = v => { v = String(v).replace(/\D/g, '').slice(0, 11); return v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'); };
    const mask = v => { v = v.replace(/\D/g, '').slice(0, 11); return v.length > 10 ? v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') : v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, ''); };
    view.innerHTML = `
      <div class="ac-card"><div class="ac-band"><span class="ico blue"><i class="fa-regular fa-id-card"></i></span><div><b>Dados cadastrais</b><small>É assim que a gente reconhece você nos seus pedidos.</small></div></div>
        <form class="ac-body" id="f-dados" novalidate>
          <div class="ac-avatar-row" style="margin-bottom:20px"><span id="av">${Conta.avatarHtml(u, 'acct-avatar xl')}</span>
            <div><button type="button" class="btn-ghost" id="av-pick"><i class="fa-solid fa-camera"></i> ${u.avatar ? 'Trocar foto' : 'Adicionar foto'}</button><input type="file" id="av-file" accept="image/*" hidden>
              ${u.avatar ? '<button type="button" class="btn-ghost" id="av-rm" style="margin-left:8px">Remover</button>' : ''}<p>JPG ou PNG. A foto é salva no seu perfil.</p><span class="err" id="e-av" style="display:block;margin-top:6px"></span></div></div>
          <div class="ac-form">
            <label>Nome<input name="nome" maxlength="80" autocomplete="name" value="${esc(u.nome)}" required></label>
            <label>CPF<input name="cpf" inputmode="numeric" maxlength="14" autocomplete="off" placeholder="000.000.000-00" value="${esc(maskCpf(u.cpf || ''))}" ${u.cpf ? 'readonly' : ''}><small>${u.cpf ? 'O CPF é o que identifica você na loja, por isso não dá para trocar.' : 'Informe seu CPF para identificar sua conta. Depois de salvo, não dá para trocar.'}</small></label>
            <label>E-mail<input name="email" type="email" autocomplete="email" value="${esc(u.email)}" required><small>É o e-mail do login e dos avisos de pedido. Seus pedidos continuam na conta se você trocar.</small></label>
            <label>Telefone<input name="tel" inputmode="tel" autocomplete="tel" placeholder="(13) 99999-9999" value="${esc(u.tel || '')}"></label>
            <label>Cidade / UF<input name="cidade" maxlength="60" autocomplete="address-level2" placeholder="Santos / SP" value="${esc(u.cidade || '')}"></label>
          </div>
          <div class="ac-form" style="margin-top:8px"><span class="err" id="e-dados"></span></div>
          <div class="ac-actions"><button class="btn-blue" type="submit"><i class="fa-solid fa-floppy-disk"></i> Salvar dados</button></div>
        </form></div>
      <div class="ac-card"><div class="ac-band"><span class="ico blue"><i class="fa-solid fa-key"></i></span><div><b>Alterar senha</b><small>Use pelo menos 8 caracteres, com letras e números.</small></div></div>
        <form class="ac-body" id="f-senha" novalidate>
          <div class="ac-demo"><i class="fa-solid fa-triangle-exclamation"></i> Sua senha é alterada com segurança no servidor.</div>
          <div class="ac-form">
            <label class="full">Senha atual<input type="password" name="atual" autocomplete="current-password"></label>
            <label>Nova senha<input type="password" name="nova" autocomplete="new-password"></label>
            <label>Confirmar nova senha<input type="password" name="conf" autocomplete="new-password"></label>
          </div>
          <div class="ac-form" style="margin-top:8px"><span class="err" id="e-senha"></span></div>
          <div class="ac-actions"><button class="btn-blue" type="submit"><i class="fa-solid fa-lock"></i> Atualizar senha</button></div>
        </form></div>`;
    const fd = $('#f-dados');
    fd.tel.addEventListener('input', () => fd.tel.value = mask(fd.tel.value));
    fd.cpf.addEventListener('input', () => fd.cpf.value = maskCpf(fd.cpf.value));
    fd.addEventListener('submit', async e => {
      e.preventDefault();
      const nome = fd.nome.value.trim(); if (nome.length < 2) { $('#e-dados').textContent = 'Digite seu nome.'; return; }
      const email = fd.email.value.trim(); if (!Conta.validEmail(email)) { $('#e-dados').textContent = 'Confira o e-mail: ele parece estar incompleto.'; return; }
      const cpfNovo = fd.cpf.readOnly ? '' : fd.cpf.value;
      if (cpfNovo && !Conta.validCpf(cpfNovo)) { $('#e-dados').textContent = 'Confira o CPF.'; return; }
      const t = fd.tel.value.replace(/\D/g, ''); if (t && ![10, 11].includes(t.length)) { $('#e-dados').textContent = 'Confira o telefone: ele precisa ter DDD e 8 ou 9 dígitos.'; return; }
      try {
        u = await Conta.update({ nome, email, tel: fd.tel.value.trim(), cidade: fd.cidade.value.trim(), ...(cpfNovo ? { cpf: cpfNovo.replace(/\D/g, '') } : {}) });
        if (cpfNovo) fd.cpf.readOnly = true;
        $('#e-dados').textContent = ''; paintMe(); toast('Dados salvos.');
      } catch (error) { $('#e-dados').textContent = error.message || 'Não foi possível salvar os dados.'; }
    });
    const avErr = m => { $('#e-av').textContent = m || ''; };
    $('#av-pick').addEventListener('click', () => { avErr(''); $('#av-file').click(); });
    $('#av-file').addEventListener('change', e => {
      const file = e.target.files[0]; if (!file) return;
      avErr('');
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = async () => {
        const s = 160, c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d');
        const m = Math.min(img.width, img.height); x.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s);
        URL.revokeObjectURL(url);
        try { u = await Conta.update({ avatar: c.toDataURL('image/jpeg', .85) }); paintMe(); avErr(''); toast('Foto atualizada.'); }
        catch (error) { avErr(error.message || 'Não foi possível salvar a foto.'); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); e.target.value = ''; avErr('Não consegui ler essa imagem. Use uma foto JPG ou PNG (fotos HEIC do iPhone não funcionam).'); };
      img.src = url;
    });
    const rm = $('#av-rm'); if (rm) rm.onclick = async () => { try { u = await Conta.update({ avatar: '' }); paintMe(); toast('Foto removida.'); } catch (error) { avErr(error.message || 'Não foi possível remover a foto.'); } };
    $('#f-senha').addEventListener('submit', async e => {
      e.preventDefault(); const f = e.target, er = $('#e-senha');
      if (!f.atual.value) return er.textContent = 'Digite a sua senha atual.';
      const issue = Conta.passwordIssue(f.nova.value); if (issue) return er.textContent = issue;
      if (f.nova.value !== f.conf.value) return er.textContent = 'As duas senhas novas precisam ser iguais.';
      if (f.nova.value === f.atual.value) return er.textContent = 'Escolha uma senha diferente da atual.';
      const r = await Conta.changePassword(f.atual.value, f.nova.value);
      if (r === 'wrong') return er.textContent = 'A senha atual não confere.';
      if (r !== 'ok') return er.textContent = 'Não foi possível alterar a senha agora. Confira sua conexão e tente novamente.';
      er.textContent = ''; f.reset(); toast('Senha atualizada.');
    });
  }

  // ---------- Configurações + exclusão ----------
  if (page === 'config') {
    view.innerHTML = `
      <div class="ac-card"><div class="ac-band"><span class="ico blue"><i class="fa-solid fa-sliders"></i></span><div><b>Preferências</b><small>Aparência e avisos.</small></div></div>
        <div class="ac-pref"><div>Tema do site<small>Claro ou escuro; a escolha vale até fechar esta aba.</small></div>
          <div class="theme-seg" role="group" aria-label="Tema"><button type="button" data-theme-set="light" aria-label="Tema claro"><i class="fa-regular fa-sun"></i></button><button type="button" data-theme-set="dark" aria-label="Tema escuro"><i class="fa-regular fa-moon"></i></button></div></div>
        <div class="ac-pref"><div>Avisos e novidades<small>Preferências de notificação ainda não têm API configurada.</small></div><span class="ac-count">Indisponível</span></div></div>
      <div class="ac-card"><div class="ac-band"><span class="ico"><i class="fa-solid fa-user-slash"></i></span><div><b>Exclusão definitiva</b><small>Encerramento voluntário da conta.</small></div></div>
        <div class="ac-body"><div class="ac-danger"><div><h3><i class="fa-solid fa-triangle-exclamation"></i> Excluir ou Desativar Definitivamente a Conta</h3>
          <p>Seu acesso, perfil, endereços e carrinho serão removidos. Os registros de pedidos poderão ser mantidos pela loja sem vínculo com a sua conta (${esc(u.email)}). Esta ação não pode ser desfeita.</p></div>
          <button class="btn-danger" id="del-open" type="button"><i class="fa-regular fa-trash-can"></i> Solicitar exclusão da conta</button></div></div></div>`;
    view.querySelectorAll('[data-theme-set]').forEach(b => b.addEventListener('click', () => Theme.set(b.dataset.themeSet)));
    Theme.set(Theme.get());

    $('#del-open').addEventListener('click', () => {
      const bg = document.createElement('div'); bg.className = 'ac-modal-bg';
      bg.innerHTML = `<div class="ac-modal" role="alertdialog" aria-modal="true" aria-labelledby="dm-t">
        <h3 id="dm-t"><i class="fa-solid fa-triangle-exclamation"></i> Excluir conta definitivamente?</h3>
        <p>Ao confirmar:</p>
        <ul><li>seu acesso, dados e endereços de conta serão removidos;</li><li>o histórico de pedidos poderá ser mantido pela loja sem vínculo com sua conta;</li><li>o e-mail <b>${esc(u.email)}</b> deixará de identificar uma conta ativa.</li></ul>
        <label>Para confirmar, digite <b>EXCLUIR</b><input id="dm-word" autocomplete="off" spellcheck="false" placeholder="EXCLUIR"></label>
        <div class="row"><button type="button" class="btn-ghost" id="dm-no">Manter minha conta</button><button type="button" class="btn-danger" id="dm-yes" disabled><i class="fa-regular fa-trash-can"></i> Excluir para sempre</button></div></div>`;
      document.body.appendChild(bg);
      const word = $('#dm-word', bg), yes = $('#dm-yes', bg), close = () => { bg.remove(); document.removeEventListener('keydown', onKey); };
      const onKey = e => { if (e.key === 'Escape') close(); };
      document.addEventListener('keydown', onKey); word.focus();
      bg.addEventListener('click', e => { if (e.target === bg) close(); });
      $('#dm-no', bg).onclick = close;
      word.addEventListener('input', () => yes.disabled = word.value.trim().toUpperCase() !== 'EXCLUIR');
      yes.onclick = async () => {
        if (word.value.trim().toUpperCase() !== 'EXCLUIR') return;
        yes.disabled = true; yes.textContent = 'Excluindo…';
        try { await Conta.deleteAccount(); try { sessionStorage.setItem('pixelTcgFlash', 'Conta excluída.'); } catch {} location.replace('login.html'); }
        catch (error) { yes.disabled = false; yes.textContent = 'Tentar novamente'; toast(error.message || 'Não foi possível excluir a conta.'); }
      };
    });
  }
});
