---
name: review-type-chooser
description: Scaffolds choice of literature review type (systematic PRISMA, integrative Cronin & George, narrative, scoping, rapid, meta-analysis) by interviewing the researcher on field state, target evidence and constraints, walking a decision tree, fetching 2-3 exemplar reviews and emitting a review-type-justification.md template. Surfaces 2 viable options with trade-offs; does not decide unilaterally. Triggers — review type, systematic vs integrative, literature review type, which review method, Cronin George, PRISMA or not, scoping review, narrative review, tipo de revisão, qual revisão, meta-análise.
---

# review-type-chooser

## When to use

Invoke when the researcher needs a literature review (Paper #1 of the
thesis, or a standalone integrative chapter) AND has not yet locked the
review type. Symptoms in the prompt: "tipo de revisão", "PRISMA ou
integrativa", "systematic vs integrative", "preciso fazer uma revisão",
"scoping or narrative", "qual revisão devo fazer", "Cronin George ou
PRISMA".

DO NOT invoke for empirical chapters — that uses `methodology-advisor`.

DO NOT invoke if `review-type-justification.md` already exists and
`current_phase` is past `refining` — type is locked. The downstream skill
is `slr-protocol`.

## Goal

Produce `review-type-justification.md` as a **template skeleton** the
researcher fills in conversation with the advisor. The skill:

1. Forces explicit articulation of 3 dimensions (field state, target
   evidence, constraints).
