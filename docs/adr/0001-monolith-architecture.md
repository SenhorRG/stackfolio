# ADR-001: Monolith Architecture

## Status

Accepted

## Context

Stackfolio is a personal/small-team OSS tool. Operational complexity must stay low. The product needs a web UI, REST API, PostgreSQL, optional Redis cache, and scheduled ingestion jobs.

## Decision

Two deployable applications share one PostgreSQL database:

- `apps/web` — Next.js (App Router)
- `apps/api` — NestJS (REST + cron + Playwright PDF)

No message broker, no service mesh, no microservices, no Elasticsearch, no distributed CQRS.

## Consequences

**Positive**

- Simple Docker Compose deploy
- Single schema and Prisma client in API
- Easier debugging and onboarding

**Negative**

- Horizontal scaling requires stateless API replicas + shared Redis/DB
- Web and API must be versioned together for breaking contract changes

## Compliance

Reject PRs that introduce Kafka, RabbitMQ, separate search services, or split databases without a new ADR.
