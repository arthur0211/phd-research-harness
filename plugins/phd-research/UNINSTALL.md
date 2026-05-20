# Uninstalling phd-research

Claude Code does not yet support `PreUninstall`/`PostUninstall` lifecycle hooks
([anthropics/claude-code#11240](https://github.com/anthropics/claude-code/issues/11240)),
so `claude /plugin uninstall phd-research` removes the plugin's source files
but leaves project-level artifacts that the plugin wrote into your project.

This page lists what stays, why, and how to remove it cleanly.

## What `/plugin uninstall` removes automatically

- Plugin source under `~/.claude/plugins/phd-research/` (or your marketplace
  install path)
- The plugin's entry in `~/.claude/settings.json` `enabledPlugins`

## What stays in your project (artifacts the plugin created)

If you ran `/phd-bootstrap` in a project, the following remain under
your project root (default: where you ran `claude`):

| Path | Reason it stays | Safe to remove? |
|------|-----------------|-----------------|
| `SOUL.md` | Your project's Claude identity (researcher-specific) | yes, if you don't plan to reinstall |
| `IDENTITY.md` | Your researcher profile | yes |
| `CLAUDE.md` | Project-level Claude instructions | yes — but check it doesn't include non-plugin content |
| `STATE.md` | Operational state (phase, milestone, blockers) | yes |
| `MEMORY.md` | Index of decisions/feedback/learnings | yes |
| `AGENTS.md` | Catalog of project-level agents | yes |
| `.claude/settings.local.json` | Researcher + connectors + behavior settings | yes |
| `.claude/rules/citation-rigor.md` | Universal research rule | yes |
| `.claude/rules/research-integrity.md` | Universal research rule | yes |
| `.claude/rules/phase-gating.md` | Universal research rule | yes |
| `.claude/rules/temporal-validity.md` | Universal research rule | yes |
| `.claude/rules/slr-disciplina-caldas.md` | FGV-specific rule (only if your `researcher.program` contains FGV) | yes |
| `.claude/memory/bootstrap-log.md` | Audit trail of bootstrap decisions | yes |
| `.claude/memory/doctor-log.md` | History of `/phd-doctor` runs | yes |
| `.claude/memory/sessions-log.jsonl` | Append-only session log (`session-end-capture` hook) | yes |
| `.claude/memory/feedback/INSTINCTS.jsonl` | Learned patterns (`research-instincts` skill) | **NO** — this is your work product |
| `.claude/memory/feedback/learnings-candidates.md` | Pending instinct candidates | **NO** — review before deleting |
| `.claude/memory/subconscious/<date>.md` | Per-day session observations | yes (but they may help diagnose past behavior) |
| `tema-exploration/*` | Theme refinement workspace (your research notes) | **NO** — this is your work product |
| `disciplina-caldas/*` | FGV-specific delivery folder structure | **NO** — this is your work product |
| `data/raw/` | Database exports from manual portal searches | **NO** — this is your data |
| `references/library.bib` | Your reference library | **NO** — this is your bibliography |

## Cleanup commands

### Conservative (recommended): remove only plugin-generated config, keep all work products

PowerShell (Windows):
```powershell
cd <your project root>

# Tier 1 hub files
Remove-Item -Force SOUL.md, IDENTITY.md, CLAUDE.md, STATE.md, MEMORY.md, AGENTS.md -ErrorAction SilentlyContinue

# Plugin settings + rules
Remove-Item -Recurse -Force .claude\settings.local.json, .claude\rules -ErrorAction SilentlyContinue

# Memory logs (but PRESERVE INSTINCTS + learnings-candidates + tema-exploration + disciplina-caldas + data + references)
Remove-Item -Force .claude\memory\bootstrap-log.md, .claude\memory\doctor-log.md, .claude\memory\sessions-log.jsonl -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .claude\memory\subconscious -ErrorAction SilentlyContinue

# Empty .claude/ if nothing else left
if ((Get-ChildItem .claude -Force -ErrorAction SilentlyContinue).Count -eq 0) { Remove-Item .claude }
```

Bash (macOS/Linux):
```bash
cd <your project root>

rm -f SOUL.md IDENTITY.md CLAUDE.md STATE.md MEMORY.md AGENTS.md
rm -f .claude/settings.local.json
rm -rf .claude/rules
rm -f .claude/memory/bootstrap-log.md .claude/memory/doctor-log.md .claude/memory/sessions-log.jsonl
rm -rf .claude/memory/subconscious

rmdir .claude/memory 2>/dev/null
rmdir .claude 2>/dev/null
```

### Nuclear (NOT recommended): also wipe work products

Only if you're sure you'll never come back to this project:

PowerShell:
```powershell
Remove-Item -Recurse -Force .claude, tema-exploration, disciplina-caldas, data\raw -ErrorAction SilentlyContinue
# references/library.bib stays — it's bibliography, not plugin output
```

## Re-installing later

If you uninstall and later want to reinstall:

1. `claude /plugin install phd-research`
2. `cd <project root>`
3. `claude > /phd-bootstrap`

If you kept the Tier 1 hub files (`SOUL.md` etc.), bootstrap will detect them
in Step 1 and ask before overwriting (idempotency contract, v0.1.2+). Just say
Skip for files you want preserved.

## Issue tracking

If `/plugin uninstall` ever DOES start removing plugin source automatically
(via PreUninstall hook landing in Claude Code), this page becomes obsolete.
Track [anthropics/claude-code#11240](https://github.com/anthropics/claude-code/issues/11240).
