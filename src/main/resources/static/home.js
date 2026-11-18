document.addEventListener('DOMContentLoaded', async () => {
    await (window.PixelCatalogReady || Promise.resolve());

    const escHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const productsGrid = document.querySelector('#produtos .products-grid');
    if (productsGrid) {
        const products = Object.entries(PRODUCTS);
        const money = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const notice = document.createElement('p');
        notice.className = 'catalog-source-note';
        notice.style.cssText = 'margin:0 0 18px;color:var(--muted,#64748b);font-size:13px';
        if (window.PixelCatalogSource === 'api-empty') {
            productsGrid.innerHTML = '<div class="catalog-empty" style="grid-column:1/-1;padding:36px;text-align:center;border:1px dashed #64748b55;border-radius:16px"><h3>O catálogo ainda está vazio</h3><p>Entre no painel administrativo e cadastre o primeiro produto para publicá-lo na loja.</p></div>';
        } else if (window.PixelCatalogSource === 'api-error') {
            productsGrid.innerHTML = '<div class="catalog-empty" style="grid-column:1/-1;padding:36px;text-align:center;border:1px dashed #ef444455;border-radius:16px"><h3>Não foi possível carregar os produtos</h3><p>Confira se o servidor está conectado ao banco de dados e atualize a página.</p></div>';
        } else {
            notice.textContent = 'Catálogo conectado à API · produtos carregados do banco de dados.';
            productsGrid.before(notice);
        }
        if (products.length) {
            productsGrid.innerHTML = products.map(([id, p]) => {
                const version = p.versoes[0] || { preco: 0 };
                const image = window.PixelProductImage ? window.PixelProductImage(p.imagens && p.imagens[0]) : '/IMG/produtos/produto-placeholder.svg';
                const badge = p.badge ? `<span class="card-badge badge-blue">${escHtml(p.badge)}</span>` : '';
                const stock = Number.isFinite(Number(p.estoque)) ? Number(p.estoque) : 10;
                return `<article class="product-card" data-id="${escHtml(id)}">
                    ${badge}
                    <div class="card-image"><a href="produto.html?id=${encodeURIComponent(id)}"><img src="${escHtml(image)}" alt="${escHtml(p.nome)}" loading="lazy" onerror="this.onerror=null;this.src='/IMG/produtos/produto-placeholder.svg'"></a></div>
                    <div class="card-info">
                        <div class="card-meta"><span class="meta-tag">${escHtml(p.categoria)}</span><span>${stock > 0 ? `${stock} un. disponíveis` : 'Indisponível'}</span></div>
                        <h3 class="product-title"><a href="produto.html?id=${encodeURIComponent(id)}" style="color:inherit;text-decoration:none">${escHtml(p.nome)}</a></h3>
                        <p class="product-desc">${escHtml(p.descricao || p.subtitulo || '')}</p>
                        <div class="price-container"><span class="price">${money(version.preco)}</span><span class="installments"></span></div>
                        <button class="btn-add-cart" type="button" ${stock <= 0 ? 'disabled' : ''}>${stock <= 0 ? 'Produto indisponível' : 'Adicionar ao carrinho'} <i class="fa-solid fa-cart-plus"></i></button>
                    </div>
                </article>`;
            }).join('');
        }
    }


    const heroSlides = [
        {
            tag: "DE COLECIONADOR PARA COLECIONADOR",
            title: 'SUA PRÓXIMA<br>CARTA LENDÁRIA<br><span style="color: #38BDF8;">ESTÁ AQUI.</span>',
            description: "Da primeira abertura à peça que faltava no seu binder. Encontre o extraordinário em cada carta Pokémon na Pixel TCG.",
            btnPrimary: 'Explorar cartas <i class="fa-solid fa-arrow-up-right-from-square"></i>',
            btnSecondary: 'Ver lançamentos <i class="fa-solid fa-arrow-up-right-from-square"></i>',
            primary: { sx: { cats: '', q: '' } },
            secondary: { scroll: '#produtos' }
        },
        {
            tag: "NOVIDADES NA LOJA",
            title: 'EXCLUSIVIDADES E<br>BINDERS PREMIUM<br><span style="color: #38BDF8;">PARA O SEU SET.</span>',
            description: "Proteja a sua coleção com a melhor linha de sleeves, top loaders e pastas com páginas duplas.",
            btnPrimary: 'Ver Acessórios <i class="fa-solid fa-arrow-up-right-from-square"></i>',
            btnSecondary: 'Saiba mais <i class="fa-solid fa-arrow-up-right-from-square"></i>',
            primary: { sx: { cats: 'Acessórios', q: '' } },
            secondary: { scroll: '#categorias' }
        },
        {
            tag: "CATÁLOGO PIXEL TCG",
            title: 'ENCONTRE SEU<br>PRÓXIMO ITEM<br><span style="color: #38BDF8;">DE COLECIONADOR.</span>',
            description: "Explore os produtos cadastrados na loja e acompanhe a disponibilidade atualizada pelo catálogo.",
            btnPrimary: 'Ver catálogo <i class="fa-solid fa-arrow-up-right-from-square"></i>',
            btnSecondary: 'Conheça a loja <i class="fa-solid fa-arrow-up-right-from-square"></i>',
            primary: { scroll: '#produtos' },
            secondary: { scroll: '#beneficios' }
        }
    ];

    let currentSlide = 0;
    const heroTag = document.querySelector('.hero-tag');
    const heroTitle = document.getElementById('hero-title');
    const heroDesc = document.getElementById('hero-desc');
    const btnPrimary = document.getElementById('btn-primary');
    const btnSecondary = document.getElementById('btn-secondary');
    const dots = document.querySelectorAll('.carousel-indicators .dot');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    // Define para onde o botão do carrossel leva: abrir o painel de filtros (sx) ou rolar até uma seção (scroll).
    function setTarget(btn, t) {
        if (!btn || !t) return;
        ['data-sx', 'data-sx-cats', 'data-sx-q', 'data-scroll'].forEach(a => btn.removeAttribute(a));
        if (t.sx) {
            btn.setAttribute('data-sx', '');
            btn.dataset.sxCats = t.sx.cats || '';
            btn.dataset.sxQ = t.sx.q || '';
            btn.setAttribute('href', '#');
        } else if (t.scroll) {
            btn.setAttribute('data-scroll', '');
            btn.setAttribute('href', t.scroll);
        }
    }

    // Rola suavemente até a seção e dá um destaque rápido nela.
    document.addEventListener('click', e => {
        const a = e.target.closest('[data-scroll]');
        if (!a) return;
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        if (window.PixelSearch) window.PixelSearch.close();
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const hl = target.matches('span:empty') ? document.querySelector('#produtos .products-grid') : target;
        hl.classList.remove('flash-target');
        void hl.offsetWidth;
        hl.classList.add('flash-target');
        setTimeout(() => hl.classList.remove('flash-target'), 1400);
    });

    function updateSlide(index) {
        currentSlide = index;
        const slide = heroSlides[currentSlide];

        const heroText = document.querySelector('.hero-text');
        if (heroText) heroText.style.opacity = '0.3';

        setTimeout(() => {
            if (heroTag) heroTag.textContent = slide.tag;
            if (heroTitle) heroTitle.innerHTML = slide.title;
            if (heroDesc) heroDesc.textContent = slide.description;
            if (btnPrimary) btnPrimary.innerHTML = slide.btnPrimary;
            if (btnSecondary) btnSecondary.innerHTML = slide.btnSecondary;
            setTarget(btnPrimary, slide.primary);
            setTarget(btnSecondary, slide.secondary);
            if (heroText) heroText.style.opacity = '1';
        }, 150);

        dots.forEach((dot, idx) => {
            if (idx === currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    setTarget(btnPrimary, heroSlides[0].primary);
    setTarget(btnSecondary, heroSlides[0].secondary);

    if (dots.length > 0) {
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                updateSlide(index);
                resetAutoSlide();
            });
        });
    }

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            currentSlide = (currentSlide - 1 + heroSlides.length) % heroSlides.length;
            updateSlide(currentSlide);
            resetAutoSlide();
        });

        nextBtn.addEventListener('click', () => {
            currentSlide = (currentSlide + 1) % heroSlides.length;
            updateSlide(currentSlide);
            resetAutoSlide();
        });
    }

    let slideInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % heroSlides.length;
        updateSlide(currentSlide);
    }, 6000);

    function resetAutoSlide() {
        clearInterval(slideInterval);
        slideInterval = setInterval(() => {
            currentSlide = (currentSlide + 1) % heroSlides.length;
            updateSlide(currentSlide);
        }, 6000);
    }

    // O resumo de pagamento permanece indisponível até a integração com um provedor.
    if (typeof Cart !== 'undefined' && typeof PRODUCTS !== 'undefined') {
        document.querySelectorAll('.product-card[data-id]').forEach(card => {
            const el = card.querySelector('.installments');
            if (el) el.textContent = 'Pagamento ainda não integrado';
        });
        const ft = document.getElementById('feat-parc');
        if (ft) ft.textContent = 'Pagamento indisponível';
    }

    document.querySelectorAll('button.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', async () => {
            const card = btn.closest('[data-id]');
            if (!card || typeof Cart === 'undefined') return;
            const originalText = btn.innerHTML;
            btn.disabled = true;
            try { await Cart.add(card.dataset.id, 0, 1); }
            catch (error) { btn.disabled = false; btn.title = error.message; return; }
            btn.innerHTML = 'Adicionado! <i class="fa-solid fa-check"></i>';
            btn.style.backgroundColor = '#10b981';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.backgroundColor = '';
                btn.disabled = false;
            }, 1500);
        });
    });
});
