CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cd_cpf_usuario CHAR(11) UNIQUE,
    nm_usuario VARCHAR(300) NOT NULL,
    nm_email_usuario VARCHAR(300) NOT NULL UNIQUE,
    cd_senha_usuario VARCHAR(300) NOT NULL,
    ic_admin_usuario BOOLEAN NOT NULL DEFAULT FALSE,
    tx_url_imagem_usuario TEXT,
    dt_criacao_usuario TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dt_atualizacao_usuario TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_usuario_cpf CHECK (
        cd_cpf_usuario IS NULL OR cd_cpf_usuario ~ '^[0-9]{11}$'
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_usuario_email_lower
    ON usuario (LOWER(nm_email_usuario));
