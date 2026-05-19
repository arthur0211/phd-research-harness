#!/usr/bin/env node
// PostToolUse hook for Write|Edit on research artifact paths.
// Reads JSON event from stdin (Claude Code PostToolUse payload).
//
// Checks:
//   1. why.md word count (≤300; warn if >300)
//   2. DOI regex format (10.XXXX/...; warn if malformed)
//   3. [NOT VERIFIED] / [NÃO VERIFICADO] markers without library.bib entry (warn)
//   4. AI Use disclosure present in delivery artifacts (warn if missing)
//   5. Temporal validity expired (<!-- valid_until:YYYY-MM-DD --> in past)
//
// Exit codes:
//   0 = ok or warning logged
//   1 = warning logged (informational; non-blocking)
//   2 = block — only used if DEADLINE_DAY env var is set OR STATE.md next_milestone matches today
//
// Performance: <100ms, idempotent. Fail-open on parse error.

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const BIB_FILE = path.join(PROJECT_ROOT, 'references', 'library.bib');
const STATE_FILE = path.join(PROJECT_ROOT, 'STATE.md');
const SETTINGS_FILE = path.join(PROJECT_ROOT, '.claude', 'settings.local.json');

function readMilestone() {
  try {
    const s = fs.readFileSync(STATE_FILE, 'utf8');
    return (s.match(/next_milestone:\s*(\d{4}-\d{2}-\d{2})/) || [])[1] || '';
  } catch { return ''; }
}

// Allow projects to configure artifact path patterns via settings.local.json
// settings.artifactPaths: ["/deliveries/", "/disciplina-caldas/", "/paper1/", ...]
function readArtifactPatterns() {
  try {
    const s = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    if (s && Array.isArray(s.settings && s.settings.artifactPaths)) {
      return s.settings.artifactPaths;
    }
  } catch {}
  // Default patterns — match common research artifact folders
  return [
    '/deliveries/',
    '/delivery/',
    '/entrega-',
    '/disciplina-',
    '/paper',
    '/thesis/',
    '/manuscript/',
    '/revisao-',
    '/review/'
  ];
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { raw += chunk; });
process.stdin.on('end', () => {
  let filePath = '';
  try {
    const event = JSON.parse(raw);
    filePath = (event && event.tool_input && event.tool_input.file_path) || '';
  } catch {
    process.exit(0);
  }
  if (!filePath) process.exit(0);

  // Only check files inside configured artifact paths and ending in .md
  const normalizedPath = filePath.replace(/\\/g, '/');
  if (!normalizedPath.toLowerCase().endsWith('.md')) process.exit(0);

  const patterns = readArtifactPatterns();
  const isArtifact = patterns.some(p => normalizedPath.toLowerCase().includes(p.toLowerCase()));
  if (!isArtifact) process.exit(0);

  let content = '';
  try { content = fs.readFileSync(filePath, 'utf8'); } catch { process.exit(0); }

  const warnings = [];
  const filename = path.basename(filePath).toLowerCase();
  const today = new Date().toISOString().slice(0, 10);

  // Check 1: why.md word count
  if (filename === 'why.md') {
    const words = content.replace(/[#*_`\[\]()]/g, '').split(/\s+/).filter(Boolean);
    if (words.length > 300) {
      warnings.push(`[WORD-COUNT] why.md has ${words.length} words (limit 300)`);
    }
  }

  // Check 2: DOI regex format
  const doiMatches = content.match(/10\.[^\s,;)\]]+/g) || [];
  const malformedDois = doiMatches.filter((d) => !/^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/i.test(d));
  if (malformedDois.length > 0) {
    warnings.push(`[DOI-FORMAT] ${malformedDois.length} suspicious DOI(s): ${malformedDois.slice(0, 3).join(', ')}`);
  }

  // Check 3: [NÃO VERIFICADO] / [NOT VERIFIED] without library.bib backing
  // Unicode-normalized comparison to handle NFC vs NFD encoding variance.
  const normalized = content.normalize('NFC');
  const unverifiedRe = /\[(?:N(?:[ÃÂẪÄ]|Ã)O\s+VERIFICADO|NOT\s+VERIFIED)[^\]]*\]/giu;
  const unverifiedMatches = normalized.match(unverifiedRe) || [];
  if (unverifiedMatches.length > 0) {
    warnings.push(`[UNVERIFIED] ${unverifiedMatches.length} marker(s) — confirm before submitting`);
  }

  // Check 4: AI Use disclosure on delivery artifacts
  const isDelivery = /\/(entrega|delivery|deliveries)-?\d*/i.test(normalizedPath);
  if (isDelivery) {
    const hasDisclosure = /AI use|uso de IA|claude|llm|GPT|generative/i.test(content);
    if (!hasDisclosure) {
      warnings.push(`[AI-DISCLOSURE] delivery artifact without AI use mention (research-integrity.md)`);
    }
  }

  // Check 5: Temporal validity expired
  const validUntilMatches = [...content.matchAll(/valid_until:(\d{4}-\d{2}-\d{2})/g)];
  for (const m of validUntilMatches) {
    if (m[1] < today) {
      warnings.push(`[TEMPORAL] valid_until:${m[1]} expired (today ${today}) — revise fact`);
    }
  }

  if (warnings.length === 0) process.exit(0);

  // Log to stderr (visible to Claude/user)
  console.error('⚠ verify-research-artifact:');
  for (const w of warnings) console.error('  ' + w);

  // Block only on deadline day: env var DEADLINE_DAY (override) OR STATE.md next_milestone.
  const deadlineDay = process.env.DEADLINE_DAY || readMilestone();
  if (deadlineDay && deadlineDay === today && warnings.length > 0) {
    console.error('  BLOCKING: today is deadline (' + deadlineDay + '); fix before continuing.');
    process.exit(2);
  }

  process.exit(1);
});

setTimeout(() => process.exit(0), 5000);
