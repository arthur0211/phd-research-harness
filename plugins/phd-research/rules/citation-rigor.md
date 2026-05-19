# Citation Rigor

## Principle

Every academic claim has a verified citation. **NEVER fabricate reference, DOI,
year or authors.**

## Rules

- Every assertion that looks factual about prior literature MUST come with
  `(Author, Year)` + a verifiable DOI.
- Before citing a paper for the first time in a session, verify it via at least
  one authoritative source:
  - OpenAlex API (`WebFetch https://api.openalex.org/works/...`)
  - Crossref API (`WebFetch https://api.crossref.org/works/<DOI>`)
  - Semantic Scholar MCP / API
  - Zotero local API (port 23119 if running)
- If a paper is NOT confirmed in an authoritative source, mark it as
  `[NOT VERIFIED]` (or `[NÃO VERIFICADO]` in PT-BR artifacts) and NEVER remove
  that marker without explicit confirmation.
- DOIs follow the pattern `10.XXXX/...`. Reject any "DOI" outside this format.
- If citing the researcher's advisor or program faculty, confirm authorship in
  Lattes, ORCID, or institutional profile before publishing.

## Anti-patterns

- "Maybe cite Smith (2022)" without first confirming Smith 2022 exists.
- Inventing a plausible title to fill a gap in the argument.
- Rewriting a publication year so the paper "fits" the narrative.
- Quoting verbatim a passage that was paraphrased by the model (always
  reread the source PDF before using direct quotes).

## When uncertain

Write `[citation to confirm]` (or `[citação a confirmar]`) inline and list
the open citations at the artifact footer. An explicit gap is always better
than a polished fabrication.

## Why

Citation fabrication is a documented ground for retraction. Top-tier journal
review processes routinely sample-check references. The cost of a single
fabricated citation discovered post-submission is orders of magnitude higher
than the cost of an honest gap.

## How to apply

- In every `.md` file inside delivery / manuscript folders.
- Before any `git add` on `references/library.bib`.
- In every prompt sent to `literature-scout`, `slr-architect`, or any
  research-extraction agent — repeat the constraint explicitly when stakes
  warrant it.
- During `harness-maintenance` audits: grep deliveries for `(20XX)` patterns
  without an adjacent DOI and flag them.
