# Registro da revisão do Pixel TCG

**Data:** 16/11/2026  
**Banco:** PostgreSQL 18.7 local  
**Escopo:** conferir o botão de cadastro, eliminar catálogo fictício e ligar o fluxo principal à persistência/API.

## Corrigido

- O botão “Criar conta” estava sem `data-tab`, enquanto `login.js` só atualizava botões que tinham esse atributo. Também não alternava a classe `active` dos formulários. A navegação entre login e cadastro agora funciona.
- A tela de cadastro foi exercitada no navegador com uma conta temporária, que foi removida depois.
- A vitrine deixou de carregar produtos locais quando a API falha. Sem produtos no banco, mostra um estado vazio; quando a API falha, mostra uma mensagem de indisponibilidade.
- Carrinho, endereços, pedidos e histórico passaram a usar APIs autenticadas. O checkout não solicita nem armazena dados de cartão.
- Foram adicionadas rotas de endereço e pedido, com leitura dos preços e quantidades do banco, reserva de estoque, limpeza do carrinho e cancelamento com devolução de estoque.
- O histórico do cliente consulta os pedidos associados à conta, não `localStorage`.
- H2, seeders e contas/produtos de demonstração foram retirados.
- Flyway V8/V9 complementa o schema existente e cria as tabelas de endereço/pedido/itens quando faltarem.
- Módulos de painel sem API foram sinalizados como pendentes para não mostrar dados de exemplo como reais.

## Verificações executadas

- A aplicação iniciou em PostgreSQL 18.7; Flyway validou as migrações e aplicou V8 e V9.
- `GET /api/produtos` retornou `200` com `[]` no banco vazio.
- Cadastro pela interface retornou à tela de login com mensagem de sucesso.
- Uma conta temporária autenticou, salvou/consultou/excluiu endereço e recebeu erro `400` ao tentar criar pedido com carrinho vazio. A conta foi removida.
- Com conta e produto temporários, a API registrou pedido de R$ 39,80 a partir de duas unidades, reduziu estoque de 5 para 3, cancelou o pedido e restaurou o estoque para 5. Todos os dados de teste foram apagados.
- As rotas protegidas sem credenciais não permitem acesso; carrinho, endereços e pedidos usam JWT.

## Limitações restantes

- Não há gateway de pagamento nem cálculo de frete.
- Rastreamento, despacho, cupons, relatórios, clientes e configurações administrativas ainda não têm APIs.
- A interface administrativa de produto permanece conectada; as outras áreas agora se identificam como pendentes.
- A máquina desta revisão tem JDK 26 e Maven não instalado. A compilação manual com alvo Java 21 gerou as classes e permitiu iniciar o servidor, mas o `javac` emitiu uma exceção ao encerrar um JAR do cache. O destinatário ainda deve executar uma compilação limpa com JDK 21/Maven antes da banca.

Consulte [API.md](API.md), [../README.md](../README.md) e [../FUNCIONALIDADES.md](../FUNCIONALIDADES.md) para iniciar e revisar o sistema.
