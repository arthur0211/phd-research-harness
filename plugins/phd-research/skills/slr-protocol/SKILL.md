---
name: slr-protocol
description: Generic literature review protocol skill. Tool-agnostic, program-agnostic. Produces 6 universal artifacts (why, theme, review-type, target-journal, boolean-string, bases, N-count) for any literature review delivery — integrative, systematic, scoping, narrative, or rapid. Default for any researcher; program-specific variants (e.g. slr-entrega-1) may override when triggered by their own description keywords. Triggers: "literature review", "review protocol", "SLR", "systematic review setup", "integrative review setup", "scoping review setup", "build review", "review delivery", "design review protocol", "PRISMA setup".
---

# slr-protocol

Generic, reusable literature-review delivery skill. Tool-agnostic. Works for any
program, any review type (integrative, systematic, scoping, narrative, rapid),
any discipline. Produces six mandatory artifacts in a delivery folder.

If your program has a more specific delivery skill (e.g. `slr-entrega-1` for the
FGV-EAESP DPA Caldas 2026 disciplina), use that — it inherits this protocol and
adds program-specific requirements. Otherwise, this skill is the default.

## When to use

- Researcher is preparing a literature-review deliverable for any program
  (Masters, PhD, postdoc, faculty review, journal submission)
- A protocol has not yet been written, or the previous protocol needs rebuild
- The 6 mandatory artifacts (WHY, theme, review type, target journal,
  boolean string, bases, N count) are missing or partial

Do NOT use this skill for:

- Screening already-extracted results (use `screening-workflow`)
- Verifying a single citation (use `citation-verify`)
- Comparing 2-5 candidate themes (use `theme-refinement` first, then this)
- Choosing a review type in isolation (use `review-type-chooser` first)
- Deliveries that have a dedicated program-specific skill (use that skill instead)

## Goal

Produce six mandatory artifacts in `deliveries/<delivery-name>/`:

| # | File | Content |
|---|------|---------|
| 1 | `why.md` | WHY ≤300 words — why this review, why now, who benefits |
| 2 | `tema.md` | Refined theme — boundaries, units of analysis, hypotheses |
| 3 | `tipo-revisao.md` | Review type + methodological justification |
| 4 | `periodico-alvo.md` | Target journal(s) ranked + submission format checked |
| 5 | `strings-busca.md` | Boolean string per cluster + operator justification |
| 6 | `bases.md` | Database protocol per accessible source (Scopus, WoS, etc.) |
| 7 | `n-contagem.md` | N per base + dedup total. Range check: 50 ≤ total ≤ 2000 |

(Yes — seven files. "Six mandatory artifacts" is the conceptual grouping;
`n-contagem.md` is the empirical receipt for `bases.md` + `strings-busca.md`.)

Each artifact is substantive (≥3 verified DOIs cited where applicable), has a
"Limitations + AI Use" footer per `research-integrity.md`, and never contains
fabricated references per `citation-rigor.md`.

## Inputs

- **Topic / hypothesis** — from user prompt, or from
  `tema-exploration/00-tema-atual.md` if already refined via `theme-refinement`
- **Active phase** from `STATE.md` — require `current_phase` in
  {`refining`, `locking`, `reviewing`}. Reject if `exploring` (run
  `theme-refinement` first) or `submitting` (use `devils-advocate` / `thesis-committee`).
- **Researcher settings** from `${CLAUDE_PROJECT_DIR}/.claude/settings.local.json`:
  - `researcher.program` — bibliographic context (drives PT-BR vs EN, format)
  - `researcher.language` — output language (default EN)
  - `researcher.targetJournals` — preferred journal list (drives Step 4)
- **Delivery name** — from user (`/<delivery-name>`) OR auto-generated
  `delivery-NN-YYYY-MM-DD/` where NN is next free integer

## Workflow

### Step 1 — Read context

Read in parallel:

- `${CLAUDE_PROJECT_DIR}/STATE.md` — extract `current_phase`, `next_milestone`,
  `hipotese_ativa`, `hipotese_fallback`
