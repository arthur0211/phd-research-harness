#!/usr/bin/env node
// Dual-purpose hook: routes phd-orchestrator behavior.
//   SessionStart        → emit silent context banner (phase + milestone + blockers)
//   UserPromptSubmit    → detect keywords and emit hint suggesting which agent fits
//
// Invocation: same script, behavior switched via process.argv[2] = "session-start" | "prompt-submit"
//
// Reads STATE.md (YAML-ish front block) for current_phase, next_milestone, blockers.
// Output: prints a short suggestion line to stdout (additionalContext) — visible to Claude.
//
// Fail-open: any error → silent exit 0.

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const STATE_FILE = path.join(PROJECT_ROOT, 'STATE.md');

function readState() {
  try {
    const content = fs.readFileSync(STATE_FILE, 'utf8');
    const phase = (content.match(/current_phase:\s*(\w+)/) || [])[1] || 'unknown';
    const milestone = (content.match(/next_milestone:\s*(\d{4}-\d{2}-\d{2})/) || [])[1] || '';
    const hours = (content.match(/hours_to_milestone:\s*(\d+)/) || [])[1] || '';
    const blockerCount = (content.match(/^- \[ \]/gm) || []).length;
    return { phase, milestone, hours, blockerCount };
  } catch { return null; }
}

function daysTo(dateStr) {
  if (!dateStr) return '';
  const target = new Date(dateStr).getTime();
  const today = new Date().getTime();
  const d = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  return d >= 0 ? `T-${d}d` : `T+${-d}d (overdue)`;
}

function emitBanner(state) {
  if (!state) return;
  const t = daysTo(state.milestone);
  console.log(`\n📍 Phase: ${state.phase} | Milestone: ${state.milestone} (${t}) | Blockers: ${state.blockerCount}`);
}

const KEYWORD_HINTS = [
  { re: /\b(tema|hip[óo]tese|recorte|theme|hypothesis|scope)\b/i, agent: 'gap-hunter', why: 'classifies gaps in the current scope' },
  { re: /\b(string|boolean|cluster)\b/i, agent: 'slr-architect', why: 'refines query composition' },
  { re: /\b(sweep|busca|search|openalex|scopus)\b/i, agent: 'literature-scout', why: 'multi-source sweep' },
  { re: /\b(why|protocolo|protocol|entrega|delivery)\b/i, skill: 'slr-protocol', why: 'orchestrates the literature review protocol' },
  { re: /\b(submeter|finalizar|revisar|submit|finalize|review)\b/i, agent: 'devils-advocate', why: 'adversarial validation (gated: phase=reviewing+)' },
  { re: /\b(comit[êe]|banca|committee|panel)\b/i, agent: 'thesis-committee', why: 'milestone gate (3 personas, gated)' },
];

function detectIntent(prompt) {
  if (!prompt) return null;
  for (const h of KEYWORD_HINTS) {
    if (h.re.test(prompt)) return h;
  }
  return null;
}

function emitPromptHint(prompt, state) {
  const hint = detectIntent(prompt);
  if (!hint) return;
  const target = hint.agent ? `agent \`${hint.agent}\`` : `skill \`${hint.skill}\``;
  const gated = (hint.agent === 'devils-advocate' || hint.agent === 'thesis-committee');
  if (gated && state && !['reviewing', 'submitting'].includes(state.phase)) {
    console.log(`💡 keyword detected — ${target} suggested, but BLOCKED by phase \`${state.phase}\` (rule phase-gating.md).`);
    return;
  }
  console.log(`💡 keyword detected — consider ${target}: ${hint.why}`);
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { raw += chunk; });
process.stdin.on('end', () => {
  try {
    const mode = process.argv[2] || 'session-start';
    const state = readState();
    if (mode === 'session-start') {
      emitBanner(state);
    } else if (mode === 'prompt-submit') {
      const event = JSON.parse(raw || '{}');
      const prompt = event.prompt || event.user_message || '';
      emitPromptHint(prompt, state);
    }
    process.exit(0);
  } catch {
    process.exit(0);
  }
});

setTimeout(() => process.exit(0), 3000);
