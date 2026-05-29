# ADR-003: PDF via Playwright with Preview Parity

## Status

Accepted

## Context

Users need WYSIWYG confidence: what they see in the editor preview must match the exported PDF.

## Decision

1. `GET /cv-preview/:id` returns static HTML+CSS (no editor JS)
2. Browser iframe in the editor loads the same URL
3. `POST /resume-projects/:id/export-pdf` uses Playwright `page.setContent(html)` then `page.pdf()`
4. One renderer (`CvPreviewRenderer`) produces HTML for both routes

## Consequences

**Positive**

- Single source of truth for layout
- ATS-safe linear sections

**Negative**

- API container needs Chromium dependencies
- PDF generation is CPU-bound on API

## Rejected alternatives

Client-side Paged.js PDF (divergence risk) — deferred.
