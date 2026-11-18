// Carrega somente produtos persistidos pela API. Falhas nunca são substituídas por exemplos.
(function () {
  const PLACEHOLDER = '/IMG/produtos/produto-placeholder.svg';
  const isDirectImage = value => /^(data:image\/|https?:\/\/|\/)/i.test(String(value || ''));

  window.PixelProductImage = value => {
    if (!value) return PLACEHOLDER;
    const image = String(value);
    if (isDirectImage(image)) return image;
    return '/IMG/produtos/' + image.replace(/^\/+/, '');
  };

  window.PixelCatalogSource = 'carregando';
  window.PixelCatalogError = null;
  window.PixelCatalogReady = (async () => {
    try {
      const response = await fetch('/api/produtos', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('A API do catálogo respondeu com erro (' + response.status + ').');
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('A resposta da API do catálogo está em um formato inesperado.');

      Object.keys(PRODUCTS).forEach(id => delete PRODUCTS[id]);
      data.forEach(item => {
        const images = Array.isArray(item.imagens) && item.imagens.length ? item.imagens : [PLACEHOLDER];
        PRODUCTS[String(item.id)] = {
          id: String(item.id),
          nome: item.nome || 'Produto sem nome',
          badge: item.selo || '',
          categoria: item.categoria || 'Outros',
          marca: item.franquia || 'Pixel TCG',
          colecao: item.edicao || '',
          edicao: item.edicao || '',
          idioma: item.idioma || '',
          subtitulo: item.subtitulo || '',
          imagens: images,
          versoes: [{
            nome: item.idioma || item.nome || 'Versão padrão',
            desc: item.subtitulo || '',
            preco: Number(item.preco) || 0,
            parcelas: Number(item.parcelas) || 1
          }],
          descricao: item.descricao || item.detalhe || '',
          specs: Array.isArray(item.especificacoes) ? item.especificacoes.map(spec => [spec.rotulo, spec.valor]) : [],
          sku: item.sku || '',
          estoque: Number(item.estoque) || 0,
          minimo: Number(item.estoqueMinimo) || 0,
          ativo: item.ativo !== false
        };
      });
      window.PixelCatalogSource = data.length ? 'api' : 'api-empty';
    } catch (error) {
      Object.keys(PRODUCTS).forEach(id => delete PRODUCTS[id]);
      window.PixelCatalogSource = 'api-error';
      window.PixelCatalogError = error;
      console.error('Pixel TCG: catálogo indisponível na API.', error);
    }
    return PRODUCTS;
  })();
})();
