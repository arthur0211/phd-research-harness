# Temporal Validity Convention

## Principle

A multi-year project accumulates decisions. Without explicit temporal markers,
silent contradictions grow. Every decision or fact in memory files MUST carry
`valid_from`. Decisions with a deadline OR a successor MUST also carry
`valid_until` OR `supersedes`.

## Syntax (markdown HTML comment, trivial to parse)

```markdown
<!-- fact valid_from:YYYY-MM-DD -->
- Fact in force

<!-- fact valid_from:YYYY-MM-DD valid_until:YYYY-MM-DD -->
- Fact with deadline (review after valid_until)

<!-- fact valid_from:YYYY-MM-DD supersedes:slug-of-previous-decision -->
- Fact that supersedes another (keep both visible; mark previous as superseded)
```

Accepted variants of the leading keyword:

- `<!-- decision valid_from:... -->`
- `<!-- soul valid_from:... -->`
- `<!-- identity valid_from:... -->`
- `<!-- agents valid_from:... -->`
- `<!-- decisions valid_from:... -->`
- `<!-- state valid_from:... -->`
- `<!-- claudeMd valid_from:... -->`
- `<!-- bootstrap valid_from:... -->`

## Where to use

- `SOUL.md`, `IDENTITY.md`, `MEMORY.md`, `STATE.md`, `AGENTS.md` — block at
  the footer of the file.
- Every file in `.claude/memory/decisions/` — block at the top, before the
  body.
- Every file in `.claude/memory/feedback/` — block at the top.
- Optionally in `CLAUDE.md` sections that change frequently (schedule,
  pending action items).

## Audit

The `harness-maintenance` skill (e.g. `/harness-maintenance audit`) should:

1. List every file with `valid_until` < today and mark it `[STALE]` in
   `MEMORY.md`.
2. List every file in `.claude/memory/decisions/` missing `valid_from` and
   warn.
3. Detect orphan `supersedes:<slug>` (slug does not exist) and warn.

## Why HTML comments (not YAML frontmatter)

- Markdown frontmatter is already used for `name/description/type` (e.g.
  SKILL.md convention).
- HTML comments are invisible in rendered Markdown (GitHub, Obsidian).
- Trivial `rg` search: `rg 'valid_until:2026-0[1-4]' .claude/`.

## Anti-patterns

- Silently removing a temporal block when a decision changes — always mark
  `supersedes` on the new decision and `valid_until` on the old one.
- Using relative dates ("next week", "soon") — always absolute `YYYY-MM-DD`.
- Leaving a fact in `MEMORY.md` as active while its file's `valid_until` is in
  the past — expected contradiction caught by audit.

## Example (generic)

In `.claude/memory/decisions/2026-05-19-target-journal.md`:

```markdown
<!-- decision valid_from:2026-05-19 valid_until:2026-08-01 -->

# Target journal — Plan A

Primary target: Journal of X (Q1, IF 6.3).
Plan B: Journal of Y (Q2, IF 3.1).
```

When the journal is changed on 2026-07-15, edit the file above to add
`valid_until:2026-07-15` (overriding the original deadline) and create
`2026-07-15-target-journal-revised.md` with
`<!-- decision valid_from:2026-07-15 supersedes:2026-05-19-target-journal -->`.

## How to apply

- Every new decision in `.claude/memory/decisions/` receives a temporal block.
- Every update of an existing fact: edit `valid_until` in the old file, create
  a new file with `supersedes:<old-slug>`.
- Run the audit on a periodic cadence (weekly is a good default).
