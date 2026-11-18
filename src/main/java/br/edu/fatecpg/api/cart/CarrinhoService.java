package br.edu.fatecpg.api.cart;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import br.edu.fatecpg.api.auth.AuthException;
import br.edu.fatecpg.api.cart.CarrinhoDtos.CarrinhoResponse;
import br.edu.fatecpg.api.cart.CarrinhoDtos.ItemRequest;
import br.edu.fatecpg.api.cart.CarrinhoDtos.ItemResponse;
import br.edu.fatecpg.api.product.ProdutoEntity;
import br.edu.fatecpg.api.product.ProdutoImagemEntity;
import br.edu.fatecpg.api.product.ProdutoRepository;
import br.edu.fatecpg.api.user.Usuario;
import br.edu.fatecpg.api.user.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CarrinhoService {
    private final CarrinhoRepository carrinhos;
    private final UsuarioRepository usuarios;
    private final ProdutoRepository produtos;

    public CarrinhoService(CarrinhoRepository carrinhos, UsuarioRepository usuarios, ProdutoRepository produtos) {
        this.carrinhos = carrinhos;
        this.usuarios = usuarios;
        this.produtos = produtos;
    }

    @Transactional(readOnly = true)
    public CarrinhoResponse consultar(UUID usuarioId) {
        return carrinhos.findByUsuario_Id(usuarioId).map(this::resposta)
                .orElseGet(() -> new CarrinhoResponse(null, List.of(), 0, BigDecimal.ZERO));
    }

    @Transactional
    public CarrinhoResponse adicionar(UUID usuarioId, ItemRequest request) {
        ProdutoEntity produto = produtos.findByIdAndAtivoTrue(request.produtoId())
                .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "Produto não encontrado."));
        CarrinhoEntity carrinho = buscarOuCriar(usuarioId);
        int quantidadeAtual = carrinho.getItens().stream()
                .filter(item -> item.getProduto().getId().equals(produto.getId()))
                .mapToInt(CarrinhoProdutoEntity::getQuantidade).findFirst().orElse(0);
        validarEstoque(produto, quantidadeAtual + request.quantidade());
        carrinho.adicionar(produto, request.quantidade());
        return resposta(carrinhos.save(carrinho));
    }

    @Transactional
    public CarrinhoResponse definirQuantidade(UUID usuarioId, UUID produtoId, int quantidade) {
        CarrinhoEntity carrinho = buscarExistente(usuarioId);
        ProdutoEntity produto = carrinho.getItens().stream()
                .map(CarrinhoProdutoEntity::getProduto)
                .filter(item -> item.getId().equals(produtoId)).findFirst()
                .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "Produto não está no carrinho."));
        validarEstoque(produto, quantidade);
        carrinho.definirQuantidade(produtoId, quantidade);
        return resposta(carrinhos.save(carrinho));
    }

    @Transactional
    public CarrinhoResponse remover(UUID usuarioId, UUID produtoId) {
        CarrinhoEntity carrinho = buscarExistente(usuarioId);
        carrinho.remover(produtoId);
        return resposta(carrinhos.save(carrinho));
    }

    @Transactional
    public CarrinhoResponse limpar(UUID usuarioId) {
        CarrinhoEntity carrinho = buscarExistente(usuarioId);
        carrinho.limpar();
        return resposta(carrinhos.save(carrinho));
    }

    private CarrinhoEntity buscarOuCriar(UUID usuarioId) {
        return carrinhos.findByUsuario_Id(usuarioId).orElseGet(() -> {
            Usuario usuario = usuarios.findById(usuarioId)
                    .orElseThrow(() -> new AuthException(HttpStatus.UNAUTHORIZED, "Usuário não encontrado."));
            return new CarrinhoEntity(usuario);
        });
    }

    private CarrinhoEntity buscarExistente(UUID usuarioId) {
        return carrinhos.findByUsuario_Id(usuarioId)
                .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "Carrinho não encontrado."));
    }

    private void validarEstoque(ProdutoEntity produto, int quantidade) {
        if (quantidade < 1) throw new AuthException(HttpStatus.BAD_REQUEST, "A quantidade deve ser maior que zero.");
        if (quantidade > produto.getEstoque()) {
            throw new AuthException(HttpStatus.CONFLICT, "A quantidade solicitada excede o estoque disponível.");
        }
    }

    private CarrinhoResponse resposta(CarrinhoEntity carrinho) {
        List<ItemResponse> itens = carrinho.getItens().stream().map(item -> {
            ProdutoEntity produto = item.getProduto();
            BigDecimal subtotal = produto.getPreco().multiply(BigDecimal.valueOf(item.getQuantidade()));
            List<String> imagens = produto.getImagens().stream()
                    .sorted(java.util.Comparator.comparing(ProdutoImagemEntity::getOrdem))
                    .map(ProdutoImagemEntity::getUrl).toList();
            return new ItemResponse(produto.getId(), produto.getNome(), produto.getSku(), produto.getPreco(),
                    item.getQuantidade(), subtotal, imagens);
        }).toList();
        int quantidadeItens = itens.stream().mapToInt(ItemResponse::quantidade).sum();
        BigDecimal subtotal = itens.stream().map(ItemResponse::subtotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new CarrinhoResponse(carrinho.getId(), itens, quantidadeItens, subtotal);
    }
}
