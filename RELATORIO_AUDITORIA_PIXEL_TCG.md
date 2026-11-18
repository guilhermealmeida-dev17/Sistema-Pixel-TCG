# Pixel TCG — revisão para entrega técnica

**Data:** 16/11/2026

O objetivo desta revisão foi retirar dados de demonstração do fluxo principal e fazer a loja usar o PostgreSQL e as APIs existentes.

## Alterações

- Corrigida a alternância login/cadastro: os botões agora têm `data-tab` e `login.js` atualiza estado visual e formulários.
- Removido o fallback de produtos locais. A vitrine mostra o estado real da API, inclusive catálogo vazio ou falha de conexão.
- Carrinho do cliente passou a usar `GET/POST/PUT/DELETE /api/carrinho`.
- Criadas APIs para endereço e pedido. O servidor calcula o total com os preços atuais, valida e reserva estoque, registra itens/endereço e permite cancelar pedido pendente devolvendo estoque.
- Checkout registra pedido no banco, sem simular cobrança ou guardar número/cartão/CVV.
- Histórico de pedidos passou a consultar a API.
- Retirados H2, seeders e carregamento automático de usuário/produtos.
- Flyway V8/V9 foi ampliado para preparar o estado dos pedidos e as tabelas de endereço e pedido, preservando instalações com tabelas já existentes.
- Áreas administrativas ainda não integradas foram sinalizadas como pendentes; seus dados de demonstração foram retirados da navegação.
- Documentação de inicialização, APIs, apresentação e limitações foi atualizada.

## Conferência realizada

- Aplicação iniciada localmente contra PostgreSQL 18.7 e migrações V8/V9 aplicadas.
- Vitrine sem dados: `GET /api/produtos` respondeu `200` e lista vazia.
- Cadastro pela tela: conta temporária criada com sucesso e removida.
- Endereço: criação, consulta e exclusão exercitadas; tentativa de pedido com carrinho vazio foi recusada com HTTP `400`.
- Pedido com produto temporário: total de R$ 39,80, estoque 5→3; cancelamento restaurou 3→5. Conta, produto, pedido e endereço de teste foram removidos.
- Botão “Criar conta” clicado no navegador e formulário de cadastro exibido corretamente.

## Para revisar antes de apresentar

- A máquina não tem Maven; a compilação manual usou JDK 26 com alvo Java 21. As classes geradas permitiram inicializar e exercitar o servidor, mas o compilador reportou falha ao fechar um JAR do cache. Faça `mvn clean package` em JDK 21+ no computador do colega.
- Não há pagamento real, cálculo/compra de frete ou integração com transportadora.
- Pedidos ficam aguardando pagamento. O estoque é reservado ao registrar o pedido e é devolvido ao cancelar enquanto estiver pendente.
- Despacho/rastreio, cupons, relatórios, clientes e configurações aguardam APIs.
- Rodar conferência visual em mais dispositivos, revisar acessibilidade e validar o roteiro da banca.

O sistema está pronto para revisão técnica pelo colega, mas não está pronto para operar uma loja real nem para afirmar integração de pagamento.
