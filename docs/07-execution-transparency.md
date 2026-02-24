# Execution Transparency

> Every automated task must produce a visible report. No silent execution.

## Principle

The user needs to know what happened, not just that something ran. "Trust but verify" requires verifiable output.

## Execution Logs

Every cron task writes a structured log before sending its report:

```
data/exec-logs/
├── SPEC.md                          ← Log specification
├── community-patrol/
│   └── YYYY-MM-DD-HHMM.md
├── memory-review/
│   └── YYYY-MM-DD.md
├── daily-backup/
│   └── YYYY-MM-DD.md
└── health-check/
    └── YYYY-MM-DD.md
```

### Log Structure

```markdown
# [Task Name] Execution Log | YYYY-MM-DD HH:MM

## Metadata
- Task: [cron job name]
- Trigger time: [ISO-8601]
- Model: [model used]
- Timeout: [timeout]s

## Execution Steps
### Step 1: [Step Name]
- Input: [parameters/commands]
- Output: [actual result summary]
- Duration: [time]
- Status: ✅ Success / ⚠️ Partial / ❌ Failed

### Step 2: [Step Name]
...

## Key Decisions
(Record any judgment calls: why filtered, why selected, why skipped)

## Result Summary
- Final output: [one-line description]
- Anomalies: [any issues encountered]
```

## Instant Push

Execution logs are pushed to the backup repository immediately after creation (not waiting for the daily backup):

```bash
# Serialize git operations with flock to prevent concurrent conflicts
flock -w 60 /path/to/git.lock -c "\
  git add data/exec-logs/ && \
  git diff --cached --quiet || (\
    git -c rebase.autoStash=true pull --rebase origin main && \
    git commit -m 'exec-log: [job-name] [timestamp]' && \
    git push origin main\
  )"
```

If the lock can't be acquired within 60 seconds, skip this push — the daily backup will catch it.

## Report Traceability

Every report sent to the user includes a link to the full execution log:

```
📋 Execution log: https://github.com/[user]/[repo]/blob/main/workspace/data/exec-logs/[job]/YYYY-MM-DD.md
```

Note: logs pushed via instant push are available immediately. Logs from the current day that missed instant push will be available after the nightly backup.

## Dashboard

A summary dashboard (`data/dashboard.md`) is auto-updated periodically:

```markdown
# Automation Dashboard
> Auto-updated | Last update: YYYY-MM-DD HH:MM

## Task Status Overview
| Task | Frequency | Last Run | Status | Duration | Errors | Next Run |
|------|-----------|----------|--------|----------|--------|----------|
| ... | ... | ... | ✅/❌ | ...s | N | ... |

## Token Usage Trend (Last 7 Days, Cron Only)
| Date | patrol | review | backup | health | Total |
|------|--------|--------|--------|--------|-------|
| ... | ... | ... | ... | ... | ... |

## Anomalies
(List tasks with errors or consecutive failures)

## Recent Execution Logs
| Date | Task | Log Link |
|------|------|----------|
| ... | ... | [link] |
```

## Token Tracking

A zero-LLM script reads session data and computes per-task token usage:

- Reads `sessions.json` directly (no API calls, no LLM)
- Outputs daily JSON snapshots to `data/token-history/YYYY-MM-DD.json`
- Idempotent: multiple runs on the same day don't duplicate counts
- Optionally pushes a daily summary to the user's channel

See `scripts/token-tracker.js` for the reference implementation.