- `${CLAUDE_PROJECT_DIR}/MEMORY.md` — list of locked decisions to honor
- `${CLAUDE_PROJECT_DIR}/tema-exploration/00-tema-atual.md` (if exists) —
  refined theme statement
- `${CLAUDE_PROJECT_DIR}/.claude/settings.local.json` — researcher.* fields

If `current_phase` is not in the accepted set, return early with a friendly
redirect.

### Step 2 — Pre-flight: review type

If `<delivery-folder>/tipo-revisao.md` does NOT exist OR contains only a
placeholder, invoke the `review-type-chooser` skill first to produce a
methodological justification. The choice of review type drives Steps 3-7 (a
systematic review demands PRISMA flow; an integrative review allows broader
inclusion criteria; a scoping review prioritizes breadth).

### Step 3 — Literature sweep

Invoke `literature-scout` agent in parallel for each active hypothesis
(typically 1-3). Each scout returns ~20 candidate papers (title, authors, year,
venue, abstract, DOI, citation count, paradigm-fit indicator). Use the multi-
source pattern: OpenAlex (REST) + Semantic Scholar (MCP) + Scopus (manual via
portal, if researcher has access).

Save raw sweep outputs to `<delivery-folder>/sweeps/H<N>-<date>.md`.

### Step 4 — Gap classification

Invoke `gap-hunter` agent with the consolidated sweep output. Returns gaps
classified by the 6-type typology (Knowledge, Evidence, Methodological,
Population, Practical-Knowledge, Empirical). Save to
`<delivery-folder>/gaps/typology.md`.

### Step 5 — Consult instincts (optional)

