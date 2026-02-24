# Getting Started

> From zero to a working memory system in 15 minutes.

## Prerequisites

- An AI agent platform (OpenClaw, Claude Code, Codex, or similar)
- Git (for backup)
- Node.js 18+ (for token-tracker, optional)
- A messaging channel (Telegram, Slack, Discord — for report delivery, optional)

## Step 1: Set Up Directory Structure

Copy the `templates/` directory into your agent's workspace:

```bash
cp -r templates/ /path/to/your/workspace/
mv templates/MEMORY.md ./MEMORY.md
mv templates/AGENTS.md ./AGENTS.md
mv templates/SOUL.md ./SOUL.md
mv templates/USER.md ./USER.md
```

Create the memory directory structure:

```bash
mkdir -p memory/{daily,people,projects,knowledge,context}
touch memory/glossary.md
touch memory/post-mortems.md
```

## Step 2: Customize Core Files

Edit these files with your specifics:

1. `SOUL.md` — Define your agent's personality and communication style
2. `USER.md` — Fill in the user's name, preferences, and communication style
3. `MEMORY.md` — Add initial People/Terms/Projects tables
4. `memory/glossary.md` — Add any existing abbreviations or internal terms

See `examples/` for fully populated versions of each file.

## Step 3: Add to Agent System Prompt

Add the lookup protocol to your agent's system prompt or instructions. The key sections from `AGENTS.md`:

- Session startup sequence (load SOUL → USER → MEMORY → daily log)
- Tiered lookup protocol (Path A + Path B)
- Write-it-down rule (always persist to files, never "mental notes")

## Step 4: Set Up Backup (Optional)

Initialize git in your workspace and configure the backup script:

```bash
cd /path/to/your/workspace
git init
git remote add origin https://github.com/[you]/[your-backup-repo].git
```

Edit `scripts/auto-backup.sh`:
- Update `BASE_DIR`, `WORKSPACE_DIR`, `STATE_DIR` paths
- Update `TRACKER` path (or remove the token-tracker section if not using it)

## Step 5: Configure Token Tracker (Optional)

Edit `scripts/token-tracker.js`:
- Update `SESSIONS_PATH` to point to your platform's sessions file
- Update `HISTORY_DIR` to your preferred output location
- Add your cron job IDs to `JOB_MAP`

Test with: `node scripts/token-tracker.js --dry-run`

## Step 6: Set Up Cron Jobs (Optional)

Use `templates/cron-prompt.md` as a starting point for scheduled tasks. Key tasks to consider:

- **Memory review** (every 1-2 days): Scans daily logs, proposes knowledge extractions
- **Backup** (daily): Commits and pushes all changes to GitHub
- **Health check** (daily): Verifies system integrity

## Verification

After setup, your agent should be able to:
- [ ] Load MEMORY.md at session start and decode entities
- [ ] Write daily logs to `memory/daily/YYYY-MM/YYYY-MM-DD.md`
- [ ] Look up terms in glossary.md
- [ ] Create entity profiles in `memory/people/` or `memory/projects/`

## Next Steps

- Read `docs/01-core-architecture.md` for the design rationale
- Read `docs/04-entity-tracking.md` for the Supersede mechanism
- Read `docs/05-knowledge-pipeline.md` for the Clerk model
- Browse `examples/` for fully populated sample files
