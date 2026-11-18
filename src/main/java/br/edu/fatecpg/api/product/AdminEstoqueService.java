package br.edu.fatecpg.api.product;

import java.util.List;
import java.util.UUID;

import br.edu.fatecpg.api.auth.AuthException;
import br.edu.fatecpg.api.product.EstoqueDtos.MovimentacaoRequest;
import br.edu.fatecpg.api.product.EstoqueDtos.MovimentacaoResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminEstoqueService {
    private final ProdutoRepository produtos;
    private final MovimentacaoEstoqueRepository movimentacoes;

    public AdminEstoqueService(ProdutoRepository produtos, MovimentacaoEstoqueRepository movimentacoes) {
        this.produtos = produtos;
        this.movimentacoes = movimentacoes;
    }

    @Transactional(readOnly = true)
    public List<MovimentacaoResponse> listarMovimentacoes(UUID produtoId) {
        List<MovimentacaoEstoqueEntity> lista = produtoId == null
                ? movimentacoes.findTop100ByOrderByCriadoEmDesc()
                : movimentacoes.findTop100ByProduto_IdOrderByCriadoEmDesc(produtoId);
        return lista.stream().map(this::resposta).toList();
    }

    @Transactional
    public MovimentacaoResponse movimentar(UUID produtoId, MovimentacaoRequest request) {
        ProdutoEntity produto = produtos.findByIdForUpdate(produtoId)
                .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "Produto não encontrado."));
        int anterior = produto.getEstoque();
        int quantidade = request.quantidade();
        int posterior;
        switch (request.tipo()) {
            case "ENTRADA" -> posterior = Math.addExact(anterior, quantidade);
            case "SAIDA" -> {
                if (quantidade > anterior) {
                    throw new AuthException(HttpStatus.CONFLICT, "A saída solicitada é maior que o estoque disponível.");
                }
                posterior = anterior - quantidade;
            }
            case "AJUSTE" -> posterior = quantidade;
            default -> throw new AuthException(HttpStatus.BAD_REQUEST, "Tipo de movimentação inválido.");
        }
        produto.definirEstoque(posterior);
        produtos.save(produto);
        String motivo = request.motivo() == null || request.motivo().isBlank() ? null : request.motivo().trim();
        MovimentacaoEstoqueEntity registro = movimentacoes.save(new MovimentacaoEstoqueEntity(
                produto, request.tipo(), quantidade, anterior, posterior, motivo));
        return resposta(registro);
    }

    private MovimentacaoResponse resposta(MovimentacaoEstoqueEntity item) {
        return new MovimentacaoResponse(item.getId(), item.getProduto().getId(), item.getProduto().getNome(),
                item.getProduto().getSku(), item.getTipo(), item.getQuantidade(), item.getEstoqueAnterior(),
                item.getEstoquePosterior(), item.getMotivo(), item.getCriadoEm());
    }
}
