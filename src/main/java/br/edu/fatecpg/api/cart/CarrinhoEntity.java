package br.edu.fatecpg.api.cart;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import br.edu.fatecpg.api.product.ProdutoEntity;
import br.edu.fatecpg.api.user.Usuario;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "carrinho", uniqueConstraints =
        @UniqueConstraint(name = "uk_carrinho_usuario", columnNames = "id_usuario"))
public class CarrinhoEntity {
    @Id
    @Column(name = "id_carrinho", nullable = false, updatable = false)
    private UUID id = UUID.randomUUID();

    @OneToOne(optional = false)
    @JoinColumn(name = "id_usuario", nullable = false, unique = true)
    private Usuario usuario;

    @Column(name = "dt_criacao_carrinho", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @Column(name = "dt_atualizacao_carrinho", nullable = false)
    private LocalDateTime atualizadoEm;

    @OneToMany(mappedBy = "carrinho", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CarrinhoProdutoEntity> itens = new ArrayList<>();

    protected CarrinhoEntity() { }

    public CarrinhoEntity(Usuario usuario) { this.usuario = usuario; }

    public void adicionar(ProdutoEntity produto, int quantidade) {
        itens.stream().filter(item -> item.getProduto().getId().equals(produto.getId())).findFirst()
                .ifPresentOrElse(item -> item.definirQuantidade(item.getQuantidade() + quantidade),
                        () -> itens.add(new CarrinhoProdutoEntity(this, produto, quantidade)));
        atualizadoEm = LocalDateTime.now();
    }

    public void definirQuantidade(UUID produtoId, int quantidade) {
        itens.stream().filter(item -> item.getProduto().getId().equals(produtoId)).findFirst()
                .ifPresent(item -> item.definirQuantidade(quantidade));
        atualizadoEm = LocalDateTime.now();
    }

    public void remover(UUID produtoId) {
        itens.removeIf(item -> item.getProduto().getId().equals(produtoId));
        atualizadoEm = LocalDateTime.now();
    }

    public void limpar() {
        itens.clear();
        atualizadoEm = LocalDateTime.now();
    }

    @PrePersist
    void antesDeInserir() {
        LocalDateTime agora = LocalDateTime.now();
        if (criadoEm == null) criadoEm = agora;
        atualizadoEm = agora;
    }

    @PreUpdate
    void antesDeAtualizar() { atualizadoEm = LocalDateTime.now(); }

    public UUID getId() { return id; }
    public List<CarrinhoProdutoEntity> getItens() { return itens; }
}
