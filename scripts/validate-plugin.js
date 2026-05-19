#!/usr/bin/env node
// Mock plugin loader — simulates what Claude Code does on `/plugin install phd-research`.
// Validates:
//   1. marketplace.json schema (plugins[].source paths resolve)
//   2. plugin.json schema (name/version/description present)
//   3. hooks.json schema (canonical event names; commands resolve)
//   4. Every SKILL.md / agent.md / command.md frontmatter parses as YAML
//   5. ${CLAUDE_PLUGIN_ROOT} substitution works
// Exit 0 = pass; 1 = fail with diagnostics.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PLUGIN_DIR = path.join(ROOT, 'plugins', 'phd-research');
let errors = [];
let warnings = [];

function err(msg) { errors.push(msg); }
function warn(msg) { warnings.push(msg); }

// --- 1. marketplace.json
const mkt = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude-plugin', 'marketplace.json'), 'utf8'));
if (!mkt.name) err('marketplace.json missing name');
if (!Array.isArray(mkt.plugins) || mkt.plugins.length === 0) err('marketplace.json missing plugins[]');
for (const p of (mkt.plugins || [])) {
  if (!p.source) err(`plugin ${p.name} missing source`);
  // Try both conventions: relative to marketplace.json dir AND relative to repo root
  const fromMarketplaceDir = path.resolve(ROOT, '.claude-plugin', p.source);
  const fromRepoRoot = path.resolve(ROOT, p.source);
  if (!fs.existsSync(fromRepoRoot) && !fs.existsSync(fromMarketplaceDir)) {
    err(`plugin ${p.name} source resolves to non-existent path (tried both): ${fromRepoRoot} | ${fromMarketplaceDir}`);
  }
}

// --- 2. plugin.json
const pj = JSON.parse(fs.readFileSync(path.join(PLUGIN_DIR, '.claude-plugin', 'plugin.json'), 'utf8'));
for (const k of ['name', 'version', 'description']) {
  if (!pj[k]) err(`plugin.json missing required field: ${k}`);
}

// --- 3. hooks.json
const hj = JSON.parse(fs.readFileSync(path.join(PLUGIN_DIR, 'hooks', 'hooks.json'), 'utf8'));
const CANONICAL_EVENTS = ['SessionStart', 'SessionEnd', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'Stop', 'SubagentStop', 'PreCompact', 'Notification'];
if (!hj.hooks || typeof hj.hooks !== 'object') err('hooks.json missing hooks object');
for (const evt of Object.keys(hj.hooks || {})) {
  if (!CANONICAL_EVENTS.includes(evt)) warn(`hooks.json non-canonical event: ${evt}`);
  for (const block of hj.hooks[evt]) {
    for (const h of (block.hooks || [])) {
      const cmd = h.command || '';
      // Substitute ${CLAUDE_PLUGIN_ROOT} with actual plugin dir
      const resolved = cmd.replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, PLUGIN_DIR).replace(/\\\"/g, '"');
      // Extract referenced script path (the last token after "node ")
      const m = resolved.match(/node\s+"([^"]+)"/);
      if (m) {
        const scriptPath = m[1];
        if (!fs.existsSync(scriptPath)) err(`hooks.json references non-existent script: ${scriptPath}`);
      }
    }
  }
}

// --- 4. Frontmatter parsing for all markdown files in skills/, agents/, commands/
function parseFrontmatter(filepath) {
  const txt = fs.readFileSync(filepath, 'utf8');
  if (!txt.startsWith('---\n')) return { error: 'no frontmatter' };
  const end = txt.indexOf('\n---\n', 4);
  if (end === -1) return { error: 'unterminated frontmatter' };
  const block = txt.slice(4, end);
  // Minimal YAML parse — accept key: value (one per line, possibly with quoted values)
  const fields = {};
  for (const line of block.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const m = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (!m) return { error: `unparseable line: ${line}` };
    fields[m[1]] = m[2].trim();
  }
  return { fields };
}

function walk(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p, ext));
    else if (entry.name.endsWith(ext)) out.push(p);
  }
  return out;
}

const skillFiles = walk(path.join(PLUGIN_DIR, 'skills'), '.md').filter(p => p.endsWith('SKILL.md'));
const agentFiles = walk(path.join(PLUGIN_DIR, 'agents'), '.md');
const commandFiles = walk(path.join(PLUGIN_DIR, 'commands'), '.md');

console.log(`Found: ${skillFiles.length} skills, ${agentFiles.length} agents, ${commandFiles.length} commands`);

for (const f of skillFiles) {
  const r = parseFrontmatter(f);
  if (r.error) { err(`SKILL ${path.basename(path.dirname(f))}: ${r.error}`); continue; }
  if (!r.fields.name) err(`SKILL ${path.basename(path.dirname(f))}: missing name`);
  if (!r.fields.description) err(`SKILL ${path.basename(path.dirname(f))}: missing description`);
  // Skills MUST NOT have model: or tools:
  if (r.fields.model) warn(`SKILL ${path.basename(path.dirname(f))}: has model: field (not allowed in SKILL.md)`);
  if (r.fields.tools) warn(`SKILL ${path.basename(path.dirname(f))}: has tools: field (not allowed in SKILL.md)`);
}

for (const f of agentFiles) {
  const r = parseFrontmatter(f);
  if (r.error) { err(`AGENT ${path.basename(f)}: ${r.error}`); continue; }
  if (!r.fields.name) err(`AGENT ${path.basename(f)}: missing name`);
  if (!r.fields.description) err(`AGENT ${path.basename(f)}: missing description`);
  // Agents SHOULD have model: and tools:
  if (!r.fields.model) warn(`AGENT ${path.basename(f)}: missing model: (recommended)`);
  if (!r.fields.tools) warn(`AGENT ${path.basename(f)}: missing tools: (recommended)`);
}

for (const f of commandFiles) {
  const r = parseFrontmatter(f);
  if (r.error) { err(`COMMAND ${path.basename(f)}: ${r.error}`); continue; }
  if (!r.fields.description) err(`COMMAND ${path.basename(f)}: missing description`);
}

// --- Report
if (warnings.length) {
  console.log('\n⚠ Warnings:');
  for (const w of warnings) console.log('  - ' + w);
}
if (errors.length) {
  console.log('\n❌ Errors:');
  for (const e of errors) console.log('  - ' + e);
  process.exit(1);
}
console.log('\n✅ All checks passed.');
process.exit(0);
