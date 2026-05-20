# Changelog — phd-research plugin

## [0.1.2] — 2026-05-19

> **Release theme**: Paula's first install survives. Single-concern release —
> two changes that prevent the most common first-install failure modes.

### Added
- **`/phd-doctor` command + skill** (#6): self-serve diagnostic that audits
  Node version, Tier 1 file presence, settings.local.json validity, hook
  script syntax, plugin layout, and optional Zotero local API. Outputs
  per-dimension `[OK]`/`[FAIL]` checklist with corrective hint per FAIL.
  Read-only. Fast (≤5s). Persists log at `.claude/memory/doctor-log.md`.

### Fixed
- **phd-bootstrap idempotency** (#7): pre-write existence check on each Tier 1
  file. If file exists, asks user via AskUserQuestion (Skip / Overwrite /
  Show diff first), default Skip. Prevents silent data loss when user
  CTRL-Cs mid-flow and re-runs `/phd-bootstrap`. Applies to all 6 Tier 1
  files + `.claude/settings.local.json` + each rule file. Decisions logged
  to `.claude/memory/bootstrap-log.md` with sha256 fingerprint for audit.

## [0.1.1] — 2026-05-19

### Fixed
- **literature-scout silent failure** (#1): agent now FAILS LOUD if zero
  successful API fetches occur — returns explicit error block instead of
  empty "Done". Prevents downstream skills (e.g. `theme-refinement`) from
  building thin comparison tables without warning.
- **literature-scout Semantic Scholar 429** (#3): S2 calls now sequential
  (not parallel) with 1s sleep between requests; `mailto=` polite-pool
  parameter applied from `researcher.contactEmail` if set; optional
  `S2_API_KEY` env var documented for users needing throughput.

### Documentation
- **literature-scout OpenAlex query patterns** (#2): added "Query patterns"
  section with 5 rules learned in production —
  use `filter=title_and_abstract.search:...` (not loose `search=`),
  `sort=relevance_score:desc` (not `cited_by_count:desc`), `concepts.id`
  domain filter with cheat-sheet for 10 research areas, `from_publication_date`
  filter, `mailto=` polite-pool.

## [0.1.0] — 2026-05-19

### Added
- 6 agents: `phd-orchestrator`, `literature-scout`, `slr-architect`, `gap-hunter`, `devils-advocate`, `thesis-committee`
- 10 skills:
  - `phd-bootstrap` — interactive setup (detects existing files, never blind templates)
  - `theme-refinement` — for `exploring` phase with theme variants
  - `methodology-advisor` — qual / quant / mixed decision support
  - `review-type-chooser` — systematic / integrative / narrative trade-off framework
  - `citation-verify` — active OpenAlex + Crossref lookup before citing
  - `screening-workflow` — PRISMA title/abstract for N>50
  - `manual-search-protocol` — institutional portals (CAFe/CAPES/OpenAthens) step-by-step
  - `slr-protocol` — generic literature review protocol (6 universal artifacts)
  - `slr-entrega-1` — FGV-EAESP DPA Caldas 2026 specific (gated via description)
  - `research-instincts` — append-only pattern capture with confidence scoring
- 4 hooks:
  - `phd-orchestrator-router` (SessionStart) — phase-aware routing banner
  - `verify-research-artifact` (PostToolUse) — validates academic artifacts
  - `session-end-capture` (SessionEnd) — extracts learnings candidates
  - `block-main-push` (PreToolUse) — safety for `git push` to main/master
- 3 commands: `/phd-bootstrap`, `/phd-status`, `/phd-explore-theme`
- `CONNECTORS.md` — tool-agnostic categories (literature-db, screening-tool, RAG, reference-manager, manual-portal)
- `settings.local.json` schema for per-project personalization
