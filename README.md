# Stackfolio

Open-source stack organizer and ATS-safe resume PDF generator. Monolith: Next.js + NestJS + PostgreSQL.

## Features

- Browse skills by category with search
- Main profile + derived profiles with stack levels
- Resume editor with vertical section reorder (dnd-kit)
- HTML preview at `/cv-preview/:id` with Playwright PDF export (preview = PDF)


## Quick start

```bash
pnpm install
docker compose up -d postgres
cp .env.example .env
pnpm db:setup
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001/health

Default user: 
dev@stackfolio.local
devpassword

Optional Redis:

```bash
docker compose --profile with-redis up -d redis
```

## Project structure

```
apps/web/          Next.js frontend
apps/api/          NestJS API + Prisma
packages/shared/   Types and Zod schemas
docs/              ADRs and architecture
prompt-tasks/      Implementation phases and progress
```

## Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [docs/adr/](docs/adr/)

## License

MIT — see [LICENSE](LICENSE)
