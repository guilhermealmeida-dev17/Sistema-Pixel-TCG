package br.edu.fatecpg.api.product;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import br.edu.fatecpg.api.auth.AuthException;
import br.edu.fatecpg.api.product.AdminProdutoDtos.CriarProdutoRequest;
import br.edu.fatecpg.api.product.AdminProdutoDtos.ProdutoPublicoResponse;
import br.edu.fatecpg.api.product.AdminProdutoDtos.ProdutoResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminProdutoService {
    private final ProdutoRepository produtos;

    public AdminProdutoService(ProdutoRepository produtos) { this.produtos = produtos; }

    @Transactional(readOnly = true)
    public List<ProdutoResponse> listar() {
        return produtos.findAllByOrderByNomeAsc().stream().map(this::paraRespostaAdmin).toList();
    }

    @Transactional(readOnly = true)
    public List<ProdutoPublicoResponse> listarPublico() {
        return produtos.findAllByAtivoTrueOrderByNomeAsc().stream().map(this::paraRespostaPublica).toList();
    }

    @Transactional(readOnly = true)
    public ProdutoPublicoResponse buscarPublico(UUID id) {
        ProdutoEntity produto = produtos.findByIdAndAtivoTrue(id)
                .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "Produto não encontrado."));
        return paraRespostaPublica(produto);
    }

    @Transactional
    public ProdutoResponse cadastrar(CriarProdutoRequest request) {
        String sku = normalizarSku(request.sku());
        if (produtos.existsBySkuIgnoreCase(sku)) {
            throw new AuthException(HttpStatus.CONFLICT, "Já existe um produto com este SKU.");
        }
        ProdutoEntity produto = new ProdutoEntity(
                request.nome().trim(), vazioParaNull(request.subtitulo()), request.categoria().trim(),
                request.franquia().trim(), vazioParaNull(request.edicao()), vazioParaNull(request.idioma()),
                request.preco(), request.estoque(), vazioParaNull(request.selo()), sku,
                request.parcelas(), request.estoqueMinimo(), request.descricao().trim(), detalhe(request)
        );
        preencherRelacionamentos(produto, request);
        return paraRespostaAdmin(produtos.save(produto));
    }

    @Transactional
    public ProdutoResponse atualizar(UUID id, CriarProdutoRequest request) {
        ProdutoEntity produto = produtos.findById(id)
                .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "Produto não encontrado."));
        String sku = normalizarSku(request.sku());
        if (produtos.existsBySkuIgnoreCaseAndIdNot(sku, id)) {
            throw new AuthException(HttpStatus.CONFLICT, "Já existe outro produto com este SKU.");
        }
        produto.atualizar(
                request.nome().trim(), vazioParaNull(request.subtitulo()), request.categoria().trim(),
                request.franquia().trim(), vazioParaNull(request.edicao()), vazioParaNull(request.idioma()),
                request.preco(), request.estoque(), vazioParaNull(request.selo()), sku,
                request.parcelas(), request.estoqueMinimo(), request.descricao().trim(), detalhe(request)
        );
        produto.limparImagens();
        produto.limparEspecificacoes();
        // Aplica os deletes dos relacionamentos antigos antes de recriar a imagem principal.
        // Algumas instalações do banco possuem índice único para uma imagem principal por produto.
        produtos.flush();
        preencherRelacionamentos(produto, request);
        return paraRespostaAdmin(produtos.save(produto));
    }

    @Transactional
    public void arquivar(UUID id) {
        alterarStatus(id, false);
    }

    @Transactional
    public void alterarStatus(UUID id, boolean ativo) {
        ProdutoEntity produto = produtos.findById(id)
                .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "Produto não encontrado."));
        produto.definirAtivo(ativo);
        produtos.save(produto);
    }

    private void preencherRelacionamentos(ProdutoEntity produto, CriarProdutoRequest request) {
        for (int i = 0; i < request.imagens().size(); i++) {
            produto.adicionarImagem(request.imagens().get(i), i == 0, i);
        }
        if (request.especificacoes() != null) {
            request.especificacoes().stream()
                    .filter(item -> item.rotulo() != null && !item.rotulo().isBlank()
                            && item.valor() != null && !item.valor().isBlank())
                    .forEach(item -> produto.adicionarEspecificacao(item.rotulo().trim(), item.valor().trim()));
        }
    }

    private ProdutoResponse paraRespostaAdmin(ProdutoEntity produto) {
        List<String> imagens = imagensOrdenadas(produto);
        List<AdminProdutoDtos.EspecificacaoResponse> especificacoes = especificacoes(produto);
        return new ProdutoResponse(produto.getId(), produto.getNome(), produto.getSubtitulo(), produto.getCategoria(),
                produto.getFranquia(), produto.getEdicao(), produto.getIdioma(), produto.getPreco(), produto.getEstoque(),
                produto.getSelo(), produto.getSku(), produto.getParcelas(), produto.getEstoqueMinimo(),
                produto.getDescricao(), imagens, especificacoes, produto.isAtivo());
    }

    private ProdutoPublicoResponse paraRespostaPublica(ProdutoEntity produto) {
        return new ProdutoPublicoResponse(produto.getId(), produto.getNome(), produto.getSubtitulo(), produto.getCategoria(),
                produto.getFranquia(), produto.getEdicao(), produto.getIdioma(), produto.getPreco(), produto.getEstoque(),
                produto.getSelo(), produto.getParcelas(), produto.getDescricao(), imagensOrdenadas(produto),
                especificacoes(produto));
    }

    private List<String> imagensOrdenadas(ProdutoEntity produto) {
        return produto.getImagens().stream()
                .sorted(Comparator.comparing(ProdutoImagemEntity::getOrdem))
                .map(ProdutoImagemEntity::getUrl).toList();
    }

    private List<AdminProdutoDtos.EspecificacaoResponse> especificacoes(ProdutoEntity produto) {
        return produto.getEspecificacoes().stream()
                .map(item -> new AdminProdutoDtos.EspecificacaoResponse(item.getRotulo(), item.getValor())).toList();
    }

    private String normalizarSku(String value) { return value.trim().toUpperCase(); }
    private String vazioParaNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private String detalhe(CriarProdutoRequest request) {
        String detalhe = vazioParaNull(request.detalhe());
        if (detalhe == null) detalhe = vazioParaNull(request.subtitulo());
        if (detalhe == null) detalhe = request.nome().trim();
        return detalhe.length() <= 150 ? detalhe : detalhe.substring(0, 150);
    }
}
