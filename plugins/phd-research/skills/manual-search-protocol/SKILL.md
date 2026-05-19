---
name: manual-search-protocol
description: Step-by-step manual protocol for databases requiring institutional federated login (EBSCO, Scopus, WoS, ProQuest via CAFe/CAPES, OpenAthens, Shibboleth). Use when you need a manual search protocol, EBSCO protocol, CAFe portal walkthrough, Web of Science access, institutional login flow, CAPES periodicos, OpenAthens, Shibboleth, manual protocol, or portal federado. Generates per-(portal × database) protocol with explicit handoff to automated skills; documents EXACTLY where AI helps and where it cannot.
---

# manual-search-protocol

## When to use

- Database in `connectors.literature-database` requires institutional auth (CAPTCHA, MFA, federated login). Currently this includes: **Scopus, Web of Science, EBSCO host (Business Source, PsycInfo, CINAHL), ProQuest, ABI/INFORM**.
- You have a finalized boolean search string (output of `slr-protocol` or `strings-busca.md`) and need to execute it across paid databases.
- You need a reproducibility artifact for the SLR protocol (which database, when, with what string, how many hits).

Do NOT use for:
- Open databases: **OpenAlex, Semantic Scholar, PubMed, arXiv, CORE, OpenAIRE**. These have public APIs — use `literature-scout` instead, no manual protocol needed.
- Re-running an existing protocol with the same string on the same date — just re-export. The protocol is the cooking recipe, not the cooking.

## Goal

Produce a per-database protocol file at:

```
disciplina-caldas/revisao-literatura/entrega-01-2026-05-24/manual-protocols/
├── ebsco-cafe-protocol.md
├── scopus-cafe-protocol.md
├── wos-cafe-protocol.md
└── proquest-cafe-protocol.md  (if applicable)
```

Each protocol is step-by-step, includes screenshot capture points, and ends with an explicit **HANDOFF** section that names the next automated skill (`screening-workflow`, or dedup via Zotero) and the expected input format.

## Workflow

### Step 1 — Read configuration

From `${CLAUDE_PROJECT_DIR}/.claude/settings.local.json`:
- `connectors.manual-portal` — one of `cafe-capes` (Brazil — covers most BR universities), `openathens` (EU + many US), `shibboleth` (US + EU), `direct-institutional-vpn` (some Asia)
- `connectors.literature-database` — array; only `scopus`, `wos`, `ebsco`, `proquest`, `abi-inform` need this skill

If `manual-portal` is missing, ask the user once; default `cafe-capes` if `researcher.program` indicates a Brazilian institution.

### Step 2 — Determine the (portal × database) matrix

Build the matrix from Step 1. Example for a Brazilian institution using CAFe/CAPES:
- `cafe-capes × scopus` ✓
- `cafe-capes × wos` ✓
- `cafe-capes × ebsco` ✓
- `cafe-capes × proquest` (optional)

OpenAlex / Semantic Scholar / PubMed go to a "no manual needed" note, not a protocol file.

### Step 3 — Generate one protocol per (portal × database)

Pull the boolean string from `strings-busca.md` (or ask user to paste).

Template for `cafe-capes × EBSCO`:

```markdown
# EBSCO via CAFe/CAPES — Manual Search Protocol

## Metadata
- Portal: CAFe (Comunidade Acadêmica Federada) via Periódicos CAPES
- Database: EBSCOhost (Business Source Complete + PsycInfo)
- Institution: <read from `settings.local.json` `researcher.program`>
- Date executed: <YYYY-MM-DD — fill on the day>
- Operator: <read from `settings.local.json` `researcher.name`>
- String version: <ref to strings-busca.md commit hash>
- Filters applied: see Step 7 below
- N hits (TI/AB only): <fill>
- Export format: RIS
- Export file: data/raw/ebsco-<YYYY-MM-DD>.ris

## Steps (human — AI cannot automate)

1. Open https://www.periodicos.capes.gov.br/
2. Click "ACESSO CAFE" (top-right). [📸 screenshot S1]
3. Search institution → type your institution name (e.g., "Fundação Getulio Vargas - FGV", "USP", "UFRJ") → select.
4. Federated login screen → enter institutional credentials. MFA if prompted.
5. After login, top search bar → "Buscar base por título" → type "EBSCO" → select "EBSCOhost (Acadêmico)". [📸 screenshot S2]
6. Inside EBSCO: top-right "Choose Databases" → check Business Source Complete + PsycInfo + CINAHL → OK.
7. Click "Advanced Search". Paste the boolean string:

       <PASTE FROM strings-busca.md>

   into a single search box with field selector "TI Title OR AB Abstract" (use the dropdown — do NOT use TX, that's full-text).

8. Apply filters:
   - Published Date: <YYYY-MM to YYYY-MM> (from protocol)
   - Source Types: ✓ Academic Journals
   - Document Type: ✓ Article ✓ Review (UNcheck Editorial, Book Review, Erratum)
   - Language: ✓ English ✓ Portuguese

9. Click Search. Record N hits at the top of the results page. [📸 screenshot S3]

10. Export:
    a. Top toolbar → "Share" → "Email a link to download exported results"
       OR
    b. Page-level: select all 50 → Folder → open Folder → Export → RIS (Reference Manager) → Save → repeat for each page.
    Limit: 50/page in classic UI; iterate until all pages exported.

11. Save export(s) to `data/raw/ebsco-<YYYY-MM-DD>.ris`. If multiple files (one per page), concatenate them with `cat ebsco-*.ris > ebsco-<YYYY-MM-DD>-merged.ris`.

12. Log the run in `n-contagem.md` under EBSCO row: N hits, date, filters, file path.

## Screenshots required for reproducibility

- S1: CAFe portal landing
- S2: EBSCOhost home after federated login
- S3: results page header showing N hits with the boolean string visible

Save in: `<delivery-folder>/manual-protocols/screenshots/ebsco-<YYYY-MM-DD>-S{1,2,3}.png`

## HANDOFF — automated from here

Once `data/raw/ebsco-<YYYY-MM-DD>.ris` exists:

1. **Dedup**:
   - Option A: Import into Zotero (group library if available) → "Duplicate Items" → merge.
   - Option B: Run `synthesisr::deduplicate()` (R) on the merged file across all bases.
2. **Then**: invoke `screening-workflow` skill with the deduplicated file as input.

The AI handles dedup parsing + screening; the human handles only the portal navigation above.
```

