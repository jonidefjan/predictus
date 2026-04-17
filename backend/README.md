# Predictus Backend

API do fluxo de cadastro em múltiplas etapas, construída com NestJS + TypeORM + PostgreSQL.

## Stack

- Node.js 20
- NestJS 10
- TypeORM 0.3
- PostgreSQL 16
- Jest

## Pré-requisitos

- Node.js 20+
- npm 10+
- PostgreSQL 16 (se for rodar sem Docker)

## Variáveis de ambiente

O backend usa estas variáveis:

- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`
- `RESEND_API_KEY`
- `MFA_EXPIRATION_MINUTES` (opcional)
- `PASSWORD_PEPPER` (opcional)
- `BCRYPT_SALT_ROUNDS` (opcional)
- `FRONTEND_URL` (opcional)

Copie o `.env.example` local e preencha os valores:

```bash
cp .env.example .env
```

Se estiver rodando em GitHub Codespaces ou porta publicada, ajuste `FRONTEND_URL` para a URL pública do frontend.

## Rodando em desenvolvimento (local)

1. Instale dependências:

```bash
npm install
```

2. Garanta que o PostgreSQL esteja acessível com as variáveis configuradas.

3. Inicie em modo dev:

```bash
npm run start:dev
```

4. Health check:

- `GET http://localhost:3001/health` ou a URL pública configurada em `NEXT_PUBLIC_API_URL`

## Rodando com Docker Compose

A partir da raiz do repositório:

```bash
docker compose up --build postgres backend
```

Serviço disponível em `http://localhost:3001` dentro do ambiente local. Em ambientes com túnel/porta publicada, use a URL pública configurada no `.env`.

## Scripts

- `npm run start`: inicia a API
- `npm run start:dev`: inicia com watch
- `npm run build`: gera `dist/`
- `npm run start:prod`: executa build de produção
- `npm run test`: testes unitários
- `npm run test:watch`: testes em watch
- `npm run test:cov`: cobertura de testes

## Migrações

As migrações são executadas automaticamente no boot (`migrationsRun: true`).

Scripts úteis:

- `npm run migration:run`
- `npm run migration:revert`
- `npm run migration:show`
- `npm run migration:create`
- `npm run migration:generate`

## Endpoints principais

- `POST /registration/start`
- `GET /registration`
- `GET /registration/:id`
- `PATCH /registration/:id/step`
- `POST /registration/:id/mfa`
- `POST /registration/:id/mfa/resend`
- `POST /registration/:id/complete`
- `GET /cep/:cep`
- `GET /health`

## Estrutura resumida

```text
src/
  app.module.ts
  main.ts
  migrations/
  registration/
    domain/
    application/
    infrastructure/
    presentation/
```
