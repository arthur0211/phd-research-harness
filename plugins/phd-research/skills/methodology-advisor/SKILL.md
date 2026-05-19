---
name: methodology-advisor
description: Scaffolds method choice (RCT, quasi-experiment, regression, qualitative interpretivist, meta-analysis, mixed methods) by asking 4 structured questions, walking a decision tree, fetching 2-3 exemplar papers and emitting a methodology-decision.md template skeleton for the researcher to fill. Produces decision SUPPORT, not the decision itself. Use when designing the empirical chapters of the thesis. Triggers — methodology, qual or quant, qualitative or quantitative, which method, research design, method choice, mixed methods, RCT, regression design, escolha de método, desenho de pesquisa.
---

# methodology-advisor

## When to use

Invoke when the researcher is designing the empirical strategy for Paper #2
or Paper #3 (or any standalone empirical chapter) AND has not yet locked
the method. Symptoms in the prompt: "qual ou quant", "should I run an
RCT", "is regression enough", "mixed methods?", "preciso decidir o método",
"como vou medir isso", "what design fits my question".

DO NOT invoke for the literature review (Paper #1) — that uses
`review-type-chooser` instead.

DO NOT invoke if `methodology-decision.md` already exists for the active
artigo and `current_phase` is past `refining` — the decision is locked.

## Goal

Produce `methodology-decision.md` as a **template skeleton with prompts**,
not as a finished document. The researcher fills the skeleton in dialogue
with the real-world advisor. The skill's job is to:

1. Force the researcher to articulate 4 dimensions explicitly (RQ type,
   evidence access, methodological preference, sample ceiling).
2. Walk a transparent decision tree from those answers to 2-3 candidate
   methods.
3. Surface trade-offs (rigor / feasibility / cost / advisor-fit / TTP).
4. Anchor with 2-3 exemplar papers from `researcher.researchArea`.

The skill **never** outputs *"you should use X"*.

## Workflow

### Step 1 — Read context

Read `${CLAUDE_PROJECT_DIR}/.claude/settings.local.json`:
- `researcher.researchArea` — for exemplar paper retrieval.
- `methodology.preference` — qual / quant / mixed / open.
- `methodology.confidence` — low / medium / high.
- `methodology.openToMixed` — bool.
- `methodology.priorTrainingIn` — list of methods (e.g. `["regression",
  "qualitative coding"]`).

If `methodology.confidence` is low, bias the decision tree toward simpler
methods (regression > IV; thematic analysis > Gioia; descriptive >
inferential) AND flag training gaps explicitly.

### Step 2 — Interactive questions (4 mandatory)

Use AskUserQuestion when available. Otherwise plain numbered questions.

**Q1 — Research question type** (pick one):
- `descriptive` — "what is the state of X?"
- `causal` — "does X cause Y?"
- `mechanism-exploring` — "how / through what process does X relate to Y?"
- `effect-measuring` — "how large is the effect of X on Y across studies?"
- `meaning-making` — "what does X mean to participants?"

**Q2 — Evidence access**:
- `existing dataset` (specify source + N)
- `will collect primary quant` (specify feasibility horizon)
- `will collect primary qual` (specify access channel)
- `secondary qual documents` (archival, media, social)
- `mixed`

**Q3 — Advisor's methodological preference** (mirror or stretch):
- `qual` — supervisor leans interpretivist
- `quant` — supervisor leans positivist
- `mixed` — supervisor explicitly supports MM
- `open` — no strong preference signalled

**Q4 — Sample access ceiling** (realistic, not aspirational):
- `N<30`
- `N=30-200`
- `N>200`
- `N>1000`

Refuse to proceed if any answer is "I don't know" — escalate: *"Decide Q1
before continuing; the rest depends on it."*

### Step 3 — Decision tree walk

| Q1 | Q4 | Q2 | → Candidate method |
|----|----|----|--------------------|
| causal | N>200 | primary quant + random assignment feasible | **RCT** |
| causal | N>200 | observational + treatment-as-if-random | **Quasi-experiment / DiD / IV** |
| causal | N=30-200 | observational | **Regression with robustness checks** |
| causal | N<30 | any | **Process tracing / case study (Bennett & Checkel)** |
| mechanism-exploring | N<30 | primary qual | **Qualitative interpretivist (Gioia method)** |
| mechanism-exploring | N=30-200 | mixed | **Explanatory sequential mixed methods** |
| effect-measuring | any | meta-evidence available | **Meta-analysis (PRISMA-MA)** |
| meaning-making | any | primary qual | **Phenomenology / narrative inquiry / thematic analysis** |
| descriptive | any | existing dataset | **Descriptive statistics + bibliometric / exploratory factor** |
| descriptive | any | primary qual | **Ethnography / case study** |

For each `(Q1, Q4, Q2)` triple, output TOP 2 candidates (primary + fallback
if access changes).

Apply Q3 modifier:
- Q3=`qual` AND tree suggests RCT → ADD qualitative companion ("RCT +
  in-depth interviews with 10 participants").
- Q3=`quant` AND tree suggests Gioia → flag fit-risk and propose
  quantitatively-augmented variant (e.g., coded survey + regression).
- Q3=`mixed` AND `methodology.openToMixed=true` → primary candidate becomes
  explanatory sequential OR convergent parallel (Creswell & Plano Clark).

Apply confidence modifier:
- `methodology.confidence=low` → demote IV, structural equation, Bayesian
  hierarchical from candidates; promote OLS + diagnostics, thematic
  analysis, descriptive.

### Step 4 — Trade-off table

For top 2-3 candidates, score each on 5 dimensions (1-5 scale, document
the rationale in 1 line):

| Dimension | Definition |
|-----------|------------|
| **Rigor** | defensibility under hostile review |
| **Feasibility** | given access + time + skill |
| **Cost** | $ + person-hours |
| **Advisor-fit** | match with Q3 |
| **Time-to-publication** | from data to submission |

Output as a markdown table in the artifact.

### Step 5 — Exemplar papers

Query OpenAlex with:
```
filter: concept:{researcher.researchArea} AND
        cited_by_count:>20 AND
        publication_year:>=2018
sort: cited_by_count:desc
limit: 10 per method
```

For each top candidate method, pick the top 2-3 exemplars where the
**Methods** section actually uses that method. Verify by fetching abstract
+ Methods snippet via OpenAlex `abstract_inverted_index`.

If the method has zero exemplars in the researcher's area, flag
`exemplar_gap` — the method may be unconventional for the field.

### Step 6 — Emit template skeleton

Write `methodology-decision.md` with TODO prompts the researcher fills.
DO NOT pre-fill the researcher's final choice.

## Output format

```markdown
# Methodology Decision — <artigo slug>
<!-- decision valid_from:YYYY-MM-DD -->

> Generated by `methodology-advisor` skill. This is a TEMPLATE.
> Final method is YOUR decision (with your advisor).
> The skill scaffolds the conversation; it does not replace it.

## 1. Research question (Q1)

**Type chosen**: <descriptive | causal | mechanism-exploring | effect-measuring | meaning-making>

**Full RQ as stated**: TODO — write the RQ in one sentence.

**Sub-questions** (optional, max 3): TODO

## 2. Evidence access (Q2)

**Source**: <existing dataset | primary quant | primary qual | secondary qual | mixed>
**Specifics**: TODO — name dataset, sample channel, timeframe.

## 3. Advisor preference (Q3)

**Signaled**: <qual | quant | mixed | open>
**Conversation log**: TODO — link or paste advisor's last methodology comment.

## 4. Sample ceiling (Q4)

**Realistic ceiling**: <N range>
**Aspirational ceiling**: TODO
**What constrains it**: TODO — money, time, access, IRB, LGPD.

## 5. Candidate methods (skill output — researcher trims)

### Candidate A — <method name>

- **Why it fits**: <one-line tree justification>
- **Trade-offs**:

  | Dim | Score (1-5) | Note |
  |-----|-------------|------|
  | Rigor | 4 | ... |
  | Feasibility | 3 | requires access to ... |
  | Cost | 2 | $X for ... |
  | Advisor-fit | 4 | matches Q3=quant |
  | TTP | 3 | ~12 months ... |

- **Exemplars** (verified DOIs):
  1. Author et al. (YYYY). *Title*. Venue. DOI: 10.x/...
  2. ...

- **Risks**: TODO — what could derail this method?
- **Mitigation**: TODO

### Candidate B — <method name>

(same structure)

### Candidate C — <method name, optional>

(same structure)

## 6. Decision log (researcher fills)

- **Date considered**: YYYY-MM-DD
- **Advisor input**: TODO
- **Chosen method**: TODO (after conversation, not now)
- **Rejected because**: TODO
- **Pre-registration plan**: TODO (link to OSF when ready)

## 7. Training gaps

Methods I have NOT trained in but candidate requires:
- TODO

Plan to close:
- TODO (course, mentor, paper-walkthrough)

## 8. Ethical / LGPD notes

- IRB needed? TODO
- LGPD-sensitive variables? TODO
- Data anonymization plan? TODO

---

## Methodological notes (skill-generated)

- Exemplar search date: YYYY-MM-DD
- OpenAlex query used: `concept:... AND ...`
- Decision tree path: Q1=... Q2=... Q3=... Q4=... → A, B (modifier: ...)
- Flags raised: <list>
```

## Constraints

- **No final-method declaration.** The skill outputs candidates +
  trade-offs. The researcher's `methodology-decision.md` ends with
  TODO fields for the chosen method.
- **No RCT recommendation when N<30.** Hard rule. The decision tree
  blocks this branch automatically.
- **Honour confidence flag.** If `methodology.confidence=low`, the skill
  must demote methods requiring advanced training (IV, SEM, Bayesian
  hierarchical) and explicitly say so in the trade-off note.
- **Honour `openToMixed`.** If false, do not propose mixed methods as
  primary even when Q3=mixed.
- **Citation rigor**: exemplar DOIs verified via OpenAlex round-trip.
- **Language**: skeleton follows `researcher.language`.
- **Pre-registration**: for any candidate involving primary data, the
  skeleton MUST include the OSF pre-registration TODO (per
  `research-integrity.md`).

## Anti-patterns

- **"You should use RCT."** Never. Use *"Candidate A is RCT — trade-offs
  below."*
- **Skipping a question.** All four answers required. No defaults.
- **Recommending a method with zero exemplars in the researcher's area
  without flagging `exemplar_gap`.** Silently suggesting unconventional
  methods is a setup for desk-reject.
- **Pre-filling section 6 (Decision log).** That's the researcher's
  conversation with the advisor, not the skill's.
- **Ignoring training gaps.** If candidate requires a method the
  researcher hasn't trained in, section 7 is mandatory.
- **Recommending meta-analysis when meta-evidence doesn't exist.** Check
  that ≥10 effect-size-comparable primary studies exist before listing
  MA as a candidate.

## Refs

- `slr-architect` agent (for review-side methodology; this skill is for
  empirical-chapter methodology)
- `phd-orchestrator` agent (suggests this skill when `active_artigo ∈
  {2,3}` and `methodology-decision.md` missing)
- `.claude/rules/research-integrity.md` (pre-registration + AI disclosure)
- `.claude/rules/citation-rigor.md` (exemplar DOI verification)
- `.claude/rules/temporal-validity.md` (decision artifact dating)
- Creswell & Plano Clark (2018) on mixed methods typology
- Bennett & Checkel (2015) on process tracing
- Gioia et al. (2013) on qualitative rigor
- Higgins et al. (2019) Cochrane Handbook for meta-analysis
