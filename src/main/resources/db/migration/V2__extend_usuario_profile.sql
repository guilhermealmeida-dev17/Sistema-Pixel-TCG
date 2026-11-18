ALTER TABLE usuario
    ADD COLUMN IF NOT EXISTS cd_telefone_usuario VARCHAR(20),
    ADD COLUMN IF NOT EXISTS nm_cidade_usuario VARCHAR(100),
    ADD COLUMN IF NOT EXISTS ic_aceite_termos_usuario BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS dt_aceite_termos_usuario TIMESTAMP,
    ADD COLUMN IF NOT EXISTS cd_versao_termos_usuario VARCHAR(40);
