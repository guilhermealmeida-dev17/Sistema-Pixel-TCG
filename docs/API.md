# Pixel TCG — documentação da API REST

Base local: `http://localhost:8080`. Os exemplos usam JSON (`Content-Type: application/json`). Respostas de erro seguem o formato `{ "erro": "...", "detalhe": "..." }` quando tratadas pela aplicação.

## Autenticação e autorização

`POST /api/auth/register` e `POST /api/auth/login` são públicos. O login retorna `accessToken` (JWT). Nas rotas protegidas, envie o cabeçalho:

```http
Authorization: Bearer SEU_TOKEN_JWT
```

As rotas `/api/auth/me`, `/api/carrinho/**`, `/api/enderecos/**` e `/api/pedidos/**` exigem usuário autenticado. As rotas `/api/admin/**` exigem usuário com papel administrativo (`ADMIN`); a verificação acontece no Spring Security, no servidor.

## Rotas de autenticação

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Público | Cria uma conta. |
| `POST` | `/api/auth/login` | Público | Autentica e retorna JWT. |
| `GET` | `/api/auth/me` | Autenticado | Consulta o perfil atual. |
| `PATCH` | `/api/auth/me` | Autenticado | Atualiza dados do perfil. |
| `PUT` | `/api/auth/me/password` | Autenticado | Altera a senha. |
| `DELETE` | `/api/auth/me` | Autenticado | Exclui a própria conta. |

### Exemplo de cadastro

```json
{
  "nome": "Pessoa de Demonstração",
  "email": "pessoa@example.com",
  "cpf": "52998224725",
  "senha": "SenhaForte123",
  "termosAceitos": true
}
```

O CPF deve ser válido e a senha deve ter pelo menos oito caracteres. O cadastro retorna os dados básicos do usuário, sem a senha.

### Exemplo de login

```json
{
  "email": "email-da-conta-administradora",
  "senha": "senha-escolhida-no-cadastro"
}
```

O cadastro cria um usuário comum. Para usar `/api/admin/**`, conceda `ic_admin_usuario = TRUE` à conta escolhida diretamente no banco e entre novamente.

A resposta contém `tokenType`, `accessToken`, `expiresInSeconds`, `expiresAt` e `usuario`.

## Carrinho persistido

As rotas abaixo exigem JWT. Cada conta tem um carrinho próprio. O servidor valida produto ativo e estoque disponível e calcula o subtotal com o preço atual do catálogo.

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/carrinho` | Consulta o carrinho da conta; sem carrinho, retorna uma lista vazia. |
| `POST` | `/api/carrinho/itens` | Adiciona quantidade de um produto ao carrinho. |
| `PUT` | `/api/carrinho/itens/{produtoId}` | Define a quantidade de um produto já adicionado. |
| `DELETE` | `/api/carrinho/itens/{produtoId}` | Remove um produto do carrinho. |
| `DELETE` | `/api/carrinho/itens` | Esvazia o carrinho. |

Exemplo de inclusão:

```json
{
  "produtoId": "UUID-DO-PRODUTO",
  "quantidade": 2
}
```

As respostas incluem `itens`, `quantidadeItens` e `subtotal`; cada item retorna produto, SKU, preço unitário, quantidade, subtotal e imagens. Quantidade acima do estoque retorna HTTP `409`.

## Endereços e pedidos

Os endereços ficam na tabela `endereco_usuario`. O pedido copia o endereço no momento da compra para preservar os dados usados na entrega.

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/enderecos` | Lista os endereços da conta autenticada. |
| `POST` | `/api/enderecos` | Valida e salva um endereço. |
| `DELETE` | `/api/enderecos/{id}` | Exclui um endereço da própria conta. |
| `GET` | `/api/pedidos` | Lista o histórico da conta com itens e endereço. |
| `POST` | `/api/pedidos` | Cria um pedido usando carrinho, preços e estoque do banco. |
| `POST` | `/api/pedidos/{id}/cancelamento` | Cancela pedido aguardando pagamento e devolve as unidades ao estoque. |

Exemplo de pedido:

```json
{
  "entrega": "ENTREGA",
  "enderecoId": "UUID-DO-ENDERECO"
}
```

O cliente não envia preço nem quantidade no pedido. O servidor lê os itens do carrinho, verifica o estoque e grava o total e os itens em `pedido` e `produto_pedido`. O pedido começa em `AGUARDANDO_PAGAMENTO`. Pagamento, frete, rastreamento, cupons e despacho ainda não têm integração; nenhuma cobrança é feita.

## Catálogo público

| Método | Rota | Acesso | Descrição |
| --- | --- | --- | --- |
| `GET` | `/api/produtos` | Público | Lista produtos ativos, ordenados por nome. |
| `GET` | `/api/produtos/{id}` | Público | Consulta detalhes de um produto ativo por UUID. |

