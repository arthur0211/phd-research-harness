# Smoke test — v0.1.2 behavior verification

Roda em ~10 min. Você precisa rodar — eu não consigo invocar `claude` recursivamente.

## Setup

```powershell
# 1. Limpar test dir
Remove-Item -Recurse -Force C:\tmp\paula-test -ErrorAction SilentlyContinue
mkdir C:\tmp\paula-test
cd C:\tmp\paula-test

# 2. Garantir plugin no marketplace + instalado
claude
> /plugin marketplace add arthur0211/phd-research-harness
> /plugin install phd-research
```

## Test 1 — bootstrap idempotency (issue #7)

Objetivo: confirmar que CTRL-C mid-flow + re-run NÃO sobrescreve arquivos parciais.

```
> /phd-bootstrap
```

Quando ele perguntar o terceiro fato (provavelmente "research area"), pressione **Ctrl+C**.

Verifique o que ficou no diretório:
```powershell
ls C:\tmp\paula-test
ls C:\tmp\paula-test\.claude -ErrorAction SilentlyContinue
```

Se NADA foi escrito ainda (skill estava na fase de perguntas, não writes), o teste de idempotency não tem como disparar. Pula para Test 2 e ignora este.

Se algum arquivo foi escrito (SOUL.md / IDENTITY.md parcial / settings.local.json):

```
> /phd-bootstrap
```

**Resultado esperado (PASS)**: para cada arquivo que já existe, Claude pergunta via AskUserQuestion algo como:
> "SOUL.md already exists. What to do? Skip (recommended) / Overwrite / Show diff first"

**Resultado FAIL**: re-run silentemente sobrescreve sem perguntar. Se isso acontecer, abrir issue de regressão.

## Test 2 — /phd-doctor output format (issue #6)

```
> /phd-doctor
```

**Resultado esperado (PASS)**: output em formato:
```
phd-doctor — <timestamp>

[OK]   Node version: vXX.X.X (≥18 required)
[OK|FAIL] Tier 1 files: ...
[OK|FAIL] settings.local.json: ...
[OK]   Plugin hooks (4): all pass node --check
[OK]   Plugin layout: skills/(11) agents/(6) hooks/(4+1) rules/(5) commands/(4)
[OK|SKIP] Zotero local API: ...

Summary: N OK, M FAIL, K SKIP. <action>
```

**Resultado FAIL** se:
- Output não usa formato `[OK]`/`[FAIL]`/`[SKIP]`
- Falta alguma das 6 dimensões
- Não cria `.claude/memory/doctor-log.md`

## Report back

Me diga em 1-2 frases:
- Test 1: PASS | FAIL | N/A (no writes before CTRL-C)
- Test 2: PASS | FAIL (com formato observado se diferente)

Se ambos PASS, sigo para v0.1.3 publicação confiante. Se algum FAIL, abrimos issue v0.1.2.1 antes de qualquer coisa.
