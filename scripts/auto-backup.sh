#!/usr/bin/env bash
# auto-backup.sh — Git-based full backup for OpenClaw workspace
#
# Features:
# - Lock-based concurrency prevention
# - Runs token-tracker before diff check
# - AI-generated change summary (via BACKUP_SUMMARY env var)
# - Structured commit messages with file-level stats
#
# Usage: bash auto-backup.sh
# Cron: Set up as a daily cron job (e.g., 23:00 local time)
#
# Customize the paths below for your setup.

set -euo pipefail

# === Config (customize these) ===
BASE_DIR="${HOME}/.openclaw"
WORKSPACE_DIR="${BASE_DIR}"
STATE_DIR="${BASE_DIR}/gitclaw"
LOG_FILE="${STATE_DIR}/backup.log"
LOCK_DIR="${STATE_DIR}/lock"
TRACKER="${BASE_DIR}/workspace/scripts/token-tracker.js"

mkdir -p "${STATE_DIR}"

timestamp() { date -u '+%Y-%m-%dT%H:%M:%SZ'; }

# Prevent overlapping runs
if ! mkdir "${LOCK_DIR}" 2>/dev/null; then
  echo "$(timestamp) Skip: already running." >> "${LOG_FILE}"
  exit 0
fi
trap 'rmdir "${LOCK_DIR}" >/dev/null 2>&1 || true' EXIT

command -v git >/dev/null 2>&1 || { echo "$(timestamp) ERROR: git not found" >> "${LOG_FILE}"; exit 2; }

cd "${WORKSPACE_DIR}"

if [ ! -d .git ]; then
  echo "$(timestamp) ERROR: ${WORKSPACE_DIR} is not a git repo" >> "${LOG_FILE}"
  exit 3
fi

# Run token tracker BEFORE staging (so its output gets included)
if [ -f "${TRACKER}" ]; then
  echo "$(timestamp) Running token-tracker..." >> "${LOG_FILE}"
  node "${TRACKER}" >> "${LOG_FILE}" 2>&1 || echo "$(timestamp) WARN: token-tracker failed" >> "${LOG_FILE}"
fi

# Stage all changes (including token-tracker output)
git add -A

# Exit quietly if no changes
if git diff --cached --quiet; then
  echo "$(timestamp) No changes." >> "${LOG_FILE}"
  exit 0
fi

# Build commit body: file-level stats
STAT_SUMMARY=$(git diff --cached --stat | tail -1)

BODY=""
# Customize these directories for your workspace layout
for dir in workspace/data/exec-logs workspace/memory workspace/skills workspace/data config; do
  COUNT=$(git diff --cached --name-only -- "$dir" 2>/dev/null | wc -l)
  if [ "$COUNT" -gt 0 ]; then
    FILES=$(git diff --cached --name-only -- "$dir" 2>/dev/null | sed 's|.*/||' | head -5 | paste -sd ', ' -)
    [ "$COUNT" -gt 5 ] && FILES="${FILES}, ..."
    BODY="${BODY}${dir} (${COUNT}): ${FILES}\n"
  fi
done

OTHER=$(git diff --cached --name-only | grep -v -E '^(workspace/data/exec-logs|workspace/memory|workspace/skills|workspace/data|config)/' | wc -l || true)
if [ "$OTHER" -gt 0 ]; then
  OTHER_FILES=$(git diff --cached --name-only | grep -v -E '^(workspace/data/exec-logs|workspace/memory|workspace/skills|workspace/data|config)/' | sed 's|.*/||' | head -5 | paste -sd ', ' - || true)
  [ "$OTHER" -gt 5 ] && OTHER_FILES="${OTHER_FILES}, ..."
  BODY="${BODY}other (${OTHER}): ${OTHER_FILES}\n"
fi

BODY="${BODY}\n${STAT_SUMMARY}"

# Prepend AI-generated summary if provided via env var
# Your cron job or wrapper script generates the summary and sets this variable
# before calling auto-backup.sh. The script itself does NOT generate summaries.
if [ -n "${BACKUP_SUMMARY:-}" ]; then
  BODY="${BACKUP_SUMMARY}\n\n---\n${BODY}"
fi

# Commit with title + description body
git commit -m "backup: $(date -u +%Y-%m-%d)" -m "$(printf '%b' "$BODY")" >> "${LOG_FILE}" 2>&1
git push origin main >> "${LOG_FILE}" 2>&1

echo "$(timestamp) Backup OK." >> "${LOG_FILE}"
