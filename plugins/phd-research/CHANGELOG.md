# Changelog — phd-research plugin

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
