# Predictus Frontend

Interface do fluxo de cadastro multi-step, construída com Next.js (App Router).

## Stack

- Node.js 20
- Next.js 15
- React 18
- TypeScript 5
- React Hook Form + Zod

## Pré-requisitos

- Node.js 20+
- npm 10+

## Variáveis de ambiente

- `NEXT_PUBLIC_API_URL`: URL pública da API consumida no client (ex.: `http://localhost:3001`)
- `BACKEND_INTERNAL_URL`: URL interna usada pelos rewrites do Next (opcional; padrão: `http://backend:3001`)

Copie o `.env.example` local e preencha os valores:

```bash
cp .env.example .env.local
```

> Next.js carrega variáveis de `.env.local` em desenvolvimento.
> Em GitHub Codespaces ou porta publicada, use em `NEXT_PUBLIC_API_URL` a URL pública do backend.

## Rodando em desenvolvimento (local)

1. Instale dependências:

```bash
npm install
```

2. Configure as variáveis de ambiente necessárias para apontar ao backend.

3. Inicie o app:

```bash
npm run dev
```

4. Acesse:

- `http://localhost:3000` ou a URL pública configurada em `FRONTEND_URL` na raiz do projeto

## Rodando com Docker Compose

A partir da raiz do repositório:

```bash
docker compose up --build frontend backend postgres
```

Frontend disponível em `http://localhost:3000` localmente. Em ambientes com túnel/porta publicada, use a URL pública configurada no `.env` da raiz.

## Scripts

- `npm run dev`: inicia em desenvolvimento
- `npm run build`: gera build de produção
- `npm run start`: sobe aplicação em produção
- `npm run lint`: roda lint

## Rotas principais

- `/` (home)
- `/register/identification`
- `/register/personal-data`
- `/register/address`
- `/register/mfa`
- `/register/review`
- `/register/success`
- `/register/resume`
- `/records`

## Integração com API

O frontend chama estes recursos:

- `POST /registration/start`
- `PATCH /registration/:id/step`
- `POST /registration/:id/mfa`
- `POST /registration/:id/mfa/resend`
- `POST /registration/:id/complete`
- `GET /registration`
- `GET /registration/:id`
- `GET /cep/:cep`

## Estrutura resumida

```text
src/
  app/
    register/
    records/
  components/
  hooks/
  lib/
  types/
```
