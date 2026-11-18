CREATE TABLE IF NOT EXISTS endereco_usuario (
    id_endereco_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    cd_cep_endereco CHAR(9) NOT NULL,
    nm_rua_endereco VARCHAR(150) NOT NULL,
    nr_endereco VARCHAR(20) NOT NULL,
    tx_complemento_endereco VARCHAR(100),
    nm_bairro_endereco VARCHAR(100) NOT NULL,
    nm_cidade_endereco VARCHAR(100) NOT NULL,
    sg_estado_endereco CHAR(2) NOT NULL,
    CONSTRAINT fk_endereco_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON UPDATE NO ACTION ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pedido (
    id_pedido UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID,
    cd_cep_endereco_pedido CHAR(9) NOT NULL,
    nm_rua_endereco_pedido VARCHAR(150) NOT NULL,
    nr_endereco_pedido VARCHAR(20) NOT NULL,
    tx_complemento_endereco_pedido VARCHAR(100),
    nm_bairro_endereco_pedido VARCHAR(100) NOT NULL,
    nm_cidade_endereco_pedido VARCHAR(100) NOT NULL,
    sg_estado_endereco_pedido CHAR(2) NOT NULL,
    nm_tipo_entrega_pedido VARCHAR(30) NOT NULL,
    vl_total_pedido NUMERIC(19,4) NOT NULL DEFAULT 0,
    nm_status_pedido VARCHAR(30) NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO',
    dt_criacao_pedido TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao_pedido TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pedido_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON DELETE SET NULL,
    CONSTRAINT chk_pedido_status CHECK (nm_status_pedido IN (
        'AGUARDANDO_PAGAMENTO', 'PAGAMENTO_APROVADO', 'EM_PREPARACAO',
        'ENVIADO', 'ENTREGUE', 'CANCELADO'
    )),
    CONSTRAINT chk_pedido_total CHECK (vl_total_pedido >= 0)
);

CREATE TABLE IF NOT EXISTS produto_pedido (
    id_produto_pedido UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_produto UUID NOT NULL,
    id_pedido UUID NOT NULL,
    qt_produto_pedido INTEGER NOT NULL,
    vl_unitario_produto_pedido NUMERIC(19,4) NOT NULL,
    CONSTRAINT fk_produto_pedido_produto FOREIGN KEY (id_produto)
        REFERENCES produto (id_produto) ON DELETE RESTRICT,
    CONSTRAINT fk_produto_pedido_pedido FOREIGN KEY (id_pedido)
        REFERENCES pedido (id_pedido) ON DELETE CASCADE,
    CONSTRAINT chk_produto_pedido_quantidade CHECK (qt_produto_pedido > 0),
    CONSTRAINT chk_produto_pedido_valor CHECK (vl_unitario_produto_pedido >= 0),
    CONSTRAINT uk_produto_pedido UNIQUE (id_produto, id_pedido)
);

CREATE INDEX IF NOT EXISTS ix_endereco_usuario_usuario ON endereco_usuario (id_usuario);
CREATE INDEX IF NOT EXISTS ix_pedido_usuario_criacao ON pedido (id_usuario, dt_criacao_pedido DESC);
CREATE INDEX IF NOT EXISTS ix_produto_pedido_pedido ON produto_pedido (id_pedido);
