# 🎯 Predictus

> Sistema de cadastro multi-step com persistência incremental, recuperação de abandono e verificação MFA por email.

![Node.js](https://img.shields.io/badge/Node.js-20-green)
![NestJS](https://img.shields.io/badge/NestJS-10-red)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)

---

## Visão Geral

O **Predictus** é um sistema fullstack de cadastro em múltiplas etapas com:

- **Cadastro em 5 etapas** (identificação, dados pessoais, endereço, MFA, revisão)
- **Persistência incremental** — dados salvos a cada etapa, nenhum progresso é perdido
- **Recuperação de abandono** — cron job detecta cadastros inativos e envia e-mail de retomada
- **MFA via e-mail** — código de 6 dígitos gerado, enviado via Resend e validado com expiração configurável
- **Clean Architecture** no backend (domain → application → infrastructure → presentation)
- **Mobile-first** no frontend

---

## Tech Stack

| Camada | Tecnologia | Versão |
|---|---|---|
| Frontend | Next.js (App Router) | 15 |
| Frontend | React | 18 |
| Frontend | TypeScript | 5 |
| Frontend | React Hook Form | latest |
| Frontend | Zod | latest |
| Backend | NestJS | 10 |
| Backend | TypeORM | latest |
| Backend | PostgreSQL | 16 |
| Backend | Resend (e-mail) | latest |
| Backend | bcrypt | latest |
| Backend | class-validator | latest |
| Infraestrutura | Docker + Docker Compose | latest |
| Testes | Jest + ts-jest | latest |

---

## Arquitetura

### Estrutura do Projeto

```
predictus/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── health.controller.ts
│       ├── registration/
│       │   ├── registration.module.ts
│       │   ├── domain/
│       │   │   ├── entities/
│       │   │   ├── interfaces/
│       │   │   └── enums/
│       │   ├── application/
│       │   │   ├── use-cases/
│       │   │   └── dtos/
│       │   ├── infrastructure/
│       │   │   ├── repositories/
│       │   │   ├── providers/
│       │   │   └── schedulers/
│       │   └── presentation/
│       │       └── controllers/
│       ├── migrations/
│       └── shared/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.mjs
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── icon.svg
│       │   ├── records/
│       │   │   └── page.tsx
│       │   └── register/
│       │       ├── layout.tsx
│       │       ├── identification/
│       │       ├── personal-data/
│       │       ├── address/
│       │       ├── mfa/
│       │       ├── review/
│       │       ├── success/
│       │       └── resume/
│       ├── hooks/
│       ├── lib/
│       ├── components/
│       └── types/
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

### Clean Architecture (Backend)

```
┌──────────────────────────────────────────────┐
│                PRESENTATION                   │
│           Controllers (thin, no logic)        │
├──────────────────────────────────────────────┤
│                APPLICATION                    │
│        Use Cases (business logic)             │
│        DTOs (validation)                      │
├──────────────────────────────────────────────┤
│                  DOMAIN                       │
│     Entities, Interfaces, Enums               │
├──────────────────────────────────────────────┤
│              INFRASTRUCTURE                   │
│  Repositories (TypeORM), Providers (Resend,   │
│  ViaCEP), Schedulers (Cron)                   │
└──────────────────────────────────────────────┘
```

### Fluxo de Cadastro

```
Etapa 1          Etapa 2            Etapa 3         Etapa 4        Etapa 5        Etapa 6
E-mail      →  Dados Pessoais  →  Endereço     →    MFA       →  Revisão    →  Sucesso
POST /start    PATCH /:id/step    PATCH /:id/step  POST /:id/mfa  POST /:id/complete
                  (step=1)          (step=2)                       (password)
```

> O código MFA é gerado e enviado automaticamente ao completar a etapa de Endereço (step 2).

### Injeção de Dependência

| Token | Interface | Implementação |
|---|---|---|
| `REGISTRATION_REPOSITORY` | `IRegistrationRepository` | `TypeOrmRegistrationRepository` |
| `EMAIL_PROVIDER` | `IEmailProvider` | `ResendEmailProvider` |
| `CEP_PROVIDER` | `ICepProvider` | `ViaCepProvider` |

---

## Iniciando com Docker

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) (20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (2.0+)

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/jonidefjan/predictus.git
   cd predictus
   ```

2. Copie o arquivo de variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```

3. Edite o `.env` e preencha com seus valores reais:
   ```bash
   nano .env  # ou use seu editor preferido
   ```

4. Inicie todos os serviços:
   ```bash
   docker-compose up --build
   ```

5. Acesse a aplicação:
   - 🌐 Frontend: http://localhost:3000
   - ⚙️ Backend API: http://localhost:3001
   - 🗄️ PostgreSQL: localhost:5432

---

## Variáveis de Ambiente

| Variável | Descrição | Exemplo | Obrigatório |
|---|---|---|---|
| `DATABASE_HOST` | Host do PostgreSQL | `postgres` | ✅ |
| `DATABASE_PORT` | Porta do PostgreSQL | `5432` | ✅ |
| `DATABASE_USER` | Usuário do banco de dados | `your_user` | ✅ |
| `DATABASE_PASSWORD` | Senha do banco de dados | `your_password` | ✅ |
| `DATABASE_NAME` | Nome do banco de dados | `predictus` | ✅ |
| `POSTGRES_USER` | Usuário do container PostgreSQL | `your_user` | ✅ |
| `POSTGRES_PASSWORD` | Senha do container PostgreSQL | `your_password` | ✅ |
| `POSTGRES_DB` | Banco de dados do container PostgreSQL | `predictus` | ✅ |
| `RESEND_API_KEY` | API key do Resend para envio de e-mails | `re_xxx` | ✅ |
| `PASSWORD_PEPPER` | Segredo HMAC-SHA256 aplicado à senha antes do bcrypt | `your_secret_pepper` | ✅ |
| `BCRYPT_SALT_ROUNDS` | Rounds do bcrypt para hash de senha | `12` | ❌ (padrão: 12) |
| `MFA_EXPIRATION_MINUTES` | Tempo de expiração do código MFA (minutos) | `5` | ❌ (padrão: 5) |
| `FRONTEND_URL` | URL do frontend (para links nos e-mails) | `http://localhost:3000` | ❌ |
| `NEXT_PUBLIC_API_URL` | URL do backend para o frontend | `http://localhost:3001` | ❌ |

> ⚠️ **NUNCA** commite o `.env` com valores reais. Apenas o `.env.example` com placeholders deve estar no repositório.

---

## API Endpoints

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/registration/start` | Inicia o cadastro (status `pending`) |
| `GET` | `/registration` | Lista todos os registros |
| `GET` | `/registration/:id` | Obtém dados do cadastro (para retomada) |
| `PATCH` | `/registration/:id/step` | Atualiza dados de uma etapa incrementalmente |
| `POST` | `/registration/:id/mfa` | Verifica o código MFA |
| `POST` | `/registration/:id/mfa/resend` | Reenvia o código MFA |
| `POST` | `/registration/:id/complete` | Finaliza o cadastro (com senha) |
| `GET` | `/cep/:cep` | Busca endereço pelo CEP |
| `GET` | `/health` | Health check do backend |

---

## Executando Testes

### Testes unitários
```bash
docker-compose exec backend npm run test
```

### Com cobertura
```bash
docker-compose exec backend npm run test:cov
```

### Watch mode
```bash
docker-compose exec backend npm run test:watch
```

### Apenas os use cases principais
```bash
docker-compose exec backend npx jest --testPathPattern="use-cases/__tests__"
```

---

## Funcionalidades em Destaque

### Persistência Incremental

Cada etapa do formulário envia um `PATCH /registration/:id/step` ao ser concluída. O progresso é salvo no banco a cada avanço, garantindo que nenhum dado seja perdido em caso de abandono ou falha.

### Recuperação de Abandono

Um cron job roda a cada 10 minutos e detecta cadastros com mais de 30 minutos de inatividade (status `IN_PROGRESS`). Para cada um, um e-mail de recuperação é enviado com um link direto para `/register/resume?id=xxx`, permitindo retomar de onde parou.

### MFA via E-mail

Ao completar a etapa de endereço (step 2), um código de 6 dígitos é gerado e enviado via Resend. O código é de uso único e expira após o tempo configurado em `MFA_EXPIRATION_MINUTES`. Após a verificação bem-sucedida, o código é limpo do banco.

### Autopreenchimento de CEP

O frontend chama o endpoint `/cep/:cep` do backend (não diretamente a API ViaCEP). O backend delega para o `ViaCepProvider` via interface `ICepProvider`, mantendo o frontend totalmente desacoplado da fonte de dados de endereços.

---

## Serviços Externos

| Serviço | Finalidade | Padrão de Provider |
|---|---|---|
| [Resend](https://resend.com) | E-mail (códigos MFA + lembretes de abandono) | `IEmailProvider` → `ResendEmailProvider` |
| [ViaCEP](https://viacep.com.br) | Busca de endereço por CEP | `ICepProvider` → `ViaCepProvider` |

Para trocar um provider, altere apenas uma linha no `registration.module.ts`:
```typescript
// Exemplo: trocar para outro provedor de e-mail
{ provide: EMAIL_PROVIDER, useClass: SendGridEmailProvider }
```

---

## Arquitetura Docker

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Frontend   │────▶│  Backend    │────▶│  PostgreSQL  │
│  :3000      │     │  :3001      │     │  :5432       │
│  Next.js 15 │     │  NestJS 10  │     │  postgres:16 │
└─────────────┘     └─────────────┘     └──────────────┘
       │                   │                    │
       └───────────────────┴────────────────────┘
                    app-network (bridge)
```

> O frontend utiliza Next.js rewrites para proxy das chamadas API (`/registration/*`, `/cep/*`, `/health`), permitindo comunicação via rede interna Docker (`http://backend:3001`) sem expor o backend diretamente ao browser. Ideal para ambientes como GitHub Codespaces.

---

## Páginas do Frontend

| Rota | Descrição |
|---|---|
| `/` | Página inicial |
| `/register/identification` | Etapa 1 — E-mail |
| `/register/personal-data` | Etapa 2 — Dados pessoais |
| `/register/address` | Etapa 3 — Endereço (com autopreenchimento via CEP) |
| `/register/mfa` | Etapa 4 — Verificação MFA |
| `/register/review` | Etapa 5 — Revisão dos dados + definição de senha |
| `/register/success` | Etapa 6 — Cadastro concluído |
| `/register/resume` | Retomada de cadastro abandonado |
| `/records` | Listagem de todos os registros do banco |

---

## Segurança

- ✅ Senhas com hash bcrypt (salt rounds configurável via `BCRYPT_SALT_ROUNDS`, padrão 12)
- ✅ Pepper (HMAC-SHA256) aplicado à senha antes do bcrypt via `PASSWORD_PEPPER`
- ✅ Códigos MFA de uso único (removidos após verificação)
- ✅ Códigos MFA com expiração configurável
- ✅ Campos sensíveis (`password`, `mfaCode`) nunca expostos nas respostas da API
- ✅ Variáveis de ambiente para todos os secrets
- ✅ `.env` no `.gitignore` — apenas `.env.example` é commitado
- ✅ Health check endpoint para monitoramento (`GET /health`)
- ✅ Frontend com proxy reverso via Next.js rewrites (sem CORS exposto ao browser)

### Proteção de Senha em Camadas

```
Senha (texto plano)
  │
  ▼
HMAC-SHA256(senha, PASSWORD_PEPPER)   ← pepper: segredo do servidor (.env)
  │
  ▼
bcrypt(peppered_password, BCRYPT_SALT_ROUNDS)  ← salt: gerado pelo bcrypt
  │
  ▼
Hash final salvo no banco
```

Mesmo com acesso total ao banco de dados, sem o `PASSWORD_PEPPER` (armazenado apenas no `.env` do servidor) os hashes são inúteis para ataques de força bruta.

---

## Licença

MIT