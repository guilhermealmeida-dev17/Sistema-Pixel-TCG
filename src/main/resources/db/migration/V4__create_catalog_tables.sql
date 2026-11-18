CREATE TABLE IF NOT EXISTS produto (
    id_produto UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nm_produto VARCHAR(90) NOT NULL,
    tx_subtitulo_produto VARCHAR(90),
    nm_categoria_produto VARCHAR(50) NOT NULL,
    nm_franquia_produto VARCHAR(150) NOT NULL,
    nm_edicao_produto VARCHAR(90),
    nm_idioma_produto VARCHAR(20),
    vl_produto NUMERIC(19,4) NOT NULL,
    qt_estoque_produto INTEGER NOT NULL,
    tx_selo_vitrine_produto VARCHAR(50),
    cd_sku_produto VARCHAR(15) UNIQUE NOT NULL,
    vl_max_parcelas_produto INTEGER NOT NULL,
    qt_alerta_estoque_produto INTEGER NOT NULL,
    ds_produto VARCHAR(600) NOT NULL,
    CONSTRAINT chk_produto_preco CHECK (vl_produto >= 0),
    CONSTRAINT chk_produto_estoque CHECK (qt_estoque_produto >= 0),
    CONSTRAINT chk_produto_parcelas CHECK (vl_max_parcelas_produto >= 1),
    CONSTRAINT chk_produto_alerta CHECK (qt_alerta_estoque_produto >= 0)
);

CREATE TABLE IF NOT EXISTS produto_imagem (
    id_produto_imagem UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_produto UUID NOT NULL,
    tx_url_produto_imagem TEXT NOT NULL,
    ic_principal_produto_imagem BOOLEAN NOT NULL DEFAULT FALSE,
    nr_ordem_produto_imagem INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT fk_produto_imagem_produto FOREIGN KEY (id_produto)
        REFERENCES produto (id_produto) ON UPDATE NO ACTION ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS especificacao (
    id_especificacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_produto UUID NOT NULL,
    nm_rotulo_especificacao VARCHAR(90) NOT NULL,
    ds_valor_especificacao VARCHAR(90) NOT NULL,
    CONSTRAINT fk_especificacao_produto FOREIGN KEY (id_produto)
        REFERENCES produto (id_produto) ON UPDATE NO ACTION ON DELETE CASCADE
);
