# Roteiro para apresentar o Pixel TCG

## Preparação

1. Instale JDK 21+, Maven 3.9+ e PostgreSQL.
2. Crie o banco e configure `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` e `JWT_SECRET_BASE64` conforme o README.
3. Execute `mvn spring-boot:run` e abra `http://localhost:8080/`.
4. Cadastre um usuário e conceda `ic_admin_usuario = TRUE` a essa conta pelo PostgreSQL para demonstrar o painel.

Não há usuário ou produto de apresentação pré-carregado. Cadastre os dados que serão mostrados à banca.

## Demonstração recomendada

1. Mostre que a vitrine vazia reflete o banco vazio.
2. Entre na conta administradora e cadastre um produto.
3. Volte à loja e mostre o produto vindo da API pública.
4. Cadastre uma conta comum e entre nela.
5. Adicione o produto ao carrinho e mostre o preço/quantidade consultados da API.
6. Informe um endereço e registre um pedido.
7. Abra “Meus pedidos” e mostre o status `AGUARDANDO_PAGAMENTO`.
8. Explique que pagamento, frete e despacho ainda não estão integrados.

## Pontos transparentes para a banca

- Cadastro, catálogo, carrinho, endereço e pedido persistem no PostgreSQL.
- O navegador mantém somente a sessão JWT temporária; ele não é a fonte dos dados da loja.
- A API recalcula o valor do pedido com preços do banco e confere/reserva o estoque.
- Nenhum cartão é solicitado, nenhuma cobrança Pix/cartão é efetuada e frete ainda não é calculado.
- Cupons, rastreamento, despacho e outras áreas administrativas aguardam APIs e aparecem como pendentes.
