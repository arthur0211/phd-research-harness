---
name: citation-verify
description: Active citation verification via parallel lookup against OpenAlex, Crossref, and Semantic Scholar before any reference enters a draft or library.bib. Use when you need to verify citation, check reference, confirm DOI lookup, validate cite, before adding to bib, verificar referência, checar DOI, or when asked "is this paper real?". Returns verified/ambiguous/not-found status with confidence scoring; refuses to fabricate DOIs. Auto-suggested before any Write/Edit on references/library.bib.
---

# citation-verify

## When to use

- **Manually**: any time you need to confirm a `(Author, Year)` is real before pasting it into a draft.
- **Auto-suggested**: before any `Write` or `Edit` on `references/library.bib`, on `manuscript/*.{md,tex,qmd}`, or on any file under `disciplina-caldas/revisao-literatura/`.
- **By other agents**: `slr-architect` calls this skill before emitting any literature claim into `why.md` or `tipo-revisao.md`. `literature-scout` calls it before promoting a candidate to the "verified" pool.

Do NOT use for:
- Internal project notes that are not user-facing (e.g. brainstorming in `tema-exploration/`).
- Citations already inside `library.bib` that have been previously verified (cached in `references/.verified-cache.json`).

## Goal

Given a list of candidate citations, return a status table where every row is one of:

- ✅ **Verified** — high-confidence DOI from ≥2 independent sources; safe to cite and append to `library.bib`.
- ⚠️ **Ambiguous** — multiple plausible matches OR author/year slightly off; user must disambiguate before citing.
- ❌ **Not found** — zero matching DOIs within tolerance; MUST NOT be cited. Apply `[NOT VERIFIED]` marker per `citation-rigor.md`.

The skill NEVER returns a fabricated DOI. The skill NEVER returns ✅ on the strength of a single source.

## Workflow

### Step 1 — Receive input

Accept any of:

1. **Plain list** (one per line):
   ```
   Cronin & George, 2023, "The Why and How of the Integrative Review"
   Rousseau, 2024, "Review methodology for management"
   Smith, 2022, "Workplace financial stress"
   ```
2. **BibTeX entry** (extract `author`, `year`, `title` fields).
3. **Free-text paragraph** — extract `(Author Year)` and `(Author & Coauthor, Year)` patterns via regex `\(([A-Z][a-zA-Z\-]+(?:\s*(?:&|et al\.?|,)\s*[A-Z][a-zA-Z\-]+)*),?\s*(\d{4})\)`. Ask user to confirm the extracted list before lookup.

If input is ambiguous, ask ONE clarifying question and stop.

### Step 2 — Parallel lookup (3 sources per candidate)

For each candidate `(author, year, title)`, run THREE `WebFetch` calls in parallel (single message, multiple tool calls):

**OpenAlex** (no key required):
```
https://api.openalex.org/works?search=<url-encoded-title>&filter=publication_year:<year>&per_page=5&mailto=<researcher-email-from-settings>
# The `mailto=` parameter is the OpenAlex polite-pool convention. Read it from
# settings.local.json `researcher.contactEmail` (optional). Skip the parameter
# entirely if not set — the API still works without it.
```
Extract from JSON: `results[].id` (OpenAlex ID), `results[].doi`, `results[].title`, `results[].publication_year`, `results[].authorships[0].author.display_name`.

**Crossref** (no key required):
```
https://api.crossref.org/works?query.title=<url-encoded-title>&query.author=<url-encoded-first-author>&filter=from-pub-date:<year-1>,until-pub-date:<year+1>&rows=5&mailto=<researcher-email-from-settings>
```
Extract: `message.items[].DOI`, `message.items[].title[0]`, `message.items[].author[0].family`, `message.items[].issued.date-parts[0][0]`.

**Semantic Scholar** (no key required):
```
https://api.semanticscholar.org/graph/v1/paper/search?query=<url-encoded-title>&year=<year-1>-<year+1>&limit=5&fields=title,year,authors,externalIds
```
Extract: `data[].externalIds.DOI`, `data[].title`, `data[].year`, `data[].authors[0].name`.

### Step 3 — Score match quality

For each candidate, compute per-source best match:

1. **Title similarity** — token-level Jaccard OR Levenshtein-normalized cosine; both implementations acceptable. Threshold ≥0.85.
2. **Author family-name match** — case-insensitive exact match on the first author's family name. Tolerate Unicode diacritics (`é`↔`e`).
3. **Year tolerance** — ±1 year (handles online-first vs issue-assigned year).

Decision rule:

| Sources agreeing on same DOI | Title sim (best) | Author match | Year delta | Status |
|---|---|---|---|---|
| ≥2 of 3 | ≥0.85 | ✓ | 0 | ✅ Verified |
| ≥2 of 3 | ≥0.85 | ✓ | ±1 | ✅ Verified (note: year shift) |
| 1 of 3 | ≥0.95 | ✓ | 0 | ⚠️ Ambiguous (single-source) |
| ≥1 | <0.85 OR mismatch | — | — | ⚠️ Ambiguous (review match) |
| 0 | — | — | — | ❌ Not found |

If 2 sources return DIFFERENT DOIs for the same candidate: ⚠️ Ambiguous; show user both with publisher/venue so they can pick.

### Step 4 — Output table

Render markdown table:

```
| # | Candidate | Status | DOI | Confidence | Notes |
|---|---|---|---|---|---|
| 1 | Cronin & George, 2023, "The Why and How..." | ✅ | 10.1177/10944281211003923 | 3/3 | OpenAlex+Crossref+S2 all agree |
| 2 | Rousseau, 2024, "Review methodology..." | ⚠️ | 10.1111/joms.12998 | 1/3 | Only Crossref hit; title sim 0.91 |
| 3 | Smith, 2022, "Workplace financial stress" | ❌ | — | 0/3 | No matching record in any source |
| 4 | Fantinel de Rosso, 2024, "..." (HRMR) | ✅ | 10.1016/j.hrmr.2024.101005 | 2/3 | OpenAlex+S2 agree; ready for BibTeX |
```

