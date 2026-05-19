# Research Integrity

## Principle

Declare limitations, conflicts of interest, and AI use. Major journal policies
(AMJ, AMR, IJMR, Nature, and most Elsevier outlets, 2024–2026) REQUIRE
disclosure. Non-disclosure is grounds for desk-rejection.

## Rules

### AI use

- Every literature review, paper or artifact produced with LLM assistance MUST
  declare that use in the Methods (or Limitations) section.
- Specify three things: which model (e.g. "Claude Opus 4.x"), at which stages
  (search, screening, extraction, drafting, editing), and what human
  supervision was applied.
- Example wording:
  > "Initial screening of titles and abstracts was supported by Claude Opus 4.x;
  > all include/exclude decisions were reviewed by the author. The PRISMA flow
  > diagram was generated programmatically and verified manually."

### Limitations

- Every review declares: selection bias (database coverage ≠ universe),
  language bias (which languages were searched), temporal bias (year cutoff),
  access bias (open access vs paywalled).
- When a methodological decision was taken to meet a deadline (e.g. dropping
  hand-search), say so.

### Conflicts of interest

- If the advisor is among cited authors, declare.
- If a seed author is editor of the target journal, declare.
- If funded research is cited, declare funding source.

### Pre-registration (empirical papers)

- Before any primary data collection, pre-register on OSF (or equivalent).
- Specify hypotheses, sample, analysis a priori.
- Document any later deviations explicitly in the manuscript.

### Data privacy (GDPR / LGPD / equivalent)

- Personally identifiable information (PII) NEVER in repo.
- Anonymization procedure documented in Methods.
- `data/raw/` is `.gitignore`d as a default.
- Re-identification risk assessed for small samples.

## Why

Automatic rejection in top journals when AI use is undeclared. Reputation in
academia is the sum of transparency about method. A single integrity finding
after publication can end a career.

## How to apply

- Every delivery in `deliveries/` or equivalent has a "Limitations + AI Use"
  section at the end.
- Commit messages mention AI use when the commit touches manuscript content
  (e.g. `docs(paper1): expand methods section, AI-assisted draft, reviewed`).
- Pre-submission checklist (in `harness-maintenance` or equivalent) verifies
  these sections exist and are non-empty.
