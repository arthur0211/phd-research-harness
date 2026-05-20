---
description: Audit installation health — Tier 1 files, settings.local.json validity, Node version, hook scripts, plugin layout, optional Zotero API. Output checklist [OK]/[FAIL] with corrective hints per FAIL.
allowed-tools: Read, Glob, Bash
---

Invoke the `phd-doctor` skill. It performs read-only checks against the current
project and the installed plugin. Returns a checklist showing each dimension's
status and, for any FAIL, a one-line corrective hint the researcher can act on
without external help.

No writes. No prompts unless a check requires user input (none currently do).
