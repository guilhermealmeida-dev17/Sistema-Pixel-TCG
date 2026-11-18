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
@Table(name = "especificacao")
public class EspecificacaoProdutoEntity {
    @Id
    @Column(name = "id_especificacao", nullable = false, updatable = false)
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_produto", nullable = false)
    private ProdutoEntity produto;

    @Column(name = "nm_rotulo_especificacao", nullable = false, length = 90)
    private String rotulo;
    @Column(name = "ds_valor_especificacao", nullable = false, length = 90)
    private String valor;

    protected EspecificacaoProdutoEntity() { }

    EspecificacaoProdutoEntity(ProdutoEntity produto, String rotulo, String valor) {
        this.produto = produto;
        this.rotulo = rotulo;
        this.valor = valor;
    }

    public String getRotulo() { return rotulo; }
    public String getValor() { return valor; }
}
