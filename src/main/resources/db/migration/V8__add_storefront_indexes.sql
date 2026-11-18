DO $$
BEGIN
    IF to_regclass('public.pedido') IS NOT NULL THEN
        ALTER TABLE pedido
            ADD COLUMN IF NOT EXISTS nm_status_pedido VARCHAR(30) NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO';
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_pedido_status') THEN
            ALTER TABLE pedido ADD CONSTRAINT chk_pedido_status CHECK (nm_status_pedido IN (
                'AGUARDANDO_PAGAMENTO', 'PAGAMENTO_APROVADO', 'EM_PREPARACAO',
                'ENVIADO', 'ENTREGUE', 'CANCELADO'
            ));
        END IF;
    END IF;
    IF to_regclass('public.endereco_usuario') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS ix_endereco_usuario_usuario ON endereco_usuario (id_usuario);
    END IF;
    IF to_regclass('public.pedido') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS ix_pedido_usuario_criacao ON pedido (id_usuario, dt_criacao_pedido DESC);
    END IF;
    IF to_regclass('public.produto_pedido') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS ix_produto_pedido_pedido ON produto_pedido (id_pedido);
    END IF;
END $$;
