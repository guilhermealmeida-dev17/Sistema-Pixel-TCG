# 🎴 Pixel TCG

<p align="center">
  <strong>Uma loja virtual para colecionadores de Pokémon TCG</strong><br>
  Interface web, API REST em Spring Boot e dados persistidos no PostgreSQL.
</p>

<p align="center">
  <img alt="Java 21" src="https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white">
  <img alt="Spring Boot" src="https://img.shields.io/badge/Spring_Boot-4.1.2-6DB33F?logo=springboot&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-16%2B-4169E1?logo=postgresql&logoColor=white">
</p>

O Pixel TCG reúne catálogo, conta de cliente, carrinho, pedidos e ferramentas administrativas em uma aplicação web. O servidor entrega as páginas do site e oferece as APIs; os dados de negócio são consultados e salvos no PostgreSQL.

## ✨ O que você encontra

- Vitrine com busca, categorias e detalhes dos produtos.
- Cadastro, login e gerenciamento da conta do cliente.
- Carrinho, endereços, criação e histórico de pedidos.
- Painel administrativo para cadastrar, editar e arquivar produtos.
- Consulta de estoque e registro de entradas, saídas e ajustes.
- API REST documentada em [`docs/API.md`](docs/API.md).
- Migrações do banco gerenciadas pelo Flyway.

> **Limitações atuais:** pagamentos, cálculo de frete, rastreamento e recuperação de senha por e-mail não estão integrados. Veja [`FUNCIONALIDADES.md`](FUNCIONALIDADES.md) para o estado detalhado dos módulos.

## 🧰 Requisitos

- Windows 10 ou 11 (os exemplos abaixo usam PowerShell).
- JDK 21.
- Maven 3.9 ou superior.
- PostgreSQL 16 ou superior.
- Conexão à internet na primeira execução para baixar as dependências do projeto.

Confira se Java e Maven estão disponíveis no PowerShell:

```powershell
java -version
mvn -version
```

## ⬇️ Baixar o projeto

**Pelo GitHub:** abra o repositório e escolha **Code → Download ZIP**; extraia o arquivo em uma pasta. Ou clone pelo Git:

```powershell
git clone https://github.com/SEU-USUARIO/PixelTCG.git
cd PixelTCG
```

Troque `SEU-USUARIO` pelo nome da conta que publicou o repositório. Os comandos de inicialização devem ser executados na pasta que contém o arquivo `pom.xml`.

## 🗄️ Preparar o PostgreSQL

No pgAdmin, conecte-se ao servidor local. Abra o **Query Tool** no banco `postgres` e execute cada comando separadamente. Substitua `ESCOLHA_UMA_SENHA` por uma senha sua:

```sql
CREATE USER pixel_tcg WITH PASSWORD 'ESCOLHA_UMA_SENHA';
```

```sql
CREATE DATABASE pixel_tcg OWNER pixel_tcg;
```

Se o usuário ou banco já existir, não crie novamente. Use as credenciais existentes ou ajuste a senha do usuário. Na primeira inicialização, o Flyway cria e atualiza as tabelas automaticamente.

> Os arquivos `docs/pixel_tcg_banco.sql` e `docs/pixel_tcg_banco_referencia_anterior.sql` são referências SQL. Para uma instalação nova, não os importe: as migrações do próprio projeto são a fonte usada para preparar o banco.

## ▶️ Iniciar o sistema

No PowerShell, dentro da pasta do projeto, configure a conexão e uma chave JWT aleatória para esta sessão:

```powershell
$env:DB_URL = 'jdbc:postgresql://localhost:5432/pixel_tcg'
$env:DB_USERNAME = 'pixel_tcg'
$env:DB_PASSWORD = 'A_MESMA_SENHA_DO_USUARIO_POSTGRES'
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$env:JWT_SECRET_BASE64 = [Convert]::ToBase64String($bytes)
mvn spring-boot:run
```

Troque `A_MESMA_SENHA_DO_USUARIO_POSTGRES` pela senha definida ao criar o usuário do banco. Aguarde a mensagem de que o servidor iniciou e abra **http://localhost:8080/** no navegador. Não é necessário executar `npm`, abrir arquivos HTML diretamente ou iniciar outro servidor para o front-end.

Para encerrar, pressione **Ctrl+C** no PowerShell. As variáveis de ambiente acima duram apenas naquela janela; configure-as novamente quando abrir uma nova. Mantenha o serviço PostgreSQL ligado enquanto usar o sistema.

## 👤 Acesso administrativo

Crie uma conta pela tela de cadastro. Para liberar o painel administrativo, execute no Query Tool do banco `pixel_tcg`, trocando o e-mail pelo usado no cadastro:

```sql
UPDATE usuario
SET ic_admin_usuario = TRUE
WHERE LOWER(nm_email_usuario) = LOWER('seu-email@exemplo.com');
```

Saia da conta e entre novamente para atualizar a sessão. O projeto não cria usuários administradores nem produtos automaticamente.

## 📚 Documentação incluída

- [`FUNCIONALIDADES.md`](FUNCIONALIDADES.md) — funcionalidades e pendências conhecidas.
- [`docs/API.md`](docs/API.md) — rotas e exemplos da API.
- [`INSTRUCOES_APRESENTACAO.md`](INSTRUCOES_APRESENTACAO.md) — roteiro de apresentação.
- [`docs/PIXEL.DOCUMENTACAO.pdf`](docs/PIXEL.DOCUMENTACAO.pdf) — documentação do projeto.
- [`docs/REVISAO_PREVIA_APIS.md`](docs/REVISAO_PREVIA_APIS.md) — revisão das APIs.

## 📤 Publicar no GitHub

Crie um repositório vazio no GitHub. Na pasta do projeto, inicialize o Git e envie os arquivos:

```powershell
git init
git add .
git commit -m "Publica projeto Pixel TCG"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/PixelTCG.git
git push -u origin main
```

Substitua a URL pelo endereço do seu repositório. O arquivo `.gitignore` evita enviar arquivos compilados, configurações locais e segredos. **Não publique senhas do PostgreSQL, tokens ou chaves privadas.**
