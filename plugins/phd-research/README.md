# phd-research

Long-haul PhD research harness for Claude Code — phase-aware agents, literature
review workflows (systematic / integrative / narrative / scoping / meta-analysis
/ rapid), gap typology, adversarial review, instinct capture, file-based memory.
Tool-agnostic via [CONNECTORS](./CONNECTORS.md).

## Installation

```bash
# 1. Add the marketplace
claude /plugin marketplace add arthuramorim/phd-research-harness

# 2. Install the plugin
claude /plugin install phd-research

# 3. In any project where you want the harness active
cd ~/my-thesis-project
claude
> /phd-bootstrap
```

The `phd-bootstrap` skill detects existing files (SOUL.md, library.bib,
`tema-exploration/`, etc.), asks for what's missing, and never overwrites
silently. No blind templates.

## What it does

Three things you cannot easily get from default Claude Code:

1. **Phase-aware routing** — research projects move through `exploring → refining
   → locking → reviewing → submitting`. Some agents (adversarial, committee) are
   actively harmful in early phases. The harness reads `STATE.md` and gates
   accordingly.
2. **Gap analysis** — `gap-hunter` classifies your sweep against the Müller-Bloch
   & Kranz (2015) 6-type typology (Contradictory Evidence, Knowledge Void,
   Action-Knowledge Conflict, Methodological Gap, Evaluation Void, Theory
   Application Void). You get a defensible WHY frame, not a vague "this field
   has gaps".
3. **Adversarial review** — `devils-advocate` scores 5 dimensions (empirical
   evidence, theoretical anchoring, operational feasibility, target-venue fit,
   integrity) with concession threshold. `thesis-committee` runs 3 independent
   personas (advisor-fit / methodologist / skeptical-reviewer) with no shared
   context to avoid bias.

## Commands

| Command | Purpose | Allowed tools |
|---|---|---|
| `/phd-bootstrap` | Set up the harness in a fresh project (or refresh missing pieces) | full |
| `/phd-status` | Read-only banner: current phase, milestone countdown, blockers | Read, Bash |
| `/phd-explore-theme` | Compare 2-5 candidate themes empirically; outputs comparison table | full |

## Skills

| Skill | When it fires (description-triggered) |
|---|---|
| `phd-bootstrap` | "bootstrap", "setup", "init harness", new project |
| `theme-refinement` | "compare hypotheses", "which theme", phase=exploring with multiple variants |
| `methodology-advisor` | "qual or quant", "which method", "mixed methods" |
| `review-type-chooser` | "systematic vs integrative", "Cronin George", "PRISMA or not" |
| `citation-verify` | "verify citation", "is this paper real", "DOI lookup" |
| `screening-workflow` | "screen papers", "100 papers triage", "PRISMA T/A" |
| `manual-search-protocol` | "EBSCO protocol", "CAFe portal", "institutional login" |
| `slr-protocol` | "literature review", "review protocol", generic SLR |
| `slr-entrega-1` | FGV-EAESP DPA Caldas 2026 specific (auto-routes to `slr-protocol` if not FGV) |
| `research-instincts` | "learn this pattern", "remember this", after recurring corrections |

## Agents

| Agent | Model | When | Gated? |
|---|---|---|---|
| `phd-orchestrator` | Haiku | SessionStart router; phase + milestone banner | no |
| `literature-scout` | Haiku | Multi-source sweep (OpenAlex + Semantic Scholar + Scopus if creds) | no |
| `slr-architect` | Inherit | Protocol design + WHY draft + boolean string | no |
| `gap-hunter` | Inherit | 6-type gap classification post-sweep | no |
| `devils-advocate` | Sonnet | Adversarial review — 5-dim scoring with concession threshold | **yes** (phase ≥ reviewing) |
| `thesis-committee` | Sonnet | Pre-submission gate — 3 independent personas | **yes** (phase = submitting; cost-confirmed; ≤6/year) |

## Hooks

| Event | Hook | Purpose |
|---|---|---|
| `SessionStart` | `phd-orchestrator-router.js session-start` | Emit phase banner |
| `UserPromptSubmit` | `phd-orchestrator-router.js prompt-submit` | Detect keywords; suggest agent (respects gating) |
| `PreToolUse` (Bash) | `block-main-push.js` | Block `git push ... main`/`master`; configurable |
| `PostToolUse` (Write\|Edit) | `verify-research-artifact.js` | WHY word count, DOI format, [NOT VERIFIED] markers, AI disclosure, temporal validity expiry |
| `SessionEnd` | `session-end-capture.js` | Append session log + learnings candidates + subconscious observations |

All hooks fail-open. All read `process.env.CLAUDE_PROJECT_DIR` (not hardcoded).
All can be disabled per-project via `settings.local.json`.

## Example workflows

### A. Starting an SLR from scratch

```
> /phd-bootstrap                   # creates SOUL/CLAUDE/STATE/MEMORY/settings.local.json
> "I'm in exploring phase, comparing 4 themes about financial stress"
> /phd-explore-theme               # mini-sweeps each variant; comparison table
> "lock the workplace-WB variant"  # manually update STATE.md current_phase: locking
> Use the slr-protocol skill       # 6 artifacts; sweep → gap-hunter → architect
> Use the citation-verify skill on this draft  # active lookup before commit
```

