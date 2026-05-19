# phd-research-harness — Claude Code marketplace

A single-plugin marketplace bundling **phd-research**, a long-haul harness for PhD candidates and academic researchers who use Claude Code as a research partner across multi-year projects.

## Install

```bash
claude /plugin marketplace add arthur0211/phd-research-harness
claude /plugin install phd-research
```

Then in any project where you want the harness active:

```bash
cd ~/my-thesis-project
claude
> /phd-bootstrap
```

The bootstrap skill detects existing files (SOUL/CLAUDE/library.bib/sweep files) and asks for what's missing — no blind templates.

## What's inside

- **6 agents** — phd-orchestrator, literature-scout, slr-architect, gap-hunter, devils-advocate, thesis-committee
- **10 skills** — bootstrap, theme-refinement, methodology-advisor, review-type-chooser, citation-verify, screening-workflow, manual-search-protocol, slr-protocol, slr-entrega-1, research-instincts
- **4 hooks** — phase router (SessionStart), research-artifact verifier (PostToolUse), session capture (SessionEnd), block-main-push
- **3 commands** — `/phd-bootstrap`, `/phd-status`, `/phd-explore-theme`

See `plugins/phd-research/README.md` for full details.

## License

Apache 2.0 — see `LICENSE`.