If `${CLAUDE_PROJECT_DIR}/.claude/memory/feedback/INSTINCTS.jsonl` exists,
invoke `/instincts review` to surface learned patterns (e.g., "Variant E
ideal: 2 AND clusters + 1 OR modulator → N in 50-2000 range"). Apply only
patterns with `confidence ≥ 0.7` and `occurrences ≥ 3`.

### Step 6 — Protocol design

Invoke `slr-architect` agent with:

- Scout output (Step 3)
- Gap classification (Step 4)
- Instinct patterns (Step 5, if available)
- Review type justification (Step 2)
- Target journal preferences from settings

The architect drafts the WHY (≤300 words), refines the theme, designs the
boolean string per cluster, and ranks 2-3 candidate journals.

### Step 7 — Write 6 artifacts

Write each artifact to `deliveries/<delivery-name>/`:

- `why.md` (≤300 words, hard-counted)
- `tema.md`
- `tipo-revisao.md`
- `periodico-alvo.md` (with submission format: DOCX vs LaTeX vs Quarto)
- `strings-busca.md` (boolean string per cluster + AND/OR/NOT justification)
- `bases.md` (database protocol per accessible source)
- `n-contagem.md` (N per base + dedup total)

Each artifact cites ≥3 verified DOIs (use `citation-verify` skill for any
DOI not previously confirmed in this session). Each artifact ends with a
"Limitations + AI Use" footer:

```
---

## Limitations + AI Use

- Selection bias: <N> bases ≠ universe of literature
- Language bias: <languages> only
- Temporal bias: <year range>
- Access bias: open access vs paywalled
- AI use: Initial sweep supported by Claude (model: <model>); all inclusion
  decisions reviewed by the author. Boolean string designed by author with
  Claude assistance.
```

### Step 8 — Self-check

Before declaring complete, verify:

1. All 7 files exist and are non-empty (use Bash `ls -la deliveries/<name>/`)
2. No `[NOT VERIFIED]` / `[NÃO VERIFICADO]` markers without a footnote pointing
   to where verification is pending
3. WHY word count ≤300 (use Bash `wc -w deliveries/<name>/why.md`)
4. N range: 50 ≤ total dedup ≤ 2000. If outside:
   - **N < 50**: relax string (drop one AND cluster, broaden synonyms, extend
     year range)
   - **N > 2000**: tighten string (add AND cluster, restrict document types
     to article+review, narrow year range)
   - Iterate Step 3 → Step 7 until in range OR document why the field is
     genuinely small / vast and the deviation is justified
5. Each artifact has the "Limitations + AI Use" footer

### Step 9 — Report

Return to user a concise report:

```
✅ Delivery <name> assembled.

Files:
  why.md            (<N> words)
  tema.md           (<N> lines)
  tipo-revisao.md   (<review-type>)
  periodico-alvo.md (<journal-1>, <journal-2>)
  strings-busca.md  (<N> clusters)
  bases.md          (<N> bases)
  n-contagem.md     (Scopus=<n1>, WoS=<n2>, EBSCO=<n3>, dedup=<total>)

Open gating items:
  - <item 1>
  - <item 2>

Next: <suggested next action based on phase>
```

## Output template structure

Skeletal examples for each artifact (fill in with empirical content from
Steps 3-6 — do NOT submit these skeletons literally):

### `why.md` skeleton

```markdown
# WHY — <Review topic>

## Phenomenon
<1-2 sentences naming the phenomenon and why it matters now>

## Theoretical anchor
<1-2 sentences citing the dominant theoretical lens>

## Empirical gap
<1-2 sentences naming the gap that prior reviews left open>

## Practical relevance
<1-2 sentences on who benefits from this review (practitioners, policy, etc.)>

## Contribution
<1-2 sentences stating what THIS review will deliver that prior reviews did not>

---
## Limitations + AI Use
<per template above>
```

Hard cap: 300 words.

### `tema.md` skeleton

```markdown
# Refined theme

## Conceptual boundaries
- Included: <list>
- Excluded: <list>

## Units of analysis
<individual / team / firm / industry / country>

## Hypotheses (if confirmatory) OR research questions (if exploratory)
H1: <statement>
H2: <statement>
(or RQ1, RQ2)

## Year range
<YYYY>–<YYYY>, justified by <event/policy/landmark publication>

## Language
<EN only / EN+PT / EN+ES+PT / etc.>

---
## Limitations + AI Use
```

### `tipo-revisao.md` skeleton

```markdown
# Review type

## Selected type
<Integrative / Systematic / Scoping / Narrative / Rapid / Umbrella>

## Methodological justification
<2-3 paragraphs citing the canonical reference for this review type>

## Why NOT the alternatives
- Why not systematic: <reason>
- Why not scoping: <reason>
(etc.)

## Canonical references followed
- <Reference 1>
- <Reference 2>

---
## Limitations + AI Use
```

### `periodico-alvo.md` skeleton

```markdown
# Target journal(s)

## Ranked candidates

### 1. <Journal name> (safe choice)
- Impact factor: <X>
- Acceptance rate: <Y%>
- Submission format: <DOCX / LaTeX / Quarto>
- Word limit: <N>
- Fit rationale: <why this review fits this journal>

### 2. <Journal name> (ambitious choice)
<same fields>

## Submission format check
- Template downloaded: <path or URL>
- Citation style: <APA 7 / AMA / Vancouver / Harvard>
- Decision: <which format to draft in>

---
## Limitations + AI Use
```

### `strings-busca.md` skeleton

```markdown
# Boolean search string

## Cluster 1 — <concept name>
Synonyms: <list>
String: ("term1" OR "term2" OR "term3")

## Cluster 2 — <concept name>
Synonyms: <list>
String: ("term1" OR "term2" OR "term3")

## Cluster N — <concept name>

## Final string (per base, syntax-adapted)
- Scopus: TITLE-ABS-KEY(<full string>)
- WoS:    TS=(<full string>)
- EBSCO:  TI <full string> OR AB <full string>

## Operator justification
- AND between clusters because <reason>
- OR within cluster because <reason>
- NOT for <exclusion clusters> because <reason>

---
## Limitations + AI Use
```

### `bases.md` skeleton

```markdown
# Database protocol

## Accessible bases
- Scopus — via <API / portal CAFe / institutional>
- Web of Science — via <route>
- EBSCO — via <route>

## Per-base protocol
### Scopus
- Field tags: TITLE-ABS-KEY
- Document types: ar, re
- Year range: <YYYY>–<YYYY>
- Language: <EN, PT>
- Export format: RIS

(repeat for WoS, EBSCO)

## Dedup tool
<Zotero / Rayyan / ASReview / manual>

---
## Limitations + AI Use
```

### `n-contagem.md` skeleton

```markdown
# N count per base

| Base | Date queried | N raw | Notes |
|------|-------------|-------|-------|
| Scopus | YYYY-MM-DD | <N> | <route> |
| WoS    | YYYY-MM-DD | <N> | <route> |
| EBSCO  | YYYY-MM-DD | <N> | <route> |

**Total raw**: <sum>
**After dedup**: <N>

## Range check
50 ≤ <N> ≤ 2000 → ✅ in range / ⚠️ outside range

## If outside range
<iteration notes; link to previous string versions>

---
## Limitations + AI Use
```

## Boolean string starter (parameterized)

Generic skeleton — replace `<cluster-N synonyms>` with concrete synonyms for
your topic:

```
(<concept-cluster-1 synonyms separated by OR>)
AND (<concept-cluster-2 synonyms separated by OR>)
AND (<concept-cluster-3 synonyms separated by OR>)
AND NOT (<exclusion-cluster synonyms separated by OR>)
```

Rules of thumb (high-confidence instincts, generic):

- 2-3 AND clusters is the sweet spot. 1 AND cluster → too broad. 4+ AND clusters
  → over-restricted, N often < 30.
- Each cluster has 3-8 OR synonyms. Fewer → miss papers. More → noise.
- Use exact-phrase quotes for multi-word concepts ("decision-making", not
  decision AND making).
- NOT clauses only for clearly off-topic clusters (clinical conditions,
  unrelated industries). Use sparingly — they cut more than expected.

## Constraints

- **Citation rigor**: never fabricate citations, DOIs, years, or authors
  (`citation-rigor.md`). Mark `[NOT VERIFIED]` and footnote if uncertain.
- **AI use disclosure**: every artifact has the "Limitations + AI Use" footer
  (`research-integrity.md`). Non-negotiable for AMJ, AMR, IJMR, and most top
  management journals (2024–2026 policy).
- **Output language**: follows `researcher.language` in settings.local.json
  (default EN). For Lusophone programs, write artifacts in PT-BR.
- **Delivery folder name**: from user OR auto-generated
  `delivery-NN-YYYY-MM-DD/` where NN is the next free integer.
- **Phase gate**: respect `current_phase` from STATE.md. This skill writes
  durable artifacts — do not run during `exploring` (theme not locked).
- **No fabricated N**: if `n-contagem.md` cannot be filled with empirical
  query results, mark the cell `[PENDING — credentials/access blocker]` and
  flag in Step 9 report. Never write a guessed N.

## Anti-patterns

- ❌ Writing `why.md` before running the sweep (Step 3). The WHY is
  evidence-backed, not guessed.
- ❌ Skipping the `review-type-chooser` pre-flight (Step 2). Choosing review
  type retroactively to fit a string is post-hoc justification.
- ❌ Ignoring the N range (Step 8.4). N < 50 or N > 2000 nearly always means
  the string is mis-calibrated, not that the field is genuinely tiny/vast.
  Iterate before submitting.
- ❌ Writing `bases.md` for bases the researcher cannot actually access. If
  no Scopus credentials, do not list Scopus — list the bases empirically
  reachable and flag missing-access as gating items.
- ❌ Auto-promoting `current_phase` to `reviewing` after this skill. Phase
  transitions are conscious user decisions (per `phase-gating.md`).
- ❌ Submitting all 7 files with `[PENDING]` markers — that means the skill
  did not complete. Iterate or escalate to the user.

## Refs

- Agents: `slr-architect`, `literature-scout`, `gap-hunter`
- Skills: `review-type-chooser`, `citation-verify`, `screening-workflow`,
  `manual-search-protocol`, `theme-refinement`, `research-instincts`
- Rules: `citation-rigor.md`, `research-integrity.md`, `phase-gating.md`,
  `temporal-validity.md`
- Sibling FGV-specific skill: `slr-entrega-1`
