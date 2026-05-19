---
description: Bootstrap a long-haul PhD research harness (SOUL/IDENTITY/CLAUDE/STATE/MEMORY/AGENTS + settings.local.json + rules). Auto-detects existing files.
---

Invoke the `phd-bootstrap` skill.

The skill detects existing files in this project (SOUL.md, IDENTITY.md,
CLAUDE.md, STATE.md, MEMORY.md, AGENTS.md, `.claude/settings.local.json`,
`.claude/rules/*.md`), asks questions only for missing data, and produces
the 6 Tier-1 root files plus `.claude/settings.local.json` and universal
rules under `.claude/rules/`.

It will not overwrite files that already exist without explicit user
confirmation. The bootstrap is idempotent — running it twice on a
fully-configured project should be a no-op aside from a status report.
