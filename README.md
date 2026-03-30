# Predictus

Predictus is a fullstack multi-step registration system with incremental persistence, resume-after-abandonment support, and MFA via email.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router, TypeScript) |
| Backend | NestJS (TypeScript) |
| Database | PostgreSQL 16 with TypeORM |
| Infrastructure | Docker + Docker Compose |

---

## Architecture

- **Backend**: Clean Architecture — domain, application, infrastructure, and presentation layers.
- **Frontend**: Feature-based structure using the Next.js App Router.

---

## Getting Started with Docker

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed.

### Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/jonidefjan/predictus.git
   cd predictus
   ```

2. **Create your `.env` file**

   ```bash
   cp .env.example .env
   ```

   Open `.env` and fill in the required values (see the [Environment Variables](#environment-variables) table below).

3. **Start all services**

   ```bash
   docker-compose up --build
   ```

4. **Access the services**

   | Service | URL |
   |---|---|
   | Frontend | http://localhost:3000 |
   | Backend API | http://localhost:3001 |
   | PostgreSQL | localhost:5432 |

---

## Environment Variables

| Variable | Description | Example / Default |
|---|---|---|
| `DATABASE_HOST` | Hostname of the PostgreSQL service | `postgres` |
| `DATABASE_PORT` | Port of the PostgreSQL service | `5432` |
| `DATABASE_USER` | PostgreSQL username | `your_database_user_here` |
| `DATABASE_PASSWORD` | PostgreSQL password | `your_database_password_here` |
| `DATABASE_NAME` | PostgreSQL database name | `your_database_name_here` |
| `POSTGRES_USER` | PostgreSQL username (used by the postgres Docker image) | `your_database_user_here` |
| `POSTGRES_PASSWORD` | PostgreSQL password (used by the postgres Docker image) | `your_database_password_here` |
| `POSTGRES_DB` | PostgreSQL database name (used by the postgres Docker image) | `your_database_name_here` |
| `RESEND_API_KEY` | API key for the Resend email service | `your_resend_api_key_here` |
| `MFA_EXPIRATION_MINUTES` | How long (in minutes) an MFA code remains valid | `5` |
| `NEXT_PUBLIC_API_URL` | Public URL of the backend API, accessible from the browser | `http://localhost:3001` |

> **⚠️ Important**: Never commit your `.env` file. It is already listed in `.gitignore`.

---

## Running Backend Tests

```bash
docker-compose exec backend npm run test
```

For test coverage:

```bash
docker-compose exec backend npm run test:cov
```

---

## External Services

| Service | Purpose |
|---|---|
| [Resend](https://resend.com) | Transactional email for MFA code delivery |
| [ViaCEP](https://viacep.com.br) | Brazilian ZIP code (CEP) lookup for address auto-fill |