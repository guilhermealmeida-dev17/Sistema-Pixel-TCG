CREATE TABLE movimentacao_estoque (
    id_movimentacao_estoque UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_produto UUID NOT NULL,
    nm_tipo_movimentacao VARCHAR(10) NOT NULL,
    qt_movimentada INTEGER NOT NULL,
    qt_estoque_anterior INTEGER NOT NULL,
    qt_estoque_posterior INTEGER NOT NULL,
    ds_motivo VARCHAR(250),
    dt_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_movimentacao_estoque_produto
        FOREIGN KEY (id_produto) REFERENCES produto (id_produto)
        ON UPDATE NO ACTION ON DELETE RESTRICT,
    CONSTRAINT chk_movimentacao_estoque_tipo
        CHECK (nm_tipo_movimentacao IN ('ENTRADA', 'SAIDA', 'AJUSTE')),
    CONSTRAINT chk_movimentacao_estoque_quantidade
        CHECK (qt_movimentada > 0),
    CONSTRAINT chk_movimentacao_estoque_anterior
        CHECK (qt_estoque_anterior >= 0),
    CONSTRAINT chk_movimentacao_estoque_posterior
        CHECK (qt_estoque_posterior >= 0)
);

CREATE INDEX idx_movimentacao_estoque_produto_data
    ON movimentacao_estoque (id_produto, dt_criacao DESC);

CREATE INDEX idx_movimentacao_estoque_data
    ON movimentacao_estoque (dt_criacao DESC);
