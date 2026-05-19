---
name: slr-entrega-1
description: FGV-EAESP DPA Caldas 2026 Entrega Intermediária #1 protocol (7 mandatory artifacts due 2026-05-24). Use ONLY if researcher.program in settings.local.json contains 'FGV-EAESP DPA'. Other programs should use slr-protocol skill instead. Triggers: "entrega 1", "entrega intermediária", "Caldas", "revisão integrativa FGV", "protocolo SLR FGV", "disciplina Caldas", "entrega 24 maio", "FGV revisão integrativa".
---

# /slr-entrega-1 — Entrega Intermediária #1 (vence 2026-05-24)

Skill específica do programa **FGV-EAESP DPA — Disciplina Transformação
Organizacional — Prof. Miguel P. Caldas (2026)**. Herda o protocolo genérico
de `slr-protocol` e adiciona: deadline 2026-05-24, categorização Burrell &
Morgan + Astley & Van de Ven obrigatória, gating de periódico-alvo via
Daniela Maia / Filipe Fortunato, e referências canônicas do syllabus
([S01] [S31] [S32] [O10]).

Para qualquer outro programa, use `slr-protocol` (genérico) em vez desta.

## Gate de fase

Ler `${CLAUDE_PROJECT_DIR}/STATE.md` campo `current_phase`. Aceita se ∈
{`refining`, `locking`, `reviewing`}. Recusa se `exploring` (rode
`theme-refinement` primeiro) ou `submitting` (esta skill produz draft, não
revisão final).

## Gate de programa

Ler `${CLAUDE_PROJECT_DIR}/.claude/settings.local.json` campo
`researcher.program`. Aceita se contém "FGV-EAESP DPA" (case-insensitive).
Senão recusa com mensagem:

> 🚫 Esta skill é específica do programa FGV-EAESP DPA — Disciplina Caldas
> 2026. Seu campo `researcher.program` é `<valor>`. Use o `slr-protocol`
> skill genérico em vez desta.

## Inputs

- **Topic / hypothesis** — do prompt ou de
  `${CLAUDE_PROJECT_DIR}/tema-exploration/00-tema-atual.md`
- **STATE.md** — `current_phase`, `next_milestone`, `hipotese_ativa`,
  `hipotese_fallback`
- **MEMORY.md** — decisões travadas a honrar (tema, tipo revisão,
  periódico Plano B, string Variante E)
- **Sweeps anteriores** — `tema-exploration/02-seed-papers/` (já validado
  N=153 Scopus em Variante E)
- **Settings** — `researcher.targetJournals` para confirmar Plano B
  (RAUSP + IJMR)

## Workflow

Replica os 9 passos de `slr-protocol`, COM as adições abaixo nos passos
indicados.

### Step 1 — Read context (+ FGV-specific)

Adicionalmente ler:

- `${CLAUDE_PROJECT_DIR}/.claude/rules/slr-disciplina-caldas.md` —
  exigências do syllabus
- `${CLAUDE_PROJECT_DIR}/disciplina-caldas/revisao-literatura/entrega-01-2026-05-24/`
  — pasta-alvo (criar se não existir)

### Step 2 — Pre-flight: tipo de revisão

Default travado em **Revisão Integrativa** (decisão MEMORY 2026-05-19),
ancorada em:

- **[S01] Cronin & George (2023)** — base metodológica canônica
- **[S32] Rousseau (2024)** — review methodology AMA, reforço

Se `tipo-revisao.md` já existe e justifica integrative com essas refs, pular
`review-type-chooser`. Se ausente, invocar.

### Step 3 — Literature sweep

Reaproveitar `tema-exploration/02-seed-papers/` se sweep recente (<30 dias).
Senão, invocar `literature-scout` em paralelo para:

- H1: workplace financial stress + decision-making
- H2: scarcity, cognitive load & everyday decisions (HIPÓTESE ATIVA)
- H3: financial well-being interventions (FALLBACK)

### Step 4 — Gap classification

Invocar `gap-hunter`. Classificar em 6-type typology +
**categorização específica do syllabus**:

- Paradigmas **Burrell & Morgan (1979)**: functionalist, interpretivist,
  radical humanist, radical structuralist
