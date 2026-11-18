package br.edu.fatecpg.api.product;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "movimentacao_estoque")
public class MovimentacaoEstoqueEntity {
    @Id
    @Column(name = "id_movimentacao_estoque", nullable = false, updatable = false)
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_produto", nullable = false)
    private ProdutoEntity produto;

    @Column(name = "nm_tipo_movimentacao", nullable = false, length = 10)
    private String tipo;

    @Column(name = "qt_movimentada", nullable = false)
    private int quantidade;

    @Column(name = "qt_estoque_anterior", nullable = false)
    private int estoqueAnterior;

    @Column(name = "qt_estoque_posterior", nullable = false)
    private int estoquePosterior;

    @Column(name = "ds_motivo", length = 250)
    private String motivo;

    @Column(name = "dt_criacao", nullable = false)
    private LocalDateTime criadoEm = LocalDateTime.now();

    protected MovimentacaoEstoqueEntity() { }

    public MovimentacaoEstoqueEntity(ProdutoEntity produto, String tipo, int quantidade,
                                     int estoqueAnterior, int estoquePosterior, String motivo) {
        this.produto = produto;
        this.tipo = tipo;
        this.quantidade = quantidade;
        this.estoqueAnterior = estoqueAnterior;
        this.estoquePosterior = estoquePosterior;
        this.motivo = motivo;
    }

    public UUID getId() { return id; }
    public ProdutoEntity getProduto() { return produto; }
    public String getTipo() { return tipo; }
    public int getQuantidade() { return quantidade; }
    public int getEstoqueAnterior() { return estoqueAnterior; }
    public int getEstoquePosterior() { return estoquePosterior; }
    public String getMotivo() { return motivo; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
}
