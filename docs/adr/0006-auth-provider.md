# ADR-006: Auth Provider (NextAuth / Auth.js)

## Status

Accepted

## Context

Personal OSS deployment needs simple login (GitHub OAuth or dev credentials).

## Decision

Use **Auth.js v5 (next-auth)** in `apps/web` with:

- GitHub provider when `GITHUB_ID` / `GITHUB_SECRET` are set
- Credentials provider for local dev (`DEV_AUTH_EMAIL` / `DEV_AUTH_PASSWORD`)
- JWT session passed to API as `Authorization: Bearer <token>`
- API validates JWT with shared `AUTH_SECRET`

## Consequences

**Positive**

- Mature Next.js integration
- Single-user mode via seed `userId`

**Negative**

- Bearer token in API (document HTTPS in production)

## Removed

Dev-only `X-User-Id` header after auth guards shipped (Fase 09).