- **Astley & Van de Ven (1983/2005)**: system-structural, strategic choice,
  natural selection, collective action
- Nível: **micro / meso / macro**

Esta categorização é REQUISITO DO SYLLABUS e aparece na amostra final.

### Step 5 — Consult instincts

Aplicar instinct `variante-e-pattern` (paradigm-fit 17/20 management/psy)
se confidence ≥ 0.7. Verificar `${CLAUDE_PROJECT_DIR}/.claude/memory/feedback/INSTINCTS.jsonl`.

### Step 6 — Protocol design

Invocar `slr-architect` com:

- Sweep + gap classification (com Burrell-Morgan + Astley-Van de Ven)
- Referências syllabus obrigatórias: [S01] [S31] [S32] [O10]
- Periódico-alvo: aplicar gating logic do Step 7.4 abaixo
- String canônica Variante E como ponto de partida

### Step 7 — Escrever 7 artefatos

Pasta-alvo (FIXA, do syllabus):
`${CLAUDE_PROJECT_DIR}/disciplina-caldas/revisao-literatura/entrega-01-2026-05-24/`

Os 7 artefatos exigidos pelo syllabus:

| # | Arquivo | Conteúdo FGV-específico |
|---|---------|-------------------------|
| 1 | `why.md` | ≤300 palavras. Justifica a revisão como Artigo #1 da tese por artigos (não só como exigência da disciplina). |
| 2 | `tema.md` | Tema refinado: workplace WB ∩ scarcity-cognitive load (decisão MEMORY 2026-05-19). |
| 3 | `tipo-revisao.md` | Revisão Integrativa, ref [S01] Cronin & George (2023) + [S32] Rousseau (2024). |
| 4 | `periodico-alvo.md` | 2 periódicos ranqueados + templates anexos. Plano B se gating falhar: RAUSP (safe) + IJMR (ambicioso). |
| 5 | `strings-busca.md` | String booleana Variante E + operadores justificados. |
| 6 | `bases.md` | Scopus + WoS + EBSCO via portal CAFe FGV (acesso institucional manual). |
| 7 | `n-contagem.md` | N por base + total dedup. Faixa **50 ≤ N ≤ 2000**. Variante E já validada N=153 Scopus. |

#### Step 7.4 — Periódico-alvo (gating Daniela Maia / Filipe Fortunato)

Se **antes de 2026-05-22** chegou lista de periódicos approved (email
Daniela Maia danihennemann@gmail.com OU Filipe Fortunato filipe@enable.adm.br):

- Ranquear 2 periódicos da lista approved que melhor casam com tema
- Anexar template (DOCX ou LaTeX) baixado do site do periódico

Se NÃO chegou até 2026-05-22:

- Ativar **Plano B travado** (decisão MEMORY 2026-05-19):
  - **RAUSP Management Journal** (safe — practitioner-friendly, escopo BR)
  - **IJMR — International Journal of Management Reviews** (ambicioso —
    review-only, IF alto, escopo internacional)
- Documentar no artefato que o Plano B foi ativado por gating não resolvido
- Manter ambos os templates anexos

### Step 8 — Self-check (+ FGV-specific)

Adicionar aos checks de `slr-protocol`:

1. **Pasta-alvo correta**: arquivos em
   `disciplina-caldas/revisao-literatura/entrega-01-2026-05-24/`, não em
   `deliveries/`
2. **Categorização Burrell-Morgan + Astley-Van de Ven presente** no
   `tema.md` ou no `tipo-revisao.md`
3. **Referências [S01] [S31] [S32] [O10] citadas** ao menos uma vez nos
   artefatos (verificação grep)
4. **Plano B documentado** se gating periódico não resolvido até 2026-05-22
5. **Idioma**: artefatos em PT-BR (per `researcher.language` esperado para
   FGV)
6. **Deadline check**: se hoje >= 2026-05-24, escalar URGÊNCIA ao user
   (cite hook `verify-research-artifact.js` que vai bloquear commits)

### Step 9 — Report

Concise report mencionando:

- ✅ 7 arquivos criados em pasta correta
- N por base + total dedup
- Status do gating periódico (resolvido / Plano B ativado)
- Word count `why.md`
- Próxima ação: handoff manual WoS/EBSCO via portal CAFe OU envio email
  Daniela Maia se ainda não enviado