### B. Refining an existing review

```
> /phd-status                                       # phase banner; blockers
> Use the review-type-chooser skill                 # if undecided
> Use the methodology-advisor skill                 # if shifting design
> "move to reviewing phase"                          # update STATE.md
> /devils-advocate disciplina-caldas/.../why.md     # 5-dim adversarial
```

### C. Pre-defense / pre-submission

```
> /phd-status                                       # confirm phase=submitting
> Use thesis-committee on manuscript.md (confirm cost 3 Sonnets)
> # 3 independent personas; synthesized verdict
```

## CONNECTORS — tool-agnostic categories

See [CONNECTORS.md](./CONNECTORS.md) for the full table. Short version:

```json
{
  "connectors": {
    "literature-database": ["openalex", "semantic-scholar"],
    "screening-tool": ["asreview"],
    "rag-engine": ["paperqa2"],
    "reference-manager": ["zotero"],
    "manual-portal": ["cafe-capes"]
  }
}
```

Swap any value; skills keep working. The plugin never hardcodes Scopus / Elicit
/ Mendeley.

## Standalone vs. supercharged

| Capability | Standalone (plugin alone) | Supercharged (plugin + integrations) |
|---|---|---|
| Literature sweep | OpenAlex, Crossref, Semantic Scholar via WebFetch | + Scopus API + WoS API (env keys) |
| Reference management | manual BibTeX | + Zotero MCP (local API) |
| Screening at scale | LLM-based, up to N=200 | + ASReview (Python; active learning) |
| RAG over PDFs | manual `Read` | + PaperQA2 (local, free) |
| Institutional bases | not possible from agent | + human-in-loop via `manual-search-protocol` |

The plugin is **fully functional standalone** for any researcher with internet
access. Integrations only deepen specific workflows.

## Settings (`settings.local.json`)

Bootstrap creates this in `<project>/.claude/settings.local.json`. Edit at any
time. Multi-project: each project has its own.

```json
{
  "researcher": {
    "name": "Your Name",
    "program": "Your Program / Institution",
    "advisor": "Your Advisor",
    "language": "EN",
    "thesisFormat": "3-papers",
    "researchArea": "Your Research Area",
    "targetJournals": ["Journal 1", "Journal 2"]
  },
  "methodology": {
    "preference": "quantitative",
    "confidence": "medium",
    "openToMixed": true
  },
  "connectors": {
    "literature-database": ["openalex", "semantic-scholar"],
    "screening-tool": ["asreview"],
    "rag-engine": ["paperqa2"],
    "reference-manager": ["zotero"],
    "manual-portal": ["cafe-capes"]
  },
  "settings": {
    "deepResearchModel": "sonnet",
    "blockMainPush": true,
    "sessionCaptureEnabled": true,
    "artifactPaths": ["/deliveries/", "/paper1/", "/manuscript/"]
  }
}
```

Skills read this via `${CLAUDE_PROJECT_DIR}/.claude/settings.local.json`. Hooks
read this too — `blockMainPush:false` disables the push guard; `artifactPaths`
overrides the default artifact-detection regex in
`verify-research-artifact.js`.

## How we prevent hallucination

Research integrity is the headline concern of any PhD researcher who has been
burned by a fabricated citation. This plugin enforces multiple layers:

- **`citation-rigor.md` rule** — every claim with factual look must come with
  (Author, Year) + verifiable DOI; never remove `[NOT VERIFIED]` markers without
  source confirmation
- **`citation-verify` skill** — ACTIVE lookup via OpenAlex + Crossref +
  Semantic Scholar (≥2 sources must agree on DOI for ✅ verified status)
- **`verify-research-artifact.js` hook** — runs on every Write/Edit of a research
  artifact; flags malformed DOIs, missing AI disclosure, expired temporal markers
- **`devils-advocate` agent** — scores empirical evidence as one of 5 dimensions
- **`research-integrity.md` rule** — requires AI use declaration in Methods
  section per AMJ/AMR/IJMR 2024-2026 policy

LLMs generate text. This plugin makes the generation **verifiable** before it
enters durable artifacts.

## File structure

```
phd-research/
├── .claude-plugin/plugin.json
├── README.md
├── CHANGELOG.md
├── LICENSE
├── CONNECTORS.md
├── agents/         (6 .md files)
├── hooks/          (4 .js + hooks.json)
├── skills/         (10 SKILL.md, one per subfolder)
├── rules/          (5 .md — 4 universal + 1 FGV-only)
└── commands/       (3 .md slash-command templates)
```

## License

Apache 2.0 — see [LICENSE](./LICENSE).

## Contributing

PRs welcome. Conventions:
- Skills are Markdown only — frontmatter is strictly `name:` + `description:`
- Agents may declare `model:` and `tools:`
- Hooks must `process.env.CLAUDE_PROJECT_DIR` (never `__dirname` traversal)
- All claims that look factual must come with DOI per `citation-rigor.md`
