package br.edu.fatecpg.api.product;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "produto")
public class ProdutoEntity {
    @Id
    @Column(name = "id_produto", nullable = false, updatable = false)
    private UUID id = UUID.randomUUID();

    @Column(name = "nm_produto", nullable = false, length = 90)
    private String nome;
    @Column(name = "tx_subtitulo_produto", length = 90)
    private String subtitulo;
    @Column(name = "nm_categoria_produto", nullable = false, length = 50)
    private String categoria;
    @Column(name = "nm_franquia_produto", nullable = false, length = 150)
    private String franquia;
    @Column(name = "nm_edicao_produto", length = 90)
    private String edicao;
    @Column(name = "nm_idioma_produto", length = 20)
    private String idioma;
    @Column(name = "vl_produto", nullable = false, precision = 19, scale = 4)
    private BigDecimal preco;
    @Column(name = "qt_estoque_produto", nullable = false)
    private int estoque;
    @Column(name = "tx_selo_vitrine_produto", length = 50)
    private String selo;
    @Column(name = "cd_sku_produto", nullable = false, unique = true, length = 15)
    private String sku;
    @Column(name = "vl_max_parcelas_produto", nullable = false)
    private int parcelas;
    @Column(name = "qt_alerta_estoque_produto", nullable = false)
    private int estoqueMinimo;
    @Column(name = "ds_produto", nullable = false, length = 600)
    private String descricao;
    @Column(name = "ds_detalhe_produto", nullable = false, length = 150)
    private String detalhe;
    @Column(name = "ic_ativo_produto", nullable = false)
    private boolean ativo = true;

    @OneToMany(mappedBy = "produto", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProdutoImagemEntity> imagens = new ArrayList<>();
    @OneToMany(mappedBy = "produto", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EspecificacaoProdutoEntity> especificacoes = new ArrayList<>();

    protected ProdutoEntity() { }

    public ProdutoEntity(String nome, String subtitulo, String categoria, String franquia, String edicao,
                         String idioma, BigDecimal preco, int estoque, String selo, String sku,
                         int parcelas, int estoqueMinimo, String descricao, String detalhe) {
        this.nome = nome;
        this.subtitulo = subtitulo;
        this.categoria = categoria;
        this.franquia = franquia;
        this.edicao = edicao;
        this.idioma = idioma;
        this.preco = preco;
        this.estoque = estoque;
        this.selo = selo;
        this.sku = sku;
        this.parcelas = parcelas;
        this.estoqueMinimo = estoqueMinimo;
        this.descricao = descricao;
        this.detalhe = detalhe;
    }

    public ProdutoEntity(String nome, String subtitulo, String categoria, String franquia, String edicao,
                         String idioma, BigDecimal preco, int estoque, String selo, String sku,
                         int parcelas, int estoqueMinimo, String descricao) {
        this(nome, subtitulo, categoria, franquia, edicao, idioma, preco, estoque, selo, sku, parcelas,
                estoqueMinimo, descricao, subtitulo == null || subtitulo.isBlank() ? nome : subtitulo);
    }

    public void atualizar(String nome, String subtitulo, String categoria, String franquia, String edicao,
                          String idioma, BigDecimal preco, int estoque, String selo, String sku,
                          int parcelas, int estoqueMinimo, String descricao, String detalhe) {
        this.nome = nome;
        this.subtitulo = subtitulo;
        this.categoria = categoria;
        this.franquia = franquia;
        this.edicao = edicao;
        this.idioma = idioma;
        this.preco = preco;
        this.estoque = estoque;
        this.selo = selo;
        this.sku = sku;
        this.parcelas = parcelas;
        this.estoqueMinimo = estoqueMinimo;
        this.descricao = descricao;
        this.detalhe = detalhe;
    }

    public void arquivar() { this.ativo = false; }

    public void restaurar() { this.ativo = true; }

    public void definirAtivo(boolean ativo) { this.ativo = ativo; }

    public void definirEstoque(int estoque) {
        if (estoque < 0) throw new IllegalArgumentException("O estoque não pode ser negativo.");
        this.estoque = estoque;
    }

    public void limparImagens() { imagens.clear(); }

    public void limparEspecificacoes() { especificacoes.clear(); }

    public void adicionarImagem(String url, boolean principal, int ordem) {
        imagens.add(new ProdutoImagemEntity(this, url, principal, ordem));
    }

    public void adicionarEspecificacao(String rotulo, String valor) {
        especificacoes.add(new EspecificacaoProdutoEntity(this, rotulo, valor));
    }

    public UUID getId() { return id; }
    public String getNome() { return nome; }
    public String getSubtitulo() { return subtitulo; }
    public String getCategoria() { return categoria; }
    public String getFranquia() { return franquia; }
    public String getEdicao() { return edicao; }
    public String getIdioma() { return idioma; }
    public BigDecimal getPreco() { return preco; }
    public int getEstoque() { return estoque; }
    public String getSelo() { return selo; }
    public String getSku() { return sku; }
    public int getParcelas() { return parcelas; }
    public int getEstoqueMinimo() { return estoqueMinimo; }
    public String getDescricao() { return descricao; }
    public boolean isAtivo() { return ativo; }
    public List<ProdutoImagemEntity> getImagens() { return imagens; }
    public List<EspecificacaoProdutoEntity> getEspecificacoes() { return especificacoes; }
}