## Boolean string starter (workplace WB + scarcity-cognitive load)

String canônica **Variante E** (decisão travada MEMORY 2026-05-19,
validada Scopus N=153, paradigm-fit 17/20 em
management/organizational psychology):

```
("financial stress" OR "financial scarcity" OR "financial fragility"
  OR "financial strain")
AND ("decision-making" OR "decision quality" OR "cognitive load"
  OR "bounded rationality")
AND ("workplace" OR "employee" OR "everyday" OR "household" OR "daily")
AND NOT ("clinical depression" OR "psychiatric disorder")
```

Adaptações por base (no `strings-busca.md`):

- **Scopus**: `TITLE-ABS-KEY( ... )` + filtros DOCTYPE(ar OR re) +
  PUBYEAR > 2009 + LANGUAGE(English OR Portuguese)
- **WoS**: `TS=( ... )` + Document Types: Article OR Review +
  Timespan 2010-2026 + Languages: English OR Portuguese
- **EBSCO** (Business Source Complete): `TI ( ... ) OR AB ( ... )` +
  Source Types: Academic Journals + Date 2010-2026

Operadores justificados:

- `AND` entre 3 clusters: financial stress + decision + workplace —
  intersecção é o tema único da revisão
- `OR` dentro de cluster: sinônimos da literatura (scarcity literature usa
  "stress" / "scarcity" / "strain" intercambiavelmente — Mani et al. 2013)
- `AND NOT clinical`: scarcity literature contamina com psychiatric studies
  que não tratam de decisão financeira cotidiana

## Constraints

- **Citation rigor**: nunca fabricar [S01], [S31], [S32], [O10] — verificar
  DOIs via `citation-verify`. Lista canônica:
  - [S01] Cronin & George (2023) — Organizational Research Methods
  - [S31] Leal & Chimenti (2026) — RAC editorial
  - [S32] Rousseau (2024) — AMA review methodology
  - [O10] Callahan (2014) — 6W's framework, HRDR
- **Research integrity**: declarar uso de IA em cada artefato (footer
  obrigatório per `research-integrity.md`).
- **Pasta-alvo FIXA**: `disciplina-caldas/revisao-literatura/entrega-01-2026-05-24/`.
  Não usar `deliveries/`.
- **Idioma**: PT-BR (artefatos da entrega; código/BibTeX em EN).
- **Deadline hard**: 2026-05-24 23:59. Hook `verify-research-artifact.js`
  bloqueia commits em deadline-day se warnings presentes.
- **Phase gate**: `current_phase` ∈ {refining, locking, reviewing}.

## Auto-route to generic skill

Se `researcher.program` em `settings.local.json` NÃO contém "FGV" (case-
insensitive), esta skill retorna IMEDIATAMENTE com:

> 🚫 Este protocolo é específico do programa FGV-EAESP DPA Caldas 2026.
> Seu `researcher.program` é `<valor-detectado>`. Use o `slr-protocol`
> skill genérico em vez deste — produz os mesmos 6 artefatos universais
> sem as exigências específicas do syllabus Caldas (Burrell-Morgan,
> Astley-Van de Ven, [S01]/[S31]/[S32]/[O10], pasta fixa).

Não tenta adaptar — redireciona limpo.

## Refs

- Skill genérica pai: `slr-protocol`
- Agentes: `slr-architect`, `literature-scout`, `gap-hunter`
- Skills relacionadas: `review-type-chooser`, `citation-verify`,
  `theme-refinement`, `screening-workflow`, `manual-search-protocol`,
  `research-instincts`
- Rules: `slr-disciplina-caldas.md`, `citation-rigor.md`,
  `research-integrity.md`, `phase-gating.md`, `temporal-validity.md`
- Decisões MEMORY:
  - `2026-05-19-tema.md` (workplace WB ∩ scarcity-cognitive load)
  - `2026-05-19-tipo-revisao.md` (Integrativa, Cronin & George 2023)
  - `2026-05-19-periodico-plano-b.md` (RAUSP + IJMR)
  - `2026-05-19-string-variante-e.md` (N=153 Scopus)
