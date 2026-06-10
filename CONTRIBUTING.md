# Contributing to Stackfolio

Thank you for considering a contribution. Stackfolio is an open-source monolith for stack organization and ATS-safe resume PDFs.

## Before you code

1. Read [prompt-tasks/tasks-progress.md](prompt-tasks/tasks-progress.md) for phase status.
2. Read relevant ADRs in [docs/adr/](docs/adr/).
3. Follow [docs/conventions/naming-and-modules.md](docs/conventions/naming-and-modules.md).

## Architecture constraints (ADR)

- **No microservices**, message brokers, or Elasticsearch (ADR-001)
- **No AI/LLM** features (ADR-002)
- **PDF = preview HTML** via Playwright (ADR-003)
- **Redis optional** — cache/rate limit only (ADR-004)
- **ATS sections only** — no free-form canvas (ADR-005)

## Development setup

```bash
pnpm install
cp .env.example .env
pnpm db:setup
pnpm dev
```

## Pull requests

Use the PR template checklist. Update `prompt-tasks` progress when your change completes a tracked task.

## Code style

- `pnpm lint` and `pnpm typecheck` must pass
- Feature-based folders under `apps/*/src/features/`
