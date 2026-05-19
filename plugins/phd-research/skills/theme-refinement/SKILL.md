---
name: theme-refinement
description: Empirical compare-and-contrast of 2-5 candidate thesis themes BEFORE locking. Runs mini-sweeps via literature-scout, estimates paradigm-fit per variant, builds a comparison table with preliminary N, top 3 recent reviews and concept overlap. Use when researcher is in exploring phase with multiple theme variants in play. Triggers — explore theme, compare hypotheses, which theme, tema em mutação, narrow down topic, theme variants, compare themes, theme sweep, candidate hypotheses, refine topic.
---

# theme-refinement

## When to use

Invoke this skill when `STATE.md` shows `current_phase: exploring` AND the
researcher has 2-5 candidate theme variants under active consideration.
Symptoms in the user prompt: "should I go with X or Y", "I have three angles",
"compare these themes", "tema em mutação", "narrow down my topic", "ainda
indeciso entre".

DO NOT invoke if `current_phase` is `locking`, `reviewing`, or `submitting` —
at those stages the theme is travado and further sweeping wastes context.
Suggest `slr-protocol` or `phd-orchestrator` instead.

## Goal

Provide an **empirical compare-and-contrast** of candidate themes so the
researcher can lock with evidence, not vibes. Produce:

- A side-by-side table (variant × signal).
- One descriptive paragraph per variant explaining its sweet-spot literature.
- Two short flags (`saturation_risk`, `frontier_signal`) per variant.

**Critical**: this skill defaults to NOT picking a winner. Theme-lock is a
conscious decision by the researcher. However, when the researcher signals
they lack a local advisor (`researcher.advisor: TBD` in settings) OR explicitly
asks for a recommendation, the skill engages substantively in Step 8 — citing
empirical evidence from the sweep, naming a primary bet plus fallback, and a
concrete next step. This is opinion, not verdict; the researcher still decides.

## Workflow

### Step 1 — Discover variants

```
if exists tema-exploration/00-tema-atual.md:
    parse "## Variants" section (markdown bullets, one per line)
elif user provided list inline:
    accept as-is (validate 2 ≤ count ≤ 5)
else:
    ask user via AskUserQuestion or plain question:
      "Enumerate 2-5 candidate themes (one short noun-phrase each)."
```

Each variant should be a short noun-phrase (3-10 words). Reject inputs
longer than 15 words — those are research questions, not themes.

### Step 2 — Normalize and de-duplicate

Compute pairwise cosine similarity on lowercased tokens (drop stopwords).
If two variants score >0.85, merge into one and warn the user:
*"V2 and V4 are near-duplicates; merging."*

Output normalized variant list `V = [v1, v2, ...]`.

### Step 3 — Mini-sweep per variant via `literature-scout`

For each `vi` in `V`, invoke the `literature-scout` subagent with:

```
objetivo:        "preliminary sweep for variant {vi}"
escopo:          OpenAlex + Semantic Scholar
max_results:     10 per source (cap at 20 dedup)
date_range:      last 5 years
return_format:   JSON list [{doi, title, year, citations, concepts, venue}]
```

Aggregate results. If a variant returns N<5, flag as **`undersized`** — the
phrasing is too narrow or the literature too thin for an integrative review.

### Step 4 — Paradigm-fit estimate

For each variant's top 10 results, extract OpenAlex `concepts` field (level
0 + level 1). Count how many results have at least one concept in:

- **Management** (OpenAlex concept C144133560 + descendants)
- **Psychology** (C15744967 + descendants)
- **Economics** (C162324750 + descendants — adjacent, half-weight)

`paradigm_fit_pct = (mgmt_count + psy_count + 0.5*econ_count) / 10 * 100`

Flag `paradigm_drift` if pct < 50 — the variant is escaping the
behavioral-finance / management corner and may force an out-of-discipline
review.

### Step 5 — Concept overlap matrix

For each pair `(vi, vj)`, compute Jaccard overlap of the union of concepts
across their top 10. High overlap (>0.6) means the two variants would
return largely the same papers — useful signal that the researcher is
re-phrasing rather than truly considering distinct themes.

