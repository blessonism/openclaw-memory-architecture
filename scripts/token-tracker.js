#!/usr/bin/env node
/**
 * token-tracker.js — Zero-LLM cron token usage tracker
 * 
 * Reads sessions.json directly, computes daily token usage for cron jobs only.
 * Chat/conversation tracking removed — cumulative values are unreliable
 * due to session compaction.
 * 
 * Outputs JSON snapshot + optionally pushes report to messaging channel.
 * Designed to run from auto_backup.sh or standalone.
 * 
 * Usage: node token-tracker.js [--dry-run] [--no-push]
 * 
 * IMPORTANT: Customize the constants below for your setup.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// === Config (customize these) ===
const SESSIONS_PATH = '/path/to/openclaw/agents/main/sessions/sessions.json';
const CONFIG_PATH = '/path/to/openclaw/openclaw.json';
const HISTORY_DIR = '/path/to/workspace/data/token-history';
const CHAT_ID = '[your-chat-id]';
const THREAD_ID = '[your-thread-id]';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const NO_PUSH = args.includes('--no-push');

// === Job ID → Name mapping (customize these) ===
const JOB_MAP = {
  // 'your-job-uuid': 'job-name',
  // Example:
  // '51917832-c03c-4db0-8c3e-6c25370920d7': 'community-patrol',
};

function today() {
  // Adjust timezone offset as needed (8 = UTC+8)
  const now = new Date(Date.now() + 8 * 3600 * 1000);
  return now.toISOString().slice(0, 10);
}

function nowLocal() {
  const now = new Date(Date.now() + 8 * 3600 * 1000);
  return now.toISOString().slice(0, 16).replace('T', ' ');
}

function formatTokens(n) {
  if (n == null || isNaN(n)) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return String(n);
}

function readSessions() {
  return JSON.parse(fs.readFileSync(SESSIONS_PATH, 'utf8'));
}

function readLatestSnapshot() {
  const todayStr = today();
  if (!fs.existsSync(HISTORY_DIR)) return null;

  // Idempotent: if today's snapshot exists, use it as baseline
  // Prevents double-counting on multiple runs per day
  const todayFile = path.join(HISTORY_DIR, `${todayStr}.json`);
  if (fs.existsSync(todayFile)) {
    return JSON.parse(fs.readFileSync(todayFile, 'utf8'));
  }

  // Find most recent snapshot before today
  const files = fs.readdirSync(HISTORY_DIR)
    .filter(f => f.endsWith('.json') && f < `${todayStr}.json`)
    .sort()
    .reverse();

  return files.length > 0
    ? JSON.parse(fs.readFileSync(path.join(HISTORY_DIR, files[0]), 'utf8'))
    : null;
}

function extractCronTokens(sessions, baselineSnapshot) {
  const result = {};
  const reportedRuns = baselineSnapshot?.reportedCronRuns || {};
  let skippedNull = 0;

  for (const [key, val] of Object.entries(sessions)) {
    const runMatch = key.match(/^agent:main:cron:([^:]+):run:/);
    if (!runMatch) continue;

    const jobId = runMatch[1];
    const jobName = JOB_MAP[jobId] || `[unknown] ${jobId.slice(0, 8)}`;

    // Skip runs already reported in previous snapshot
    if (reportedRuns[key]) continue;

    const rawIn = val.inputTokens;
    const rawOut = val.outputTokens;

    // Null tokens: run was interrupted or incomplete
    if (rawIn == null || rawOut == null) {
      skippedNull++;
      continue;
    }

    let input = Math.abs(Number(rawIn));
    let output = Math.abs(Number(rawOut));

    if (!Number.isFinite(input) || !Number.isFinite(output)) continue;

    if (!result[jobName]) result[jobName] = { input: 0, output: 0, runs: 0, runKeys: [] };
    result[jobName].input += input;
    result[jobName].output += output;
    result[jobName].runs += 1;
    result[jobName].runKeys.push(key);
  }

  return { data: result, skippedNull };
}

function buildSnapshot(sessions, cronResult, baselineSnapshot) {
  const reportedCronRuns = { ...(baselineSnapshot?.reportedCronRuns || {}) };
  for (const key of Object.keys(sessions)) {
    if (key.match(/^agent:main:cron:[^:]+:run:/)) {
      reportedCronRuns[key] = true;
    }
  }

  return {
    date: today(),
    timestamp: new Date().toISOString(),
    cron: cronResult.data,
    reportedCronRuns,
  };
}

function buildReport(cronResult) {
  const cronTokens = cronResult.data;
  const lines = [`📊 Cron Token Report | ${today()}\n`];

  let cronTotal = 0;
  const entries = Object.entries(cronTokens)
    .sort((a, b) => (b[1].input + b[1].output) - (a[1].input + a[1].output));

  if (entries.length > 0) {
    for (const [name, val] of entries) {
      const total = val.input + val.output;
      cronTotal += total;
      lines.push(`  ${name}: ${formatTokens(total)} (${val.runs} runs)`);
    }
    lines.push(`\n📈 Total: ${formatTokens(cronTotal)}`);
  } else {
    lines.push('No cron runs today');
  }

  lines.push(`⏰ ${nowLocal()}`);
  return lines.join('\n');
}

async function main() {
  console.log(`[token-tracker] ${nowLocal()} — start`);

  const sessions = readSessions();
  const baseline = readLatestSnapshot();
  const cronResult = extractCronTokens(sessions, baseline);
  const snapshot = buildSnapshot(sessions, cronResult, baseline);
  const report = buildReport(cronResult);

  console.log('\n--- Report ---');
  console.log(report);
  console.log('--- End ---\n');

  if (DRY_RUN) {
    console.log('  (dry-run: skipped write + push)');
    return;
  }

  // Atomic snapshot: write .tmp first, rename after success
  const snapshotPath = path.join(HISTORY_DIR, `${today()}.json`);
  const tmpPath = snapshotPath + '.tmp';
  fs.mkdirSync(HISTORY_DIR, { recursive: true });
  fs.writeFileSync(tmpPath, JSON.stringify(snapshot, null, 2));

  if (!NO_PUSH) {
    // TODO: Implement your push mechanism here
    // Example: sendTelegram(report), sendSlack(report), etc.
    console.log('  Push: implement your messaging integration');
  }

  // Rename .tmp → final (atomic commit)
  fs.renameSync(tmpPath, snapshotPath);
  console.log(`  Snapshot: ${snapshotPath}`);
  console.log('[token-tracker] done');
}

main().catch(e => {
  console.error('[token-tracker] FATAL:', e.message);
  const tmpPath = path.join(HISTORY_DIR, `${today()}.json.tmp`);
  try { fs.unlinkSync(tmpPath); } catch (_) {}
  process.exit(1);
});