Generate analogous protocols for Scopus, WoS, ProQuest. Differences:

- **Scopus** (Elsevier): advanced search uses syntax `TITLE-ABS-KEY(...)`. Export → CSV or RIS, max 2000/export.
- **WoS** (Clarivate): "Topic" field. Export → "Tab-delimited (Win, UTF-8)" or BibTeX, max 1000/export — iterate in batches.
- **ProQuest**: similar to EBSCO; export RIS, max 100/page.

### Step 4 — Handoff section (required in every protocol)

Every protocol ends with a `## HANDOFF — automated from here` section that:
1. Names the input file location (`data/raw/<base>-YYYY-MM-DD.<ext>`).
2. Names the next skill (`screening-workflow`) and the dedup step before it.
3. States explicitly: "AI handles X; human handles Y."

This is the contract that prevents drift between manual + automated parts.

## Recognized limits

The agent CANNOT:
- Authenticate with institutional credentials (CAFe/Shibboleth/OpenAthens involve federation hops + MFA + sometimes CAPTCHA).
- Click "Export" buttons (no browser session).
- Solve CAPTCHA.
- Handle session timeouts.

The agent CAN:
- Design the boolean string (`slr-protocol`, `strings-busca.md`).
- Parse exported RIS/BibTeX/CSV.
- Dedup across exports (`synthesisr` / Zotero workflow).
- Screen (`screening-workflow`).
- Verify citations on the final included set (`citation-verify`).

This skill documents the seam exactly so the human knows what to do and what to expect back.

## Output format

A single example, fully populated, lives in Step 3 (the EBSCO/CAFe protocol). Generated files follow the same structure for each (portal × database).

## Constraints

- **All exports go to `data/raw/`** — this folder MUST be gitignored (per `research-integrity.md` and project `data/raw/` convention).
- **File naming**: `<base>-YYYY-MM-DD.<ext>` (lowercase base; ISO date; lowercase ext). Examples: `ebsco-2026-05-23.ris`, `scopus-2026-05-23.csv`, `wos-2026-05-23.bib`.
- **Each protocol logs** the following in its Metadata block: portal, database, date, string version (commit hash or version tag), filters, N hits, export format, file path.
- **Screenshots**: at least 3 per database (portal landing, post-login DB home, results page with N visible).
- **Per-database export size caps**: do NOT request >1000 records in a single WoS export or >2000 in Scopus or >100 in EBSCO/ProQuest per page. Iterate in batches; concatenate after.
- **String version traceability**: the protocol MUST reference the exact `strings-busca.md` commit or tag. If the string changes between runs, generate a NEW protocol file with the new date.

## Anti-patterns

- ❌ "I will log in for you." NO. The agent cannot. Saying so erodes trust per the `soberania do user` principle in `ethos.md`.
- ❌ Skipping screenshot capture. Without them, the run is not reproducible 6 months later in peer-review.
- ❌ Exporting >1000 per file. Most databases cap silently, dropping records past the cap without warning.
- ❌ Committing files in `data/raw/` to git. They are gitignored for LGPD + size reasons (per project convention).
- ❌ Reusing yesterday's protocol file for today's run with a different string version. Generate a new file; protocols are immutable run records.
- ❌ Skipping the HANDOFF section. Without it, the next person (or future-you) doesn't know what to feed `screening-workflow`.

## Refs

- `slr-protocol` — produces the boolean string consumed in Step 3
- `screening-workflow` — the next skill in the chain (HANDOFF target)
- `slr-architect` — agent that orchestrates protocol design end-to-end
- `.claude/rules/slr-disciplina-caldas.md` — Entrega 1 (2026-05-24) requires `bases.md` referencing these protocols
- `.claude/rules/research-integrity.md` — `data/raw/` gitignore + AI use disclosure
- CAPES Periódicos: https://www.periodicos.capes.gov.br/
- CAFe (RNP): https://www.rnp.br/servicos/identidade/comunidade-academica-federada
- OpenAthens: https://www.openathens.net/
