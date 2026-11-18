ALTER TABLE produto
    ADD COLUMN IF NOT EXISTS ds_detalhe_produto VARCHAR(150);

UPDATE produto
SET ds_detalhe_produto = LEFT(COALESCE(NULLIF(ds_produto, ''), nm_produto), 150)
WHERE ds_detalhe_produto IS NULL;

ALTER TABLE produto
    ALTER COLUMN ds_detalhe_produto SET NOT NULL;
