# Feature-Based Structure

## Principle

Organize code by **domain feature**, not by technical layer at the repository root. Each feature owns UI, hooks, services, and (in API) module/controller/service.

## Layout

```
apps/web/src/features/
  technologies/
  profiles/
  resume/
  home/
  auth/
  ingestion/   # read-only UI for cron status (optional)

apps/api/src/features/
  technologies/
  profiles/
  resume/
  ingestion/
  auth/
  health/
```

## Rules

1. Cross-feature imports only through `packages/shared` or explicit public barrels (`index.ts`).
2. One primary responsibility per file when it improves clarity.
3. English identifiers everywhere in code.
4. No duplicate implementations (`*_v2`, `*_advanced`).

## Shared package

`packages/shared` holds types, enums, and Zod schemas consumed by both apps.
