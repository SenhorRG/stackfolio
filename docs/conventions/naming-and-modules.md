# Naming and Modules

## Language

- Source code: **English** (identifiers, comments, commit messages)
- `prompt-tasks/`: Brazilian Portuguese allowed

## Files

- React components: `PascalCase.tsx`
- Hooks: `useThing.ts`
- Services/API: `thing-api.ts` or `thing.service.ts`
- NestJS: `thing.controller.ts`, `thing.module.ts`

## Modules

- Prefer one export per file when it clarifies responsibility
- Barrel `index.ts` only at feature boundary, not for every tiny helper

## API

- REST plural nouns: `/technologies`, `/profiles`, `/resume-projects`
- Query params: `q`, `category`, `limit`, `offset`

## Database

- Prisma models: PascalCase singular (`Technology`)
- Columns: camelCase in Prisma, snake_case in DB via `@map` when needed
