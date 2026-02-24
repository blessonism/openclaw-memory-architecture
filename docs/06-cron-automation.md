# Cron Automation

> Scheduled tasks that keep the system alive: patrols, reviews, backups, health checks.

## Task Overview

A typical setup includes these recurring tasks:

| Task | Frequency | Purpose | Category |
|------|-----------|---------|----------|
| Community patrol | 2x/day | Scan forums/communities for relevant content | Input |
| Memory review | Every 2 days | Scan daily logs → generate knowledge proposals | Core |
| Daily backup | Daily | Git full backup + change summary | Persistence |
| Health check | Daily | Security audit | Maintenance |
| Dependency tracker | Weekly | Check for outdated dependencies | Maintenance |

## Delivery Best Practices

**Don't use `delivery.mode: "announce"` for long content.** It's unreliable for messages >4096 characters and fails silently.

Instead:
```json
{
  "delivery": { "mode": "none" },
  "payload": {
    "kind": "agentTurn",
    "message": "... include delivery rules in the prompt ..."
  }
}
```

The agent sends reports directly via messaging tools, with explicit error handling and retry logic.

### Prompt Delivery Template

```
## Delivery Rules (mandatory)
After completing the report, send it via the message tool.
- target: [chat_id]
- threadId: [thread_id]
If the report exceeds 3800 characters, split into multiple messages.
Each chunk must be semantically complete (don't break URLs or formatting).
If sending fails, retry once. If still failing, output the error — never exit silently.
```

## Defensive Rules (All Tasks)

These rules prevent race conditions and silent failures:

1. **Synchronous blocking execution.** Never pass `background` parameter. The task must complete before reading output files.

2. **Atomic writes.** Write to `.tmp` file first → `mv` to final path. Readers never see half-written files.

3. **Sufficient timeout.** Leave generous margin. A task that usually takes 2 minutes should have a 5-minute timeout.

4. **Don't read output before process exits.** Hard rule. Eliminates the race window between write and read.

5. **Idempotent keys.** Use `runId + contentHash` to ensure retry safety.

### The Race Condition Story

Real failure mode: cron triggers a long task → agent reads the output file before the task finishes → gets empty content → silently exits with "nothing to report". The task actually succeeded, but the report was lost.

Fix: rules 1 and 4 above. Synchronous execution + never read before exit.

## Cron Prompt Versioning

Store cron prompts as files (source of truth), not inline in job configurations:

```
cron-prompts/
├── README.md                    ← Management hub
├── SYNC-PROTOCOL.md             ← File → runtime sync procedure
├── community-patrol.md          ← Patrol prompt
├── memory-review.md             ← Review prompt
├── daily-backup.md              ← Backup prompt
└── dependency-tracker.md        ← Dependency check prompt
```

**Core principle:** `.md` files are the source of truth. Never modify runtime prompts directly — always edit the file, then sync to runtime.

## Isolated Session Constraints

Cron tasks run in isolated sessions with limited tool access:

**Available:** read, write, edit, exec, process, web_search, web_fetch, browser, message, tts
**NOT available:** session_status, cron management, memory_search, memory_get, and other admin tools

Design your cron prompts accordingly. Don't reference tools that aren't available in isolated sessions.
