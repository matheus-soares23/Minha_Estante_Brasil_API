# Minha Estante Brasil

Aplicação para listagem de obras literárias nacionais, onde usuários podem criar sua própria lista com essas histórias e conceder uma nota.

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/minha_estante_brasil"
JWT_SECRET="sua-chave-secreta-aqui"
JWT_EXPIRES_IN="1d"
```

### Instalação

```bash
npm install
npx prisma migrate dev
npm run start:dev
```

---

## Autenticação JWT

A API utiliza **JSON Web Tokens (JWT)** para autenticação. O fluxo funciona da seguinte forma:

### Fluxo de Autenticação

```
1. Cliente envia POST /api/auth/register  →  Cria conta e retorna token
2. Cliente envia POST /api/auth/login     →  Valida credenciais e retorna token
3. Cliente inclui token no header         →  Authorization: Bearer <token>
4. API valida token em rotas protegidas   →  Acesso concedido ou 401
```

### Endpoints de Autenticação

#### Cadastro

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "joao",
  "email": "joao@email.com",
  "password": "senha123",
  "profileImage": "https://exemplo.com/foto.jpg"  // opcional
}
```

**Resposta (201):**
```json
{
  "user": {
    "id": 1,
    "username": "joao",
    "email": "joao@email.com",
    "role": "user",
    "createdAt": "2026-02-24T00:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "login": "joao@email.com",
  "password": "senha123"
}
```

> O campo `login` aceita **e-mail** ou **username**.

**Resposta (200):**
```json
{
  "user": { ... },
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Usando o Token

Inclua o token no header `Authorization` em todas as rotas protegidas:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## Rotas Públicas e Privadas

### Rotas Públicas (sem autenticação)

| Método | Rota                          | Descrição                  |
|--------|-------------------------------|----------------------------|
| POST   | `/api/auth/register`          | Cadastro de usuário        |
| POST   | `/api/auth/login`             | Login                      |
| GET    | `/api/books`                  | Listar livros              |
| GET    | `/api/books/:id`              | Detalhes do livro          |
| GET    | `/api/books/author/:authorId` | Livros por autor           |
| GET    | `/api/authors`                | Listar autores             |
| GET    | `/api/authors/:id`            | Detalhes do autor          |
| GET    | `/api/genres`                 | Listar gêneros             |
| GET    | `/api/genres/:id`             | Detalhes do gênero         |
| GET    | `/api/series`                 | Listar séries              |
| GET    | `/api/series/:id`             | Detalhes da série          |
| GET    | `/api/reviews`                | Listar reviews             |
| GET    | `/api/reviews/:id`            | Detalhes da review         |
| GET    | `/api/reviews/book/:bookId`   | Reviews por livro          |
| GET    | `/api/reviews/user/:userId`   | Reviews por usuário        |

### Rotas Privadas (requerem token JWT)

| Método | Rota                          | Descrição                  |
|--------|-------------------------------|----------------------------|
| POST   | `/api/books`                  | Criar livro                |
| PUT    | `/api/books/:id`              | Atualizar livro            |
| DELETE | `/api/books/:id`              | Remover livro              |
| POST   | `/api/authors`                | Criar autor                |
| PUT    | `/api/authors/:id`            | Atualizar autor            |
| DELETE | `/api/authors/:id`            | Remover autor              |
| POST   | `/api/genres`                 | Criar gênero               |
| PATCH  | `/api/genres/:id`             | Atualizar gênero           |
| DELETE | `/api/genres/:id`             | Remover gênero             |
| POST   | `/api/series`                 | Criar série                |
| PATCH  | `/api/series/:id`             | Atualizar série            |
| DELETE | `/api/series/:id`             | Remover série              |
| POST   | `/api/reviews`                | Criar review               |
| PATCH  | `/api/reviews/:id`            | Atualizar review           |
| DELETE | `/api/reviews/:id`            | Remover review             |
| GET    | `/api/users`                  | Listar usuários            |
| GET    | `/api/users/:id`              | Detalhes do usuário        |
| PUT    | `/api/users/:id`              | Atualizar usuário          |
| DELETE | `/api/users/:id`              | Remover usuário            |
| ALL    | `/api/user-book-list/**`      | Gerenciar lista do usuário |
