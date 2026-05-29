# ADR-004: Optional Redis for Cache and Rate Limiting

## Status

Accepted

## Context

GitHub API, Hacker News, and roadmap ingestion need TTL caches and rate limits. Redis is optional for local dev.

## Decision

- Redis runs under Docker profile `with-redis`
- When `REDIS_URL` is unset, in-memory fallback with shorter TTL
- Use Redis only for: ingestion cache, news_cache aggregation, rate limit counters

## Consequences

**Positive**

- Dev works without Redis
- Production can enable shared cache across API replicas

**Negative**

- In-memory fallback is not shared across replicas
