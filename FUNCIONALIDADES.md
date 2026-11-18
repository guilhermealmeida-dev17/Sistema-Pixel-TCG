# Pixel TCG — estado dos módulos

## Integrado ao PostgreSQL e às APIs

| Módulo | Situação |
| --- | --- |
| Cadastro, login e perfil | Integrados; as rotas protegidas usam JWT. |
| Catálogo público, busca e detalhes | Consultam a API; sem produtos no banco, a vitrine fica vazia. |
| Administração de produtos | Listagem, cadastro, edição e ativação/arquivamento persistidos pela API. |
| Painel administrativo | Resumo de produtos, ativos, unidades e alertas calculado com dados da API. |
| Controle de estoque | Consulta estoque e registra entradas, saídas e ajustes por API, com validação e atualização transacional. |
| Histórico de estoque | Gravado em `movimentacao_estoque`; inclui as operações da tela de estoque, saídas de venda e devoluções por cancelamento. |
| Carrinho | Persistido por conta; preço e estoque são validados pelo servidor. |
| Endereços | Consulta, inclusão e exclusão associados à conta. |
| Pedidos | Criação transacional a partir do carrinho; total calculado no servidor; reserva de estoque, cancelamento e histórico da conta. |

## Ainda precisa ser feito para uma loja real

- Integração de cobrança e confirmação de pagamento.
- Cálculo e compra de frete com transportadora.
- Fluxo administrativo para atualizar status dos pedidos, despacho e rastreamento.
- APIs para cupons, notificações, relatórios de venda, gestão de clientes e preferências administrativas.
- Recuperação de senha por e-mail.
- Registrar no histórico as alterações de estoque feitas ao cadastrar ou editar um produto; até isso ser feito, use a tela **Estoque** para entradas, saídas e ajustes que precisem constar no histórico.
- Testes automatizados e revisão final de segurança, responsividade e acessibilidade.

As páginas administrativas sem API mostram que estão pendentes, sem apresentar números de exemplo como se fossem dados reais.

## Observações técnicas

- PostgreSQL é o único banco configurado; H2 e os seeders de demonstração foram removidos.
- As migrações Flyway V1–V10 preparam um banco vazio. A V10 cria a tabela de histórico de estoque. Nenhuma migração insere usuários ou produtos de demonstração.
- Em banco já existente, faça backup antes de iniciar a aplicação e confira o histórico Flyway; não presuma que todas as migrações são seguras para repetir em qualquer schema.
- O navegador usa `sessionStorage` somente para a sessão JWT e mensagens temporárias; carrinho, endereços, estoque e pedidos são persistidos no servidor.
- Pedidos ficam aguardando pagamento. Criar um pedido não representa uma cobrança financeira.
- Administradores são definidos explicitamente por alguém com acesso ao banco; nenhuma conta privilegiada é criada automaticamente.