### Step 6 — Top 3 recent reviews per variant

Query OpenAlex (via `literature-scout`) with filter:
`type:review AND publication_year:>=2020 AND cited_by_count:>10`
sorted by `cited_by_count` desc. Take top 3 per variant.

If fewer than 3 reviews exist, flag `review_gap` — could be opportunity
(novel space) or risk (premature for review).

### Step 7 — Emit comparison artifact

Write `tema-exploration/01-variant-comparison.md` with the structure shown
in **Output format** (comparison table + decision-support matrix, no winner).

DO NOT modify `tema-exploration/00-tema-atual.md` — that file is the
researcher's. DO NOT touch anything outside `tema-exploration/`.

### Step 8 — Substantial recommendation (GATED)

Engage substantively if **any** of the following triggers is true:

1. `settings.local.json` `researcher.advisor` equals `"TBD"`, `""`, or missing
2. User prompt contains: `recommend`, `recomende`, `qual escolher`, `qual sugere`,
   `aposta`, `bet`, `which would you pick`, `me ajude a decidir`
3. `settings.local.json` `skill.theme-refinement.substantialRecommendation: true`

If gated ON:
- Append section `## Substantial recommendation (input — not a verdict)` to the
  comparison artifact (after the decision-support matrix, before methodological notes).
