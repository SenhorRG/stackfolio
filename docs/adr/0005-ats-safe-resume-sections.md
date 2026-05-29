# ADR-005: ATS-Safe Predefined Resume Sections

## Status

Accepted

## Context

Free-form canvas editors produce PDFs that fail ATS parsers. Stackfolio targets structured, vertical sections only.

## Decision

- Fixed section IDs from `@stackfolio/shared` (`ResumeSectionId`)
- Editor allows vertical reorder via dnd-kit on **sections**, not arbitrary widgets
- `json_layout` schema rejects x/y positioning fields (Zod `.strict()`)
- Template maps each section to a semantic HTML block (`<section>`, headings, lists)

## Sections

Header, Summary, Skills, Experience, Education, Projects, Certifications, Languages, Links

## Consequences

**Positive**

- Consistent ATS parsing
- Simpler preview template

**Negative**

- No drag-and-drop text boxes or image overlays in v0.1
