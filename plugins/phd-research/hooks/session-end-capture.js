#!/usr/bin/env node
// SessionEnd hook: lightweight extraction from transcript.
// Reads JSON event from stdin (Claude Code SessionEnd payload).
// Appends:
//   1. 1 line to .claude/memory/sessions-log.jsonl  (FTS-searchable)
//   2. candidates to .claude/memory/feedback/learnings-candidates.md (review queue)
//   3. observations to .claude/memory/subconscious/<date>.md (implicit signals)
//
// Fail-open: any error → exit 0 (never blocks session end).
// Idempotent: writes only if not duplicate (same session_id).
//
// Limits: <200ms execution, <10KB writes.

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const MEMORY_DIR = path.join(PROJECT_ROOT, '.claude', 'memory');
const SESSIONS_LOG = path.join(MEMORY_DIR, 'sessions-log.jsonl');
const CANDIDATES = path.join(MEMORY_DIR, 'feedback', 'learnings-candidates.md');
const SUBCONSCIOUS_DIR = path.join(MEMORY_DIR, 'subconscious');

// Read settings; capture can be disabled per-project.
const SETTINGS_FILE = path.join(PROJECT_ROOT, '.claude', 'settings.local.json');
function captureEnabled() {
  try {
    const s = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    if (s && s.settings && s.settings.sessionCaptureEnabled === false) return false;
  } catch {}
  return true;
}

function mkdirSafe(p) {
  try { fs.mkdirSync(p, { recursive: true }); } catch {}
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { raw += chunk; });
process.stdin.on('end', () => {
  try {
    if (!captureEnabled()) process.exit(0);
    const event = JSON.parse(raw || '{}');
    const sessionId = event.session_id || 'unknown';
    const today = new Date().toISOString().slice(0, 10);

    const transcriptPath = event.transcript_path || '';
    const stopReason = event.stop_reason || 'unknown';

    // 1. Sessions-log append (1 line JSON)
    const logEntry = {
      session_id: sessionId,
      date: today,
      cwd: event.cwd || '',
      stop_reason: stopReason,
      transcript: transcriptPath
    };

    mkdirSafe(MEMORY_DIR);
    let existing = '';
    try { existing = fs.readFileSync(SESSIONS_LOG, 'utf8'); } catch {}
    if (!existing.includes(`"session_id":"${sessionId}"`)) {
      fs.appendFileSync(SESSIONS_LOG, JSON.stringify(logEntry) + '\n');
    }

    // 2. Candidates: stub — heavy transcript parsing deferred to /instincts learn.
    const candidateEntry = `\n### ${today} — session ${sessionId.slice(0, 8)}\n` +
      `- Signal: session-end\n` +
      `- Stop reason: ${stopReason}\n` +
      `- For detailed extraction: run \`/instincts learn\` manually or read transcript at ${transcriptPath}\n`;
    try {
      const candidatesContent = fs.readFileSync(CANDIDATES, 'utf8');
      if (!candidatesContent.includes(sessionId.slice(0, 8))) {
        fs.appendFileSync(CANDIDATES, candidateEntry);
      }
    } catch {
      // file missing — silently create with header
      mkdirSafe(path.dirname(CANDIDATES));
      fs.writeFileSync(CANDIDATES, `# Learnings candidates\n\n> Auto-appended on SessionEnd. Promote to rules via \`/instincts evolve\`.\n${candidateEntry}`);
    }

    // 3. Subconscious daily file
    mkdirSafe(SUBCONSCIOUS_DIR);
    const subFile = path.join(SUBCONSCIOUS_DIR, `${today}.md`);
    const subEntry = `- ${new Date().toISOString()} session ${sessionId.slice(0, 8)} stopped: ${stopReason}\n`;
    try {
      if (!fs.existsSync(subFile)) {
        fs.writeFileSync(subFile,
          `# Subconscious — ${today}\n\n` +
          `> Auto-extracted observations. Read on-demand by phd-orchestrator.\n\n`);
      }
      const subContent = fs.readFileSync(subFile, 'utf8');
      if (!subContent.includes(sessionId.slice(0, 8))) {
        fs.appendFileSync(subFile, subEntry);
      }
    } catch {}

    process.exit(0);
  } catch (e) {
    process.exit(0);
  }
});

setTimeout(() => process.exit(0), 5000);
