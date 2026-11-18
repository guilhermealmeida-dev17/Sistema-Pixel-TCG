CREATE TABLE IF NOT EXISTS carrinho (
    id_carrinho UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL UNIQUE,
    dt_criacao_carrinho TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao_carrinho TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_carrinho_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS carrinho_produto (
    id_carrinho_produto UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_carrinho UUID NOT NULL,
    id_produto UUID NOT NULL,
    qt_produto_carrinho INTEGER NOT NULL,
    CONSTRAINT fk_carrinho_produto_carrinho FOREIGN KEY (id_carrinho)
        REFERENCES carrinho (id_carrinho) ON DELETE CASCADE,
    CONSTRAINT fk_carrinho_produto_produto FOREIGN KEY (id_produto)
        REFERENCES produto (id_produto) ON DELETE CASCADE,
    CONSTRAINT chk_carrinho_produto_quantidade CHECK (qt_produto_carrinho > 0),
    CONSTRAINT uk_carrinho_produto UNIQUE (id_carrinho, id_produto)
);
