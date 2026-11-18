// A vitrine inicia vazia e só recebe registros retornados por GET /api/produtos.
const PRODUCTS = Object.create(null);
const nomeCurto = product => String(product?.nome || 'Produto');
