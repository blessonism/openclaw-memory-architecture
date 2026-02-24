# Learning from Failures

> Post-mortems are how the system gets smarter. Every failure is tuition — recording it is the return on investment.

## Philosophy

Failures are inevitable. Repeating the same failure is not. The post-mortem file is the cheapest insurance policy: write down what went wrong, why, and how to avoid it next time.

## Format

```markdown
## [Short Title] (YYYY-MM-DD)

**Scenario:** What were you trying to do?
**Problem:** What went wrong?
**Root cause:** Why did it go wrong?
**Fix:** What's the correct approach?
**Lesson:** What general principle does this teach?
```

## Categories of Failures We've Seen

### 1. Tool Misuse
Using the wrong tool, wrong parameters, or forgetting a tool exists.

Example: Spending 30 minutes building a notification system, only to realize the existing toolkit already had a `--notify` webhook callback.

Lesson: **Check the tool inventory before building.** Scan existing capabilities before designing new solutions.

### 2. Silent Failures
Something fails but produces no error — it just doesn't work.

Example: Cron delivery mode silently drops messages >4096 characters. Task "succeeds" but the user never sees the report.

Lesson: **Explicit error handling + never exit silently.** If sending fails, retry. If retry fails, output the error.

### 3. Context Drift
Forgetting what tools/context are available after a long session with many context switches.

Example: After 6 sub-tasks in one session, forgetting that the VPS toolkit has a specific script for the exact thing you're about to build from scratch.

Lesson: **Re-align context at each sub-task boundary.** Don't assume you remember everything from earlier in the session.

### 4. Incomplete Closure
Finishing the work but forgetting to update all the tracking systems.

Example: Code done, tests passing, pushed to GitHub — but forgot to close the Linear issue and update project memory.

Lesson: **Closure checklist: code → push → memory → task tracker.** Missing any step = not done.

### 5. Platform Assumptions
Assuming a tool/API works the same way in all contexts.

Example: `session_status` returns token counts in the main session but not in isolated sessions. Building a token tracking system on this assumption → all zeros.

Lesson: **Verify assumptions in the actual execution context.** What works in main session may not work in cron/sub-agent sessions.

## The Recording Reflex

When you hit a problem:
1. **Write it down** in `post-mortems.md` (scenario + root cause + fix)
2. **Tell the user** what you learned and where you wrote it
3. **Don't wait** to be asked — proactive recording is the whole point

Writing a lesson ≠ learning it. But not writing it guarantees you'll repeat it.

## From Post-Mortems to Patterns

When the same type of failure appears 3+ times, it's a pattern. Patterns graduate from post-mortems to `knowledge/pat-*.md` files with structured guidance.

Example: Multiple cron delivery failures → `knowledge/pat-cron-delivery.md` with the definitive best practice.

## Limitation: Recording ≠ Behavior Change

Post-mortems are passive storage. Writing "don't do X" doesn't prevent doing X next time under cognitive load. For critical recurring failures, you need process-level fixes:
- Checklists embedded in workflows
- Automated validation before execution
- Hard constraints in prompts/protocols

The post-mortem identifies the problem. The process fix prevents recurrence.