- Contents (mandatory):
  - **Primary bet**: `V[X]` — exact variant name
  - **3 empirical reasons** rooted in the sweep evidence. Each reason cites a
    specific signal (paradigm-fit %, frontier signal, saturation risk, a paper
    title+year+citations, a concept-overlap value). No abstract reasoning.
  - **Fallback variant**: `V[Y]` — and the *specific trigger* that would make
    you pivot (e.g., "if `gap-hunter` returns <2 Theory Application Voids in V[X],
    pivot to V[Y]")
  - **Concrete next step (NOT "discuss with advisor")**: a runnable action like
    "invoke `gap-hunter` on V[X]" or "run `methodology-advisor` with
    `researchQuestionType: mechanism-exploring`"
  - **Explicit framing line**: *"This is my read of the sweep. You decide. Each
    claim above is sourced to: [paper IDs / signal values]."*

If gated OFF: emit Step 7 artifact only and stop. Do not include Step 8 section.

The recommendation may **NOT** be generic (e.g., "V2 looks interesting"); it
**MUST** trace every claim to a specific data point in the sweep. A
recommendation without traceable sources is a violation of `citation-rigor.md`.

## Output format

```markdown
# Variant Comparison — generated YYYY-MM-DD

> Generated by `theme-refinement` skill. Skill does NOT recommend a winner.
> Researcher locks theme via conscious decision in `STATE.md`.

## Variants compared

| # | Variant | Source |
|---|---------|--------|
| V1 | <noun phrase> | user / tema-atual |
| V2 | ... | ... |

## Signal table

| Signal | V1 | V2 | V3 |
|--------|----|----|----|
| Preliminary N (dedup, 5y) | 142 | 38 | 211 |
| Paradigm-fit % (mgmt+psy+0.5econ) | 78% | 91% | 42% |
| Top recent review (DOI) | 10.x/... (2024, 87 cites) | ... | ... |
| 2nd recent review | ... | ... | ... |
| 3rd recent review | ... | ... | ... |
| Saturation risk | low | low | high (>200 hits) |
| Frontier signal | medium | high | low |
| Flags | — | `review_gap` | `paradigm_drift` |

## Concept overlap matrix (Jaccard of top 10 concepts)

|    | V1 | V2 | V3 |
|----|----|----|----|
| V1 | 1.0 | 0.31 | 0.18 |
| V2 |     | 1.0 | 0.09 |
| V3 |     |     | 1.0 |

## V1 — <short name>

One paragraph (4-6 sentences) describing the literature this variant
intersects. Mention 2-3 seminal authors (verified via Semantic Scholar /
OpenAlex), the dominant theoretical lens (e.g. *scarcity theory*,
*conservation of resources*), and the typical empirical setting (lab,
field, archival). End with: *"Sweet spot: <2-3 word characterization>."*

## V2 — <short name>

(same structure)

## V3 — <short name>

(same structure)

## Methodological notes

- Sweep date: YYYY-MM-DD
- Sources queried: OpenAlex + Semantic Scholar (no paywalled bases at this
  exploratory stage)
- DOI verification: all DOIs in this artifact match `^10\.\d{4,9}/`. Any
  paper without a verified DOI is marked `[DOI pending]`.

## Decision support — NOT a decision

| If researcher prioritizes... | Lean toward... |
|------------------------------|----------------|
| Mature evidence base + meta-analytic potential | variant with highest N + lowest review_gap |
| Theoretical contribution + frontier | variant with `review_gap` flag AND high paradigm_fit |
| Cross-domain bridging | variant with paradigm_drift IF deliberate |
| Time-to-publication | variant with existing recent reviews to slot into |

**Researcher decides. Update `STATE.md` `hipotese_ativa` field when locked.**
```

## Constraints

- **No file mutation outside `tema-exploration/`.** Hard constraint.
- **Theme recommendation is GATED, not banned.** Default is no recommendation
  (Step 7 artifact only). When Step 8 gating triggers, the skill MUST engage
  substantively (primary bet + 3 sourced reasons + fallback + concrete next
  step). The pre-v0.2 behavior of refusing to ever recommend even when the
  researcher explicitly asked was over-correction of the SOUL.md principle
  *"sparring acadêmico que tem opinião quando a evidência sustenta"*.
- **Citation rigor** (`.claude/rules/citation-rigor.md`): every DOI in the
  output must be verified via Semantic Scholar or OpenAlex round-trip. Any
  unverified paper is marked `[DOI pending]` and listed in a footnote.
- **Phase respect** (`.claude/rules/phase-gating.md`): refuse to run if
  `current_phase` ∉ `{exploring, refining}`. Suggest `slr-protocol` for
  locked phases.
- **Token budget**: cap total sweep at 50 papers (10 × 5 variants). Beyond
  that, ask user to narrow first.
- **Language**: artifact follows `researcher.language` from `settings.local.json`.

## Anti-patterns

- **Declaring a winner WITHOUT sourcing every claim.** *"V2 is the strongest"*
  by itself = violation. *"V2 is my bet because (a) paradigm-fit 70% vs V1's 50%,
  (b) Capponi 2024 + Halperin 2024 signal active frontier, (c) review_gap flag
  means contribution surface is wide"* = acceptable (Step 8 gated mode).
- **Recommending without gate.** If no Step 8 trigger fires, refuse the
  recommendation: *"I can recommend if you set `researcher.advisor: TBD` in
  settings or ask explicitly. Currently neither triggered."*
- **Generic recommendation.** *"V3 looks promising"* without citing concrete
  signals from the sweep = violation of `citation-rigor.md`.
- **Inventing concept categories.** Use OpenAlex's actual concept IDs;
  don't make up "behavioral economics" as a flat label.
- **Overwriting `tema-atual.md`.** That file is the researcher's
  workspace; the skill appends to a sibling, not the source.
- **Running on 1 variant.** If only one variant exists, this skill is the
  wrong tool — suggest `literature-scout` directly for deep sweep.
- **Running on 6+ variants.** Cognitive overload + token cost. Ask user
  to pre-prune to 5.
- **Skipping paradigm-fit when concepts unavailable.** If OpenAlex returns
  empty concepts (sometimes happens for very new papers), fall back to
  venue classification (journal subject areas).

## Refs

- `literature-scout` agent (Haiku, read-only multi-source sweep)
- `gap-hunter` agent (post-lock; classifies gaps in 6-type typology)
- `phd-orchestrator` agent (SessionStart router; reads `STATE.md`)
- `slr-architect` agent (post-lock; protocol design + WHY draft)
- `.claude/rules/citation-rigor.md` (DOI verification mandate)
- `.claude/rules/phase-gating.md` (exploring/refining gate)
- `.claude/rules/temporal-validity.md` (variant artifacts marked
  `valid_from:YYYY-MM-DD`)
