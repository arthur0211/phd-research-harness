---
name: phd-doctor
description: Diagnostic health check for phd-research plugin installation. Audits Node version, Tier 1 file presence, settings.local.json validity, hook script syntax, plugin layout, and optional Zotero local API. Returns per-dimension checklist with [OK]/[FAIL] and a corrective hint for each FAIL. Use when bootstrap or any skill behaves unexpectedly, before reporting a bug, or as a first install sanity check. Triggers — phd-doctor, diagnostic, health check, audit installation, instalação saudável, plugin não funciona, skill quebrada, why is this failing.
---

# phd-doctor

Diagnostic self-serve. Surfaces install/configuration issues that would
otherwise manifest as cryptic skill failures. Read-only. Fast (≤5s).

## When to use

- First install: confirm everything is wired correctly
- Any skill in this plugin behaves unexpectedly (silent fail, empty output, error)
- Before opening a GitHub issue — paste the diagnostic output in the issue body
- After upgrading the plugin (e.g., v0.1.1 → v0.1.2) to confirm new pieces loaded

## Goal

A single-page checklist like:

```
phd-doctor — 2026-05-19T12:34:56Z

[OK]   Node version: v20.11.0 (≥18 required)
[OK]   Tier 1 files: SOUL.md IDENTITY.md CLAUDE.md STATE.md MEMORY.md AGENTS.md
[FAIL] settings.local.json: JSON parse error at line 7 column 12 (trailing comma)
       → hint: edit .claude/settings.local.json line 7; remove trailing comma after researcher.targetJournals array
[OK]   Plugin hooks (4): all pass node --check
[OK]   Plugin layout: skills/(11) agents/(6) hooks/(4+1) rules/(5) commands/(4)
[SKIP] Zotero local API: not in settings.connectors → no check

Summary: 4 OK, 1 FAIL, 1 SKIP. Fix the FAIL before running other skills.
```

## Workflow

### Step 1 — Resolve paths

- `PROJECT_ROOT` = `${CLAUDE_PROJECT_DIR}` if set, else `pwd`
- `PLUGIN_ROOT` = best-effort discovery: try in order
  1. `${CLAUDE_PLUGIN_ROOT}` if set
  2. `~/.claude/plugins/phd-research/` (canonical install path)
  3. `~/.claude/marketplaces/*/plugins/phd-research/` (marketplace install)
- If `PLUGIN_ROOT` not found, mark plugin-layout check as `[FAIL]` with hint
  *"plugin install path not detected — try /plugin install phd-research"* and
  continue with project-side checks only.

### Step 2 — Run checks (each independent, no early exit)

For each dimension, run a single Bash check. Capture exit code + stderr.

#### Check 1 — Node version (≥18)

```bash
node --version
```

PASS if output matches `v(1[89]|[2-9][0-9])\.`. Otherwise FAIL with hint:
*"Install Node ≥18. https://nodejs.org/download — current: <output>"*

#### Check 2 — Tier 1 files

```
ls PROJECT_ROOT/{SOUL,IDENTITY,CLAUDE,STATE,MEMORY,AGENTS}.md
```

PASS if all 6 exist. FAIL with hint:
*"Missing: <list>. Run /phd-bootstrap to generate."*

#### Check 3 — settings.local.json validity

If `PROJECT_ROOT/.claude/settings.local.json` exists:
```bash
node -e "JSON.parse(require('fs').readFileSync('.claude/settings.local.json','utf8'))"
```

PASS on exit 0. FAIL with hint *"JSON parse error: <stderr first line>. Open
the file and fix the syntax error."* If file does not exist, SKIP with hint
*"settings.local.json not found — run /phd-bootstrap to create."*

#### Check 4 — Plugin hooks syntax

For each `${PLUGIN_ROOT}/hooks/*.js`:
```bash
node --check <file>
```

PASS if all 4 hooks exit 0. FAIL with hint *"Hook X failed node --check.
Reinstall plugin via /plugin install phd-research."*

#### Check 5 — Plugin layout

Glob each expected directory under `${PLUGIN_ROOT}`:
- `skills/*/SKILL.md` — expected count ≥10 (v0.1.1) / ≥11 (v0.1.2+)
- `agents/*.md` — expected count 6
- `hooks/*.js` + `hooks.json` — expected 4 + 1
- `rules/*.md` — expected ≥5
- `commands/*.md` — expected ≥3 (v0.1.1) / ≥4 (v0.1.2+)

PASS if all counts at or above expected. FAIL with hint listing which directory
is short *"Expected ≥N in <dir>, found M. Plugin install may be incomplete."*

#### Check 6 — Zotero local API (optional)

If `settings.local.json` `connectors.reference-manager` contains `zotero`:
```bash
curl -s -o /dev/null -w "%{http_code}" -m 2 http://localhost:23119/api/users/0/items
```

PASS if HTTP 200. FAIL with hint *"Zotero not responding on port 23119. Open
Zotero Beta + enable Local API in Preferences → Advanced → Config Editor →
extensions.zotero.httpServer.enabled = true."*

If `zotero` not in connectors, SKIP silently.

### Step 3 — Render checklist

Output exactly the format shown in **Goal** above. One line per check.
Summary line at bottom: `Summary: N OK, M FAIL, K SKIP. <action>`

If any FAIL: end with *"Fix the FAIL items above before running other skills.
Re-run /phd-doctor after fixes to confirm."*

If all OK (excluding SKIPs): end with *"Plugin healthy. Run /phd-bootstrap to
initialize a new project, or /phd-status to see current phase."*

### Step 4 — Save log

Append the checklist (timestamped) to `${PROJECT_ROOT}/.claude/memory/doctor-log.md`
(create if missing). Truncate to last 20 runs.

This gives a history of install health that the user can reference when filing
GitHub issues or noting environmental changes.

## Constraints

- **Read-only.** No writes outside `.claude/memory/doctor-log.md`.
- **No prompts.** All checks run without user input.
- **No external network beyond localhost** unless explicitly configured (Zotero
  is the only exception, and only when user opted in via connectors).
- **Fast.** Total runtime ≤5s; each check ≤2s. If a check hangs, skip with
  `[FAIL] timeout — <hint>`.
- **Localization.** Output language follows `researcher.language` from
  settings.local.json (defaults to EN).

## Anti-patterns

- **Auto-fixing.** Doctor diagnoses only. Suggesting an action is fine;
  performing it is the user's call. If you want auto-fix, that is a separate
  command (`/phd-bootstrap` for missing Tier 1 files, etc.).
- **Verbose output.** Each check is one line plus optional one-line hint. No
  multi-paragraph explanations. Length matters when the user is debugging.
- **Hiding failures.** If a check cannot run (e.g., PLUGIN_ROOT not found),
  mark it FAIL with the reason. Never report OK by skipping.
- **Network checks without opt-in.** Zotero check requires explicit
  `connectors.reference-manager: ["zotero"]`. No surprise pings.

## Refs

- Pattern: cc-health-check 6-dimension layout
  (https://github.com/yurukusa/cc-health-check)
- `phd-bootstrap` — corrective action for missing Tier 1 files
- `scripts/validate-plugin.js` in the marketplace repo — similar checks for
  plugin authors; this skill is the user-facing complement
