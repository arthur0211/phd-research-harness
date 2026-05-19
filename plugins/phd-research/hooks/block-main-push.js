#!/usr/bin/env node
// PreToolUse hook for Bash: blocks `git push` targeting main/master.
// Reads JSON event from stdin, exits 2 to block, exits 0 to allow.
// On any parse error or missing field, exits 0 (fail-open: never block unrelated Bash calls).
//
// Configurable via .claude/settings.local.json:
//   settings.blockMainPush: false  → disable this hook entirely

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const SETTINGS_FILE = path.join(PROJECT_ROOT, '.claude', 'settings.local.json');

function blockEnabled() {
  try {
    const s = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    if (s && s.settings && s.settings.blockMainPush === false) return false;
  } catch {}
  return true;
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { raw += chunk; });
process.stdin.on('end', () => {
  if (!blockEnabled()) process.exit(0);
  let cmd = '';
  try {
    const event = JSON.parse(raw);
    cmd = (event && event.tool_input && event.tool_input.command) || '';
  } catch {
    process.exit(0);
  }
  if (!cmd) process.exit(0);

  // Block `git push ... main|master` (any flags, any remote, including --force).
  const pattern = /\bgit\s+push\b(?=[\s\S]*\b(main|master)\b)/;
  if (pattern.test(cmd)) {
    console.error('BLOCKED: direct push to main/master not allowed. Use feature/* branch + PR.');
    console.error('To disable: set settings.blockMainPush=false in .claude/settings.local.json');
    process.exit(2);
  }
  process.exit(0);
});
