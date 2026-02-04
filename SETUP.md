# Project Setup

## Prerequisites

- Bun >= 1.0
- PostgreSQL >= 14

## Database Setup

> ⚠️ The application does NOT auto-create databases.

```bash
createdb myapp_dev
```

## Environment Setup

```bash
cp .env.example .env

# Edit .env with your values
```

## Install & Run

```bash
bun install
bun run db:generate
bun run db:migrate
bun run dev
```

- API: http://localhost:3000
- Docs: http://localhost:3000/docs

## Testing

```bash
bun test
```
