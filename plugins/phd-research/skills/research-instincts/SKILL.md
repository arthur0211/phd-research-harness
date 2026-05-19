---
name: research-instincts
description: Captures and tracks learned patterns about research workflow (string composition, paradigm-fit, gap detection, journal targeting, screening heuristics) with confidence scoring. Append-only INSTINCTS.jsonl with decay. Auto-extracts candidates from session transcripts via SessionEnd hook; manual promotion ≥0.7 + 3 occurrences → rule. Use when user says "learn this", "remember this pattern", or after recurring corrections. Runs entirely from local files — no external service.
---

# research-instincts

Sistema de captura de padrões aprendidos no contexto de pesquisa acadêmica
(literature review, protocol design, screening, extraction).
File-based, decay-aware, promotion-gated.

## Storage

- **`${CLAUDE_PROJECT_DIR}/.claude/memory/feedback/INSTINCTS.jsonl`** —
  append-only, 1 linha por instinct
- **`${CLAUDE_PROJECT_DIR}/.claude/memory/feedback/learnings-candidates.md`** —
  staging area (extraído pelo SessionEnd hook); user revisa antes de promover

## Schema (1 linha JSON por instinct)

```json
{
  "id": "string-2cluster-and-1modulator",
  "rule": "Boolean string com 2 clusters AND + 1 modulador OR retorna N na faixa 50-2000",
  "confidence": 0.7,
  "occurrences": 3,
  "evidence": ["sweep-YYYY-MM-DD.md (N=<count>)", "..."],
  "domain": ["search-string", "scopus"],
  "created_at": "YYYY-MM-DD",
  "last_seen": "YYYY-MM-DD",
  "decay_after": "YYYY-MM-DD",
  "promoted_to_rule": false
}
```

## Comandos (skill-level)

### `/instincts learn <rule>`

Adicionar instinct novo a INSTINCTS.jsonl com `confidence=0.5, occurrences=1`.

### `/instincts review`

Listar instincts com `confidence ≥ 0.7 AND occurrences ≥ 3 AND not promoted`.
Sugerir promoção a rule.

### `/instincts evolve`

Para cada candidate alto-confidence: criar rule em
`${CLAUDE_PROJECT_DIR}/.claude/rules/`, marcar `promoted_to_rule=true` no
JSONL.

### `/instincts prune`

Remover (move para `INSTINCTS-archive.jsonl`) instincts com
`decay_after < hoje`.

## SessionEnd hook (extração automática)

`${CLAUDE_PROJECT_DIR}/.claude/hooks/session-end-capture.js` extrai do
transcript:

- Correções do user ("não, faça X em vez de Y")
- Sucessos não-óbvios validados ("ok, perfeito assim")
- Padrões recorrentes (≥2 ocorrências no mesmo transcript)

Output: append em `learnings-candidates.md` com timestamp + contexto.
**Nunca** escreve direto em INSTINCTS.jsonl — sempre passa por staging.

## Confidence scoring

Base 0.5 em criação. Adjustments:

- +0.1 cada vez que o pattern se repete sem correção
- +0.2 se user explicitamente confirma ("sim, exatamente isso")
- -0.3 se user contradiz o pattern em sessão futura
- -0.1 a cada 30 dias sem ocorrência (drift natural)

Promoção: ≥0.7 + ≥3 occurrences + ≥30 dias desde criação.

## Decay

`decay_after = created_at + 180 dias` por padrão. Override manual no JSONL.
Pivô de tema → manual prune dos instincts ligados ao tema antigo.

## Como NÃO usar

- Não armazenar fatos sobre o user — isso é IDENTITY.md
- Não armazenar fatos sobre o projeto — isso é MEMORY.md decisions
- Não armazenar valores/identidade — isso é SOUL.md
- INSTINCTS é exclusivamente para **padrões de workflow descobertos**

## Refs

- `.claude/hooks/session-end-capture.js`
- `.claude/memory/feedback/INSTINCTS.jsonl`
- `.claude/memory/feedback/learnings-candidates.md`
- `.claude/rules/temporal-validity.md`
