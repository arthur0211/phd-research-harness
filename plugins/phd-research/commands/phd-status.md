---
description: Show the current PhD project phase, milestone countdown, and blockers (from STATE.md). Read-only.
allowed-tools: Read, Bash
---

Read `STATE.md` (in `${CLAUDE_PROJECT_DIR}`) and print a one-line banner:

📍 Phase: <phase> | Milestone: <date> (T-Nd) | Blockers: <count>

Then suggest one next action based on the current phase:

- `exploring` → run `/phd-explore-theme` to compare variants
- `refining` → invoke `theme-refinement` skill or move to `locking`
- `locking` → invoke `slr-protocol` (or a program-specific variant like `slr-entrega-1` if applicable) to draft artifacts
- `reviewing` → invoke `devils-advocate` agent on draft artifacts
- `submitting` → invoke `thesis-committee` agent (gated, requires confirmation)

Read-only — do NOT modify STATE.md.
