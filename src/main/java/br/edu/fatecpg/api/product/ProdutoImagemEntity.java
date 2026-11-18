package br.edu.fatecpg.api.product;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "produto_imagem")
public class ProdutoImagemEntity {
    @Id
    @Column(name = "id_produto_imagem", nullable = false, updatable = false)
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_produto", nullable = false)
    private ProdutoEntity produto;

    @Column(name = "tx_url_produto_imagem", nullable = false, columnDefinition = "text")
    private String url;
    @Column(name = "ic_principal_produto_imagem", nullable = false)
    private boolean principal;
    @Column(name = "nr_ordem_produto_imagem", nullable = false)
    private int ordem;

    protected ProdutoImagemEntity() { }

    ProdutoImagemEntity(ProdutoEntity produto, String url, boolean principal, int ordem) {
        this.produto = produto;
        this.url = url;
        this.principal = principal;
        this.ordem = ordem;
    }

    public String getUrl() { return url; }
    public boolean isPrincipal() { return principal; }
    public int getOrdem() { return ordem; }
}
