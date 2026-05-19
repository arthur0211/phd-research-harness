---
name: screening-workflow
description: Title+abstract screening for SLR with PICOS/SPIDER criteria, auditable decision log, and PRISMA flow output. Use when you need to screen papers, do title abstract screening, run PRISMA screening, triage 100 papers, set up ASReview, define include exclude criteria, or do triagem / PRISMA T/A. Produces screening-results.csv + PRISMA flow + decisions log; recommends ASReview for N>200 and requires it for N>500. Never auto-excludes without explicit criteria; all "maybe" decisions queue for human full-text review.
---

# screening-workflow

## When to use

Run AFTER deduplication, BEFORE full-text retrieval. Specifically:

- Sweep done across Scopus/WoS/EBSCO; deduplicated set sitting in `data/sweep/dedup.bib` or `.ris`.
- N between 50 and 2000 (per `slr-disciplina-caldas.md` faixa-N rule).
- About to start full-text retrieval — but full-text effort scales linearly with N, so triage first.

Do NOT use for:
- Pre-dedup sets — run dedup first (Zotero "Duplicate Items" or `synthesisr::deduplicate()`).
- Sets without abstracts — this skill requires `title + abstract` per record; if abstracts missing, retrieve them first via OpenAlex/Crossref.
- Final inclusion decisions — those require full-text review by the human researcher.

## Goal

Produce three auditable artifacts in `disciplina-caldas/revisao-literatura/entrega-02-2026-06-14/screening/`:

1. **`screening-results.csv`** — one row per paper with decision (`include` / `maybe` / `exclude`), reasoning summary, criteria-version hash.
2. **`screening-prisma-flow.md`** — PRISMA 2020 flow diagram template populated with counts (identified, deduped, screened, excluded with reason breakdown, full-text assessed, included).
3. **`screening-decisions-log.md`** — per-batch journal: criteria version, decision distribution, edge cases discussed, AI-assistance disclosure per `research-integrity.md`.

The set of records that leave this skill = `include` + `maybe`. The `exclude` set is documented (with reasons) but never deleted from the input file.

## Workflow

### Step 1 — Input

Accept path to a deduplicated bibliography file:
- `.bib` (BibTeX) — preferred, parse with simple regex or `bibtexparser`
- `.ris` (RIS) — common EBSCO/Scopus export, parse with `rispy`
- `.csv` — must have columns `id,title,abstract,year,venue`

If file is missing abstracts on >20% of records, STOP and tell user to enrich first.

### Step 2 — Define criteria (interactive)

Walk the user through **PICOS** (quantitative leaning) OR **SPIDER** (qualitative leaning), and capture additional filters. Default to PICOS unless review type in `methodology.review-type` is qualitative-meta-synthesis.

**PICOS** prompts:
- **P**opulation — e.g., "working adults in formal employment"
- **I**ntervention OR phenomenon of interest — e.g., "exposure to financial stressors at work"
- **C**omparator — e.g., "non-stressed peers" OR explicitly N/A
- **O**utcome — e.g., "decision-making quality measured by..."
- **S**tudy design — e.g., "empirical (quant, qual, mixed); exclude editorials, book reviews"

**SPIDER** prompts (if qualitative):
- **S**ample — **P**henomenon of **I**nterest — **D**esign — **E**valuation — **R**esearch type

