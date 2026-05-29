# ADR-002: No AI Assistance

## Status

Accepted

## Context

The product requirement explicitly excludes LLM-based features for resume writing, technology suggestions, or ingestion enrichment.

## Decision

- No OpenAI/Anthropic or similar SDKs in dependencies
- Learning suggestions use `technology_relations` rules only
- Ingestion maps external APIs to structured fields without generative text

## Consequences

**Positive**

- Predictable, auditable behavior
- No API key costs or content moderation burden

**Negative**

- Suggestions are limited to seeded/graph relations
- Descriptions come from external sources as-is

## Compliance

Reject PRs adding LLM endpoints, embeddings search, or "AI resume coach" features without a new ADR.
