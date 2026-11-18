CREATE TABLE IF NOT EXISTS usuario (
    id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	cd_cpf_usuario CHAR(11) UNIQUE,
    nm_usuario VARCHAR(300) NOT NULL,
    nm_email_usuario VARCHAR(300) NOT NULL UNIQUE,
    cd_senha_usuario VARCHAR(300) NOT NULL,
    ic_admin_usuario BOOLEAN DEFAULT FALSE NOT NULL,
	tx_url_imagem_usuario TEXT,
    dt_criacao_usuario TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao_usuario TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT chk_usuario_cpf
	CHECK (
    	cd_cpf_usuario IS NULL
    	OR cd_cpf_usuario ~ '^[0-9]{11}$'
	)
);

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
    ds_detalhe_produto VARCHAR(150) NOT NULL,
    cd_sku_produto VARCHAR(15) UNIQUE NOT NULL,
    vl_max_parcelas_produto INTEGER NOT NULL,
    qt_alerta_estoque_produto INTEGER NOT NULL,
    ds_produto VARCHAR(600) NOT NULL,
	CONSTRAINT chk_produto_preco
    CHECK (vl_produto >= 0),
	CONSTRAINT chk_produto_estoque
    CHECK (qt_estoque_produto >= 0),
	CONSTRAINT chk_produto_parcelas
    CHECK (vl_max_parcelas_produto >= 1),
	CONSTRAINT chk_produto_alerta
    CHECK (qt_alerta_estoque_produto >= 0)
);

CREATE TABLE IF NOT EXISTS produto_imagem (
    id_produto_imagem UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_produto UUID NOT NULL,
    tx_url_produto_imagem TEXT NOT NULL,
  	ic_principal_produto_imagem BOOLEAN DEFAULT FALSE NOT NULL,
    CONSTRAINT fk_produto_imagem_produto
        FOREIGN KEY (id_produto)
        REFERENCES produto (id_produto)
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_produto_imagem_principal
ON produto_imagem (id_produto)
WHERE ic_principal_produto_imagem = TRUE;

CREATE TABLE IF NOT EXISTS especificacao (
    id_especificacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_produto UUID NOT NULL,
    nm_rotulo_especificacao VARCHAR(90) NOT NULL,
    ds_valor_especificacao VARCHAR(90) NOT NULL,
    CONSTRAINT fk_especificacao_produto
        FOREIGN KEY (id_produto)
        REFERENCES produto (id_produto)
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

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
    CONSTRAINT fk_endereco_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario)
        ON UPDATE NO ACTION
        ON DELETE CASCADE
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
	dt_criacao_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dt_atualizacao_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT fk_pedido_usuario
    	FOREIGN KEY (id_usuario)
   		REFERENCES usuario (id_usuario)
    	ON DELETE SET NULL,
	CONSTRAINT chk_pedido_status
		CHECK (
    	nm_status_pedido IN (
        	'AGUARDANDO_PAGAMENTO',
        	'PAGAMENTO_APROVADO',
        	'EM_PREPARACAO',
        	'ENVIADO',
        	'ENTREGUE',
        	'CANCELADO'
    	)
	CONSTRAINT chk_pedido_total
		CHECK (vl_total_pedido >= 0)
);

CREATE TABLE IF NOT EXISTS produto_pedido (
    id_produto_pedido UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_produto UUID NOT NULL,
    id_pedido UUID NOT NULL,
    qt_produto_pedido INTEGER NOT NULL,
    vl_unitario_produto_pedido NUMERIC(19,4) NOT NULL,
    CONSTRAINT fk_produto_pedido_produto
        FOREIGN KEY (id_produto)
        REFERENCES produto (id_produto)
        ON DELETE RESTRICT,
    CONSTRAINT fk_produto_pedido_pedido
        FOREIGN KEY (id_pedido)
        REFERENCES pedido (id_pedido)
        ON DELETE CASCADE,
    CONSTRAINT chk_produto_pedido_quantidade
        CHECK (qt_produto_pedido > 0),
    CONSTRAINT chk_produto_pedido_valor
        CHECK (vl_unitario_produto_pedido >= 0),
    CONSTRAINT uk_produto_pedido
        UNIQUE (id_produto, id_pedido)
);

CREATE TABLE IF NOT EXISTS carrinho (
    id_carrinho UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    dt_criacao_carrinho TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao_carrinho TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_carrinho_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario)
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
	CONSTRAINT uk_carrinho_usuario
		UNIQUE (id_usuario)
);

CREATE TABLE IF NOT EXISTS carrinho_produto (
    id_carrinho_produto UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_carrinho UUID NOT NULL,
    id_produto UUID NOT NULL,
    qt_produto_carrinho INTEGER NOT NULL,
    CONSTRAINT fk_carrinho_produto_carrinho
        FOREIGN KEY (id_carrinho)
        REFERENCES carrinho (id_carrinho)
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT fk_carrinho_produto_produto
        FOREIGN KEY (id_produto)
        REFERENCES produto (id_produto)
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT chk_carrinho_produto_quantidade
        CHECK (qt_produto_carrinho > 0),
    CONSTRAINT uk_carrinho_produto
        UNIQUE (id_carrinho, id_produto)
);