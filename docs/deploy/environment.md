# Environment Variables

Copy `.env.example` to `.env` at repository root.

## Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Shared secret for JWT (web + api) |
| `API_PORT` | NestJS port (default 3001) |
| `WEB_URL` | Next.js origin for CORS |
| `NEXT_PUBLIC_API_URL` | API base URL for browser |

## Optional

| Variable | Description |
|----------|-------------|
| `REDIS_URL` | Enable Redis cache (ingestion/news) |
| `GITHUB_TOKEN` | GitHub API for ingestion |
| `GITHUB_ID` / `GITHUB_SECRET` | GitHub OAuth |
| `DEV_AUTH_EMAIL` / `DEV_AUTH_PASSWORD` | Dev credentials login |
| `DEFAULT_USER_ID` | Seed user id |
| `INGESTION_CRON_ENABLED` | Set `false` to disable cron |

## Docker production

```bash
docker compose -f docker-compose.prod.yml up -d
```

Ensure `AUTH_SECRET` and database passwords are strong in production.
