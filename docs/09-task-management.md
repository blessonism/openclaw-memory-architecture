# Task Management

> Using an external task tracker as the single source of truth for task state.

## Why Not Files?

Early attempts used Markdown files (e.g., `WORKBENCH.md`) to track tasks. Problems:
- Multiple state sources (file + conversation + memory) drift apart
- No UI for quick scanning
- No timestamps or audit trail
- Manual status updates get forgotten

## Single Source of Truth

Use a dedicated task tracker (we use Linear, but any tool works) as the only place for task state. Memory files record events, not status.

```
Task Tracker: "VIB-42 is In Progress"     ← Source of truth
Daily Log: "Started working on VIB-42"     ← Event record
MEMORY.md: "Project Alpha | Active"        ← Summary pointer
```

## Task Lifecycle

Seven stages, each with a clear trigger:

```
① Identify  → Is this a task? (needs >2-3 steps, or not doing it now)
② Register  → Create issue with title + description
③ Start     → Mark In Progress, record plan/reason
④ Execute   → Work on it, record breakpoints at key milestones
⑤ Complete  → Mark Done, with specific completion notes
⑥ Archive   → Update daily log + project memory
⑦ Block     → If stuck, mark blocked with reason (don't let it sit silently)
```

### Completion Notes Standard

When marking a task done, the note should be specific enough that someone reading it knows exactly what was delivered:
- Which files were changed
- Commit hash (if applicable)
- Test results
- Memory updates made

"Done" is not a completion note. "Refactored search-layer, pushed commit abc123, updated memory/projects/search-layer/" is.

## WIP Limits

- One-time tasks (non-ops): max 1 In Progress at a time
- Ops/maintenance tasks: no WIP limit (they're ongoing by nature)

This forces focus. Start one thing, finish it, then start the next.

## Session Startup

When starting a new session:
1. Check for In Progress tasks
2. If found → read latest comment, report the breakpoint to user
3. If none → start fresh

This prevents "orphaned" tasks that were started but never finished.

## Breakpoint Comments

For complex tasks, record breakpoints at key milestones:

```markdown
## Breakpoint: Step 2/4 complete

**Done so far:**
- Implemented search module
- Added tests (all passing)

**Next:**
- Integration with main pipeline
- Update documentation

**Design note:**
Chose approach B over A because [reason].
Tried approach C but abandoned — [why].

**Open questions:**
- Should we support pagination? (waiting for user input)
```

This is insurance against session interruptions. A new session can pick up exactly where the old one left off.

## Project Closure Rule

When a project's status changes (started/completed/paused/abandoned), synchronize:
1. Update `memory/projects/{name}/items.json` (new fact or supersede old)
2. Rewrite `summary.md`
3. Update `MEMORY.md` Projects table

Missing any step = project not properly closed.
