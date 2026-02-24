# Backup System

> Git-based full backup. No database, no vendor lock-in.

## Design

Everything lives in files. Files go into git. Git pushes to GitHub. Simple.

```
Daily Backup Flow:
  1. Run token-tracker (compute daily usage)
  2. git add -A (respect .gitignore, includes tracker output)
  3. Check diff — skip if no changes
  4. Prepend AI change summary if provided (via BACKUP_SUMMARY env var)
  5. Commit with structured message
  6. Push to GitHub
```

Note: The backup script itself does not generate AI summaries. Your cron job or wrapper script is responsible for generating the summary (e.g., using an LLM to describe the diff) and passing it via the `BACKUP_SUMMARY` environment variable.

## Commit Format

```
backup: YYYY-MM-DD

[AI-generated change summary in natural language]

- memory/daily/2025-07/2025-07-15.md (new)
- memory/knowledge/pat-search-design.md (modified)
- data/token-history/2025-07-15.json (new)
```

The AI summary describes what changed in human terms, not just file paths. This makes `git log` useful for understanding what happened over time.

## Lock Mechanism

```bash
LOCK_FILE="/path/to/backup.lock"
exec 200>"$LOCK_FILE"
flock -n 200 || { echo "Another backup is running"; exit 1; }
```

Prevents concurrent backup runs (e.g., manual trigger while cron is running).

## .gitignore Strategy

**Exclude:**
- `images/` (large binaries)
- `node_modules/`
- `bin/`
- Hidden directories (except `.gitignore` itself)
- Temporary files (`*.tmp`, `*.swp`)

**Include:**
- All `memory/` files
- `cron-prompts/`
- `scripts/`
- `skills/`
- `data/` (exec-logs, token-history, dashboard)

Principle: everything needed to reconstruct the agent's state from scratch should be in the backup.

## Recovery

To restore on a new machine:
1. Clone the backup repository
2. Copy `workspace/` contents to the new OpenClaw workspace
3. Restore credentials separately (not in git)
4. Verify: agent should load MEMORY.md and resume context

Credentials are never committed. Store them separately and securely.

## Instant Push (Exec Logs)

Execution logs get pushed immediately after creation, not waiting for the nightly backup. This ensures report links are valid right away. See `07-execution-transparency.md` for the implementation.
