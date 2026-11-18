package br.edu.fatecpg.api.cart;

import java.util.UUID;

import br.edu.fatecpg.api.product.ProdutoEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "carrinho_produto", uniqueConstraints =
        @UniqueConstraint(name = "uk_carrinho_produto", columnNames = {"id_carrinho", "id_produto"}))
public class CarrinhoProdutoEntity {
    @Id
    @Column(name = "id_carrinho_produto", nullable = false, updatable = false)
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_carrinho", nullable = false)
    private CarrinhoEntity carrinho;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_produto", nullable = false)
    private ProdutoEntity produto;

    @Column(name = "qt_produto_carrinho", nullable = false)
    private int quantidade;

    protected CarrinhoProdutoEntity() { }

    CarrinhoProdutoEntity(CarrinhoEntity carrinho, ProdutoEntity produto, int quantidade) {
        this.carrinho = carrinho;
        this.produto = produto;
        this.quantidade = quantidade;
    }

    void definirQuantidade(int quantidade) { this.quantidade = quantidade; }

    public ProdutoEntity getProduto() { return produto; }
    public int getQuantidade() { return quantidade; }
}
