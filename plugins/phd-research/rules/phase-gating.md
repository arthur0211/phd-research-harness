# Phase Gating — When NOT to invoke adversarial agents

## Principle

Adversarial validation kills variants while they are still forming.
`devils-advocate` and `thesis-committee` only act AFTER a decision has been
locked and is ready for review. Before that, they are counter-productive.

## Phases (canonical, live in `STATE.md` field `current_phase`)

| Phase        | Expected tone           | Adversarial OK?             |
|--------------|-------------------------|-----------------------------|
| `exploring`  | Curious, alternatives   | **NO**                      |
| `refining`   | Constructive            | **NO**                      |
| `locking`    | Rigorous (validation)   | Light only                  |
| `reviewing`  | Critical                | **YES** (`devils-advocate`) |
| `submitting` | Committee               | **YES** (`thesis-committee`)|

## Hard blocks

`devils-advocate` REFUSES to run if:
- `STATE.md` `current_phase` ∈ {`exploring`, `refining`}.
- No concrete artifact file is referenced in the prompt (needs an artifact
  to challenge, not an open-air idea).

`thesis-committee` REFUSES to run if:
- `STATE.md` `current_phase` ≠ `submitting`.
- The user has not explicitly confirmed the cost (3 Sonnet sub-agents in
  parallel).
- It was already invoked 6+ times in the current year (cost ceiling — check
  via session log).

## How to check phase from within an agent

Each gated agent opens by reading `STATE.md` and grepping `current_phase:`.
If the value is not in the whitelist for that phase, return with a friendly
refusal:

```
Gated. Current phase: {phase}. To invoke me, either:
  1. Move STATE.md current_phase to 'reviewing' (devils-advocate) or
     'submitting' (thesis-committee) — a conscious decision, not a slip.
  2. OR refine the artifact further until you have something concrete to
     challenge.
```

## Why not automate the phase transition

Phase transition is a conscious decision by the researcher (and the human
advisor). Automating it would risk pushing a raw artifact into adversarial
review — the exact opposite of the principle.

## Exceptions

- **Direct slash command** `/devils-advocate <file>` bypasses the phase check
  BECAUSE it is an explicit user invocation. The agent still requires a
  concrete `<file>`.
- **Invocation by another agent** (e.g. an `slr-architect` suggesting
  validation after a WHY draft): allowed only if `current_phase` is `locking`
  or higher.

## How to apply

- The `devils-advocate` agent prompt includes this rule by reference at the top.
- The `phd-orchestrator` agent (if installed) checks phase BEFORE suggesting
  an adversarial agent.
- The `harness-maintenance audit` skill scans session logs for adversarial
  invocations outside their phase whitelist and flags them.

## Refs

- `devils-advocate` agent (project-level)
- `thesis-committee` agent (project-level)
- `phd-orchestrator` agent (project-level)
- `STATE.md` field `current_phase`