A resposta pública contém dados necessários à vitrine: `id`, `nome`, `subtitulo`, `categoria`, `franquia`, `edicao`, `idioma`, `preco`, `estoque`, `selo`, `parcelas`, `descricao`, `imagens` e `especificacoes`. SKU e estoque mínimo não são publicados na resposta pública.

Produtos desativados não aparecem na listagem pública e não podem ser consultados pela rota de detalhe.

## Administração de produtos

Todas as rotas abaixo exigem JWT de administrador.

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/admin/produtos` | Lista produtos ativos e arquivados. |
| `POST` | `/api/admin/produtos` | Cadastra um produto. Retorna HTTP `201`. |
| `PUT` | `/api/admin/produtos/{id}` | Atualiza os dados e substitui imagens/especificações. |
| `PATCH` | `/api/admin/produtos/{id}/status` | Ativa ou desativa o produto. |
| `DELETE` | `/api/admin/produtos/{id}` | Arquiva o produto (não apaga fisicamente). Retorna HTTP `204`. |

### Exemplo de cadastro/edição

```json
{
  "nome": "Booster Box Pokémon TCG - Exemplo",
  "subtitulo": "Caixa com pacotes demonstrativos",
  "categoria": "Boosters & Boxes",
  "franquia": "Pokémon TCG",
  "edicao": "Coleção de demonstração",
  "idioma": "Português",
  "preco": 299.90,
  "estoque": 12,
  "selo": "DESTAQUE",
  "sku": "BB-EX-001",
  "parcelas": 6,
  "estoqueMinimo": 3,
  "descricao": "Produto fictício para demonstrar o cadastro e a publicação no catálogo.",
  "imagens": ["/IMG/produtos/produto-placeholder.svg"],
  "especificacoes": [
    { "rotulo": "Conteúdo", "valor": "Produto demonstrativo" },
    { "rotulo": "Idioma", "valor": "Português" }
  ]
}
```

Regras principais: preço maior que zero; estoque e estoque mínimo inteiros não negativos; SKU exclusivo (3 a 15 caracteres); parcelas entre 1 e 12; de uma a cinco imagens; até dez especificações. As imagens aceitas são data URL Base64 de JPEG/PNG/WebP, URL HTTPS ou caminho local iniciado por `/`.

### Exemplo de alteração de status

```http
PATCH /api/admin/produtos/UUID-DO-PRODUTO/status
Authorization: Bearer SEU_TOKEN_JWT
Content-Type: application/json
```

```json
{ "ativo": false }
```

`false` remove o item da vitrine pública. `true` publica/reativa novamente. O endpoint `DELETE` equivale a arquivar com `ativo = false`.

## Fluxo de verificação rápida

1. Inicie a aplicação conectada ao PostgreSQL.
2. Consulte `GET /api/produtos`: um banco novo deve retornar `[]`.
3. Cadastre uma conta e conceda o papel `ADMIN` diretamente no PostgreSQL, se for apresentar o painel.
4. Cadastre um produto e confirme que a vitrine passou a retorná-lo.
5. Crie outra conta, adicione o produto ao carrinho, salve um endereço e registre um pedido.
6. Confirme o pedido em `GET /api/pedidos`; cancele enquanto estiver aguardando pagamento.

## Limitações conhecidas

O carrinho, endereços e pedidos do fluxo principal são associados à conta e persistidos no PostgreSQL. JWT fica em `sessionStorage` apenas durante a sessão. Pagamentos, cálculo do frete, despacho, cupons, rastreamento e notificações não têm integração. Os pedidos permanecem aguardando pagamento, sem cobrança financeira.


## Controle administrativo de estoque

Todos os endpoints abaixo exigem JWT de administrador (`ROLE_ADMIN`).

- `GET /api/admin/estoque/movimentacoes` — lista as últimas 100 movimentações.
- `GET /api/admin/estoque/movimentacoes?produtoId={uuid}` — lista as últimas 100 movimentações de um produto.
- `POST /api/admin/estoque/produtos/{uuid}/movimentacoes` — registra uma movimentação e atualiza o estoque na mesma transação.

Exemplo de corpo para entrada, saída ou ajuste:

```json
{
  "tipo": "ENTRADA",
  "quantidade": 12,
  "motivo": "Reposição de fornecedor"
}
```

Tipos aceitos: `ENTRADA`, `SAIDA` e `AJUSTE`. Em `AJUSTE`, `quantidade` representa o novo estoque final. Saídas maiores que o estoque disponível são rejeitadas. O histórico é persistido na tabela `movimentacao_estoque`, criada pela migração Flyway `V10`.