Additional filters:
- **Time window** — e.g., `2014-2026` (anchor in user's protocol)
- **Language** — default `[en, pt]`
- **Document type** — default `[journal-article, review-article]`; exclude `[editorial, book-review, erratum, retraction-notice]` unless review type demands

Generate a **criteria-version** string `crit-v<n>-<sha8>` from the SHA-256 of the full criteria text (truncated to 8 chars). Every decision row will carry this version for reproducibility.

### Step 3 — Parse file → working set

Build in-memory list of records:
```
{id, title, abstract, year, venue, authors, doi}
```
Skip records with `abstract` empty or `<200 chars` → tag as `maybe-missing-abstract` automatically; do not score them.

### Step 4 — Per-paper scoring

For each paper:

1. Score 1-5 on each PICOS/SPIDER criterion using title + abstract.
   - **5** — explicit match in title or first sentence of abstract
   - **4** — clear match in abstract body
   - **3** — adjacent or implied
   - **2** — weak signal only
   - **1** — explicit mismatch / off-topic
   - **N/A** — criterion not assessable from T+A alone

2. Decision tree:
   - **All applicable criteria ≥4** → `include`
   - **Any applicable criterion ≤2** → `exclude` (record WHICH criterion failed)
   - **Mixed scores (some ≥4, some 3, none ≤2)** → `maybe` (queue for human full-text)
   - **Document type / language / year-range filter fails** → `exclude` (note the filter)

3. Reasoning summary (≤200 chars) — one sentence per decision. Examples:
   - include: "Sample = call-center workers (P✓); financial-stress survey (I✓); choice task DV (O✓); RCT (S✓)."
   - exclude: "Population = university students, not working adults (P=1). Off-scope."
   - maybe: "Sample is mixed working/unemployed (P=3); decision DV unclear from abstract (O=3). Need full-text."

### Step 5 — Emit three output files

**`screening-results.csv`** (first 5 rows shown — actual file has all N):

```csv
id,title,year,venue,decision,reasoning,criteria_version
S0001,"Financial stress and choice in call centers",2023,JOEM,include,"P=5 I=5 O=4 S=4 — empirical RCT on-scope",crit-v1-a8f2c3d1
S0002,"A bibliometric overview of financial wellbeing",2022,Sustainability,exclude,"S=1 — bibliometric, not empirical",crit-v1-a8f2c3d1
S0003,"Workplace stress: a narrative review",2024,JBE,maybe,"P=4 I=3 O=3 — narrative, may have synthesizable findings",crit-v1-a8f2c3d1
S0004,"Editorial: the future of behavioral finance",2025,JOFP,exclude,"Document type = editorial (filter)",crit-v1-a8f2c3d1
S0005,"Scarcity and cognitive load in low-income workers",2023,PNAS,include,"P=5 I=5 O=5 S=5 — directly on-scope",crit-v1-a8f2c3d1
```

**`screening-prisma-flow.md`** (PRISMA 2020 template):

```markdown
# PRISMA 2020 Flow Diagram — <topic> screening

## Identification
- Records identified via Scopus: <N1>
- Records identified via Web of Science: <N2>
- Records identified via EBSCO: <N3>
- Records identified via other (citation chasing, hand-search): <N4>
- **Total identified**: <sum>

## Deduplication
- Duplicates removed: <D>
- **Records screened (T+A)**: <N - D>

## Screening (Title + Abstract)
- Records excluded with reasons:
  - Off-population (P=1 or 2): <Ep>
  - Off-intervention/phenomenon (I=1 or 2): <Ei>
  - Off-outcome (O=1 or 2): <Eo>
  - Off-study-design (S=1 or 2): <Es>
  - Document-type filter (editorial, erratum, etc.): <Ed>
  - Language filter: <El>
  - Year-range filter: <Ey>
- **Records sent to full-text assessment**: include (<I>) + maybe (<M>) = <I+M>

## Eligibility (Full-text — NOT done by this skill)
- Full-text retrieved: <FT>
- Full-text unavailable: <FU>
- Excluded after full-text with reasons: <X>

## Inclusion
- **Studies included in synthesis**: <FINAL>

---

Criteria version: crit-v1-a8f2c3d1
Generated: 2026-05-19
AI assistance: title+abstract scoring supported by Claude Opus 4.x; all include/exclude decisions reviewed by the author. (See research-integrity.md)
```

**`screening-decisions-log.md`** (per-batch journal):

```markdown
# Screening Decisions Log

## Batch 1 — 2026-05-19 — crit-v1-a8f2c3d1

- N input: 217 (deduplicated)
- N scored: 198 (19 dropped to `maybe-missing-abstract`)
- Distribution: include 47 (24%), maybe 73 (37%), exclude 78 (39%)
- Top exclude reasons: off-population (28), off-study-design (24), document-type (16), off-outcome (10)
- Edge cases discussed:
  - S0089 "Burnout AND financial stress" — included despite O=3 because P+I are strong; full-text will confirm O.
  - S0142 "scarcity in supply chain" — excluded P=1 (firm-level scarcity, not individual).
- AI assistance: Claude Opus 4.x scored all 198 papers; human reviewed all `include` and all `maybe` rows. Excludes spot-checked at 10%.

## Batch 2 — <date> — crit-v<n>-<hash>

...
```

### Step 6 — N>200: recommend ASReview

If `N (scored) > 200`, append to the log:

```markdown
## Tooling recommendation

N=<N> exceeds 200. Recommend ASReview (active learning for screening) for the
`maybe` queue:

    pip install asreview
    asreview lab  # opens browser at http://localhost:5000

Load `screening-results.csv`. Mark first 10 `include` and 10 `exclude` as
training set. ASReview ranks the remaining `maybe` rows by relevance using
SBERT + naive Bayes; you stop when 5 consecutive items are excluded (typical
stopping rule).

Refs: van de Schoot et al. (2021) Nature Mach. Intell.
```

If `N > 500`, this recommendation becomes **mandatory** — LLM-alone screening at that scale is too noisy.

## Output format

See Step 5 above for the three files with actual row examples.

## Constraints

- **NEVER deletes any paper** from the input file. Exclusion is a label, not a deletion.
- **Decisions reproducible**: every row carries `criteria_version`. Re-running with same criteria + same papers must produce same decisions (modulo LLM nondeterminism — disclose in log).
- **All `maybe` require human full-text review** — never promotes `maybe` to `include` automatically.
- **For N > 500**: ALWAYS recommend ASReview as the primary tool; this skill becomes secondary (criteria-design + log-keeping).
- **AI use disclosure** in every PRISMA flow and log (per `research-integrity.md`).
- **Output language**: structure tags (column names, PRISMA boxes) in EN; reasoning summaries in `researcher.language` (default `pt-BR`).

## Anti-patterns

- ❌ Auto-excluding without explicit criteria. Criteria MUST exist (Step 2) before any decision.
- ❌ Batch-including >70% of records. If >70% pass, criteria are too loose — go back to Step 2.
- ❌ Skipping the decisions log. The log is the audit trail; without it, decisions are not reproducible.
- ❌ Marking `maybe` as `include` because "looks promising". `maybe` exists precisely for "promising but not confirmable from T+A".
- ❌ Re-screening with new criteria without bumping `criteria_version`. Always increment and document the change.
- ❌ Hiding the AI-assistance disclosure. AMJ/AMR/IJMR all require it (per `research-integrity.md`).

## PRISMA flow template

The template in Step 5 follows PRISMA 2020 (Page et al., BMJ 2021, DOI 10.1136/bmj.n71). For the diagrammed (boxes-and-arrows) version, use the `PRISMA2020` R package in Fase 5 of the project roadmap.

## Refs

- `citation-verify` — run on the final included set before drafting
- `slr-protocol` — the protocol document that defines this screening stage
- `.claude/rules/research-integrity.md` — AI-use disclosure requirement (Step 5 + decisions log)
- `.claude/rules/slr-disciplina-caldas.md` — Entrega 2 (2026-06-14) requires screening artifacts
- ASReview — van de Schoot et al. (2021) — recommended at N>200, required at N>500
