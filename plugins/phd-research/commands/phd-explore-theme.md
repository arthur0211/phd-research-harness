---
description: Compare 2-5 candidate research themes empirically via mini-sweeps. Outputs comparison table. Does not force decision.
---

Delegate to the `theme-refinement` skill.

The skill reads `${CLAUDE_PROJECT_DIR}/tema-exploration/00-tema-atual.md`
(if it exists) or asks the user to enumerate 2-5 variants, runs mini-sweeps
via the `literature-scout` agent in parallel, computes paradigm-fit and N
per variant, and outputs
`${CLAUDE_PROJECT_DIR}/tema-exploration/01-variant-comparison.md`.

The skill does NOT lock a decision — it surfaces evidence so the user can
choose consciously. Phase transition (`exploring` → `refining`) is the
user's call.
