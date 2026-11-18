# Banco SQL recebido — pendente de revisão

O arquivo `pixel_tcg_banco.sql` foi substituído pelo SQL recebido em `Downloads/pixel_tcg_banco.sql`, para revisão pelo responsável pelo banco. Ele foi copiado sem alterações e não foi executado contra nenhum banco.

O projeto também tem migrations Flyway em `src/main/resources/db/migration`. Antes de usar PostgreSQL, alinhar o SQL de referência com as entidades e migrations atuais. Conferir especialmente:

- o fechamento da constraint `chk_pedido_status` na tabela `pedido`;
- `ds_detalhe_produto`, que existe no SQL recebido mas não no backend atual;
- campos de perfil do usuário, ordem de imagens e status ativo do produto, que existem nas migrations atuais;
- tabelas de pedido, carrinho e endereço, que ainda não têm APIs implementadas.

`pixel_tcg_banco_referencia_anterior.sql` preserva o SQL que estava na pasta antes da substituição.