### Step 5 — Optional BibTeX generation (✅ only)

For each ✅ row, ask the user: "Append verified entries to `references/library.bib`? [y/N]".

If yes:
1. Pull full metadata from OpenAlex `https://api.openalex.org/works/<openalex-id>` (full record).
2. Generate BibTeX with citekey convention `<firstAuthorFamilyLowercase><year><firstTitleWordLowercase>`, e.g. `cronin2023why`.
3. Use `Edit` tool to append to `references/library.bib`. NEVER use `git add` — per `safety.md` and project convention, that is the user's choice in entrega commits.
4. Update `references/.verified-cache.json` with `{citekey, doi, verified_at, sources: ["openalex","crossref","s2"]}`.

### Step 6 — Refuse-to-cite for ❌

For each ❌:
- Output exact text the user should paste in the draft INSTEAD of the citation:
  ```
  [NOT VERIFIED: "Smith 2022 workplace financial stress" — no matching DOI found in OpenAlex/Crossref/Semantic Scholar on 2026-05-19]
  ```
- This marker is required by `citation-rigor.md` and MUST NOT be silently removed.

## Output format (example, all 4 statuses)

```markdown
## Citation verification report — 2026-05-19

Input: 4 candidates. Sources queried: OpenAlex, Crossref, Semantic Scholar.

| # | Candidate                                          | Status | DOI                              | Confidence | Notes                                                 |
|---|----------------------------------------------------|--------|----------------------------------|------------|-------------------------------------------------------|
| 1 | Cronin & George, 2023, "The Why and How..."        | ✅     | 10.1177/10944281211003923        | 3/3        | All sources agree; ready for BibTeX                   |
| 2 | Rousseau, 2024, "Evidence-Based Review..."         | ⚠️     | 10.1111/joms.12998 (only)        | 1/3        | Only Crossref returns DOI; title sim 0.91. User check |
| 3 | Smith, 2022, "Workplace financial stress"          | ❌     | —                                | 0/3        | No record in any source. Use [NOT VERIFIED] marker    |
| 4 | Fantinel de Rosso, 2024, HRMR review               | ✅     | 10.1016/j.hrmr.2024.101005       | 2/3        | OpenAlex+S2 agree; Crossref returned related paper    |

### BibTeX-ready (✅ only)

Reply `yes` to append rows 1, 4 to references/library.bib:

@article{cronin2023why,
  title   = {The Why and How of the Integrative Review},
  author  = {Cronin, Matthew A. and George, Elizabeth},
  journal = {Organizational Research Methods},
  year    = {2023},
  doi     = {10.1177/10944281211003923}
}

@article{fantineldoresso2024workplace,
  title   = {Workplace financial well-being: A systematic review},
  author  = {Fantinel de Rosso, ... and ...},
  journal = {Human Resource Management Review},
  year    = {2024},
  doi     = {10.1016/j.hrmr.2024.101005}
}

### Refused (❌)

Row 3 ("Smith 2022 workplace financial stress") — DO NOT cite. Paste in your draft:

> [NOT VERIFIED: "Smith 2022 workplace financial stress" — no matching DOI found in OpenAlex/Crossref/Semantic Scholar on 2026-05-19]
```

## Constraints

- **NEVER fabricates DOI** to fill missing data. If 0 sources return a match, the answer is ❌. Period.
- **NEVER returns ✅ without 2+ source agreement.** Single-source matches are ⚠️ at best.
- **Rate limits**: max 10 candidates per batch; 1s sleep between batches (Crossref polite pool); use `mailto=` query param on Crossref/OpenAlex for polite-pool treatment.
- **Output language follows `researcher.language`** from `settings.local.json`. Default `pt-BR` produces PT-BR Notes/headers but DOI/title/author kept verbatim.
- **No silent cache invalidation**: if `.verified-cache.json` says verified, trust it for ≤90 days; after that, re-verify on next use.
- **No `git add`** of `library.bib` from this skill. The user does that in entrega commits explicitly.

## Anti-patterns

- ❌ "Probably fine, looks legitimate" — without 2-source DOI agreement, the answer is ⚠️ or ❌, never ✅.
- ❌ Relaxing title similarity threshold below 0.85 to "make the match work". The threshold exists because below 0.85 means likely a different paper with similar keywords.
- ❌ Ignoring title mismatch when DOI looks familiar. Famous DOIs are sometimes pasted as decoys; always verify title matches.
- ❌ Returning ✅ because "the journal exists and the year is plausible". Existence of journal ≠ existence of paper.
- ❌ Auto-appending to `library.bib` without explicit user confirmation.

## Why active verification beats passive marker

`citation-rigor.md` says "mark `[NOT VERIFIED]` if unsure". That's a **passive defense** — it traps fabrications only if the author remembers to apply the marker.

This skill is the **active counterpart**: don't even let unverified entries reach a draft. Every citation that survives to `library.bib` has 2+ independent sources agreeing on its DOI.

In a multi-year thesis, the cost of one fabricated citation surviving to the manuscript is retraction-level. The cost of running this skill before any `library.bib` write is ~30 seconds per batch of 10.

## Refs

- `.claude/rules/citation-rigor.md` — passive marker convention this skill enforces actively
- `references/library.bib` — destination of ✅ entries (via Edit, never via this skill's direct write)
- `literature-scout` — agent that calls this skill before promoting candidates
- `slr-architect` — agent that calls this skill before emitting literature claims