2. Walks a transparent decision tree to 2 viable review types.
3. Surfaces the canonical trade-off (e.g. *"integrative is more flexible
   but harder to defend in PRISMA-trained committees"*).
4. Anchors with 2-3 exemplar published reviews in the researcher's
   `researchArea`.

The skill outputs a **recommendation between 2 viable options**; it does
not unilaterally pick one.

## Workflow

### Step 1 — Read context

From `${CLAUDE_PROJECT_DIR}/.claude/settings.local.json`:
- `researcher.researchArea` — for exemplar retrieval.
- `researcher.targetJournals` — drives expectations (some journals
  publish only systematic / meta-analytic reviews; others welcome
  integrative).
- `methodology.priorTrainingIn` — PRISMA-trained vs not.
- `connectors.openalex` — for sweep.

### Step 2 — Interactive questions (3 mandatory)

**Q1 — State of the field**:
- `consensus` — mature, accepted constructs, replicated effects
- `emerging` — recent literature, few syntheses yet
- `fragmented` — multiple sub-conversations not talking to each other
- `contested` — active disagreement on definitions or effects
- `mature` — well-established, large body, ripe for quantitative synthesis

**Q2 — Target evidence**:
- `quantitative effects` — effect sizes, correlations, treatment effects
- `theoretical frameworks` — concepts, propositions, models
- `research gaps` — what hasn't been studied
- `practice guidelines` — actionable for practitioners
- `definitional clarification` — what does X actually mean

**Q3 — Constraints**:
- **Time available**: <3 months | 3-6 months | 6-12 months | >12 months
- **Target journal expectation**: free-text (e.g. "AMJ expects
  systematic", "RAUSP accepts integrative", "IJMR explicitly invites
  integrative")
- **Methodological training**: PRISMA trained? meta-analytic trained?
  qualitative coding trained?

Refuse to proceed if Q1 or Q2 is unanswered. Q3 has defaults but flag if
training is absent.

### Step 3 — Decision tree walk

| Q1 | Q2 | Q3 modifier | → Candidate type |
|----|----|-------------|------------------|
| mature | quantitative effects | PRISMA training present | **Systematic Review (PRISMA 2020; Page et al. 2021)** |
| mature | quantitative effects | meta-analytic training + ≥10 comparable effect sizes | **Meta-analysis (PRISMA-MA; MOOSE for observational)** |
| fragmented / contested / emerging | theoretical frameworks | — | **Integrative Review (Cronin & George 2023; Torraco 2016; Whittemore & Knafl 2005)** |
| emerging | theoretical frameworks | — | **Narrative / Critical Review (Greenhalgh et al. 2018)** |
| fragmented | research gaps + practice guidelines | practitioner journal target | **Scoping Review (Arksey & O'Malley 2005; PRISMA-ScR; Peters et al. 2020)** |
| mature | practice guidelines + time<3mo | rapid review training | **Rapid Review (Cochrane RR methods; Tricco et al. 2017)** |
| any | definitional clarification | — | **Concept Analysis / Theoretical Review (Walker & Avant)** |

For each `(Q1, Q2)` pair, output TOP 2 candidates (primary + alternate).

Apply Q3 modifiers:
- **Target journal mismatch**: if researcher targets a journal that
  explicitly expects systematic but tree suggests integrative, flag
  `journal_fit_warning` and surface the trade-off explicitly.
- **No PRISMA training + tree suggests systematic**: demote systematic to
  alternate; promote integrative or scoping as primary.
- **Time <3mo + tree suggests systematic**: flag `time_risk` —
  PRISMA-compliant systematic typically needs 4-6 months.

### Step 4 — Trade-off contrast

For the top 2 candidates, build an explicit contrast table:

| Dimension | Type A | Type B |
|-----------|--------|--------|
| Reporting standard | PRISMA 2020 | Cronin & George 2023 framework |
| Search strategy | Exhaustive + reproducible | Purposive + iterative |
| Selection criteria | Strict, pre-registered | Flexible, justified |
| Synthesis | Narrative + tabular + (optional) statistical | Conceptual + integrative + framework-building |
| Defensibility under hostile review | High (transparent protocol) | Medium (depends on framework articulation) |
| Time to complete | 4-6 months minimum | 3-5 months |
| Training required | PRISMA + Covidence/Rayyan | Conceptual synthesis skill |
| Journal fit (target: ...) | High / Medium / Low | High / Medium / Low |

### Step 5 — Exemplar reviews

Query OpenAlex:
```
filter: type:review AND
        concept:{researcher.researchArea} AND
        cited_by_count:>20 AND
        publication_year:>=2018
sort: cited_by_count:desc
limit: 10 per type
```

For each top candidate, pick 2-3 exemplars whose Methods section actually
declares the type. Verify by inspecting abstract + Methods snippet.

If a candidate has zero recent exemplars in the researcher's area, flag
`exemplar_gap` — the type may be unconventional for the field (a real
signal worth surfacing, not a blocker).

### Step 6 — Emit template skeleton

Write `review-type-justification.md` (target ≤500 words of skeleton + TODO
prompts; the researcher's final version may exceed this).

## Output format

```markdown
# Review Type Justification — <slug>
<!-- decision valid_from:YYYY-MM-DD -->

> Generated by `review-type-chooser` skill. This is a TEMPLATE.
> Two viable options surfaced; researcher locks one with advisor.

## 1. Field state (Q1)

**Diagnosis**: <consensus | emerging | fragmented | contested | mature>

**Evidence for diagnosis** (3-5 bullets, with citations):
- TODO — recent review noting fragmentation: (Author YYYY)
- TODO
- TODO

## 2. Target evidence (Q2)

**What this review will deliver**: <quantitative effects | theoretical
frameworks | research gaps | practice guidelines | definitional
clarification>

**Why this matters for the thesis**: TODO — 2 sentences linking to
Paper #2 / #3 design.

## 3. Constraints (Q3)

- **Time available**: <range>
- **Target journal**: <name + expectation note>
- **Methodological training**: <PRISMA? meta? qualitative?>
- **Access**: <databases, language, paywall situation>

## 4. Candidate review types

### Candidate A — <type name> [PRIMARY]

- **Why it fits**: <one-line tree justification>
- **Canonical reference**: <full citation with DOI>
- **Reporting standard**: <PRISMA 2020 / Cronin & George 2023 / ...>
- **Exemplars in researchArea** (verified DOIs):
  1. Author et al. (YYYY). *Title*. Venue. DOI: 10.x/...
  2. Author et al. (YYYY). *Title*. Venue. DOI: 10.x/...
  3. (optional)
- **Risks**: TODO
- **Mitigation**: TODO

### Candidate B — <type name> [ALTERNATE]

(same structure)

## 5. Trade-off contrast

| Dimension | Candidate A | Candidate B |
|-----------|-------------|-------------|
| Reporting standard | ... | ... |
| Search strategy | ... | ... |
| Selection criteria | ... | ... |
| Synthesis approach | ... | ... |
| Defensibility | ... | ... |
| Time to complete | ... | ... |
| Training required | ... | ... |
| Journal fit | ... | ... |

**Headline trade-off (one sentence)**: TODO — e.g. *"A is more rigorous
but requires PRISMA training and 4-6 months; B is more flexible but
must articulate its protocol carefully to defend rigor."*

## 6. Recommendation (skill output — researcher confirms with advisor)

The skill leans toward **Candidate A** BECAUSE:
- TODO — fill from tree trace (e.g. *"Q1=fragmented + Q2=theoretical
  frameworks maps to integrative in the decision tree, AND
  `methodology.priorTrainingIn` does not include PRISMA"*).

The researcher should pick **Candidate B** IF:
- TODO — fill conditions (e.g. *"target journal switches to AMJ"*).

## 7. Decision log (researcher fills)

- **Date considered**: YYYY-MM-DD
- **Advisor input**: TODO
- **Locked type**: TODO (after conversation)
- **Reporting standard adopted**: TODO
- **Protocol next steps**: handoff to `slr-protocol` skill

## 8. Flags raised by the skill

- TODO — `journal_fit_warning` / `time_risk` / `exemplar_gap` / etc.

---

## Methodological notes (skill-generated)

- Exemplar search date: YYYY-MM-DD
- OpenAlex query: `type:review AND concept:... AND ...`
- Decision tree path: Q1=... Q2=... Q3=... → A (primary), B (alternate)
```

## Constraints

- **Surface 2 viable options**, never 1. The skill's value is the
  contrast. If only one type truly fits, say so AND still document the
  rejected alternate with the reason for rejection.
- **No PRISMA recommendation when consensus is shifting** (`Q1 ∈
  {contested, fragmented, emerging}`). Hard rule — PRISMA's strength
  assumes mature evidence base.
- **No integrative recommendation when field expects meta-analysis** AND
  ≥10 effect-size-comparable studies exist. Flag as `field_expectation_
  mismatch`.
- **No scoping recommendation when target evidence is quantitative
  effects.** Scoping maps, doesn't measure.
- **Citation rigor** (`.claude/rules/citation-rigor.md`): all DOIs
  verified via OpenAlex round-trip.
- **Honour `researcher.researchArea`** field conventions — e.g. nursing
  expects Whittemore & Knafl; management increasingly accepts Cronin &
  George + Torraco; medicine expects PRISMA strictly.
- **Language**: artifact follows `researcher.language`.

## Anti-patterns

- **Recommending PRISMA reflexively** because "it's the gold standard."
  PRISMA assumes mature evidence; misapplying it to fragmented fields
  forces premature closure.
- **Recommending integrative when field expects meta-analysis.**
  Reviewers in mature quantitative fields read integrative as "the
  authors couldn't do a proper meta-analysis."
- **Skipping the journal-fit dimension.** Target journal's editorial
  conventions can override the decision tree.
- **Pre-filling section 7 (Decision log).** That's the conversation with
  the advisor.
- **Hiding the headline trade-off.** Section 5 must contain a single
  sentence that names the trade-off bluntly.
- **Recommending rapid review without rapid review training.** The
  Cochrane RR methods are specific; without training, "rapid review"
  becomes a euphemism for "incomplete systematic."

## Refs

- `slr-architect` agent (post-lock; designs the full protocol from the
  chosen type)
- `slr-protocol` skill (next step after this skill — formalizes the
  protocol document)
- `citation-verify` skill (DOI verification utility)
- `.claude/rules/citation-rigor.md`
- `.claude/rules/research-integrity.md` (AI use disclosure in Methods)
- `.claude/rules/temporal-validity.md` (decision dating)
- Cronin & George (2023). The why and how of the integrative review.
  *Organizational Research Methods*. DOI: 10.1177/1094428120935507
- Page et al. (2021). The PRISMA 2020 statement. *BMJ*. DOI:
  10.1136/bmj.n71
- Torraco (2016). Writing integrative literature reviews. *HRD Review*.
- Whittemore & Knafl (2005). The integrative review: updated
  methodology. *J Adv Nurs*.
- Arksey & O'Malley (2005); Peters et al. (2020) on scoping reviews.
- Tricco et al. (2017) on rapid reviews.
- Greenhalgh, Thorne & Malterud (2018) on narrative reviews.
