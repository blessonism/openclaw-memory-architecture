# Post-Mortems / Lessons Learned

Learn from mistakes. Don't repeat them.

## Tool inventory check before building (2025-08-15)

**Scenario:** Needed a notification system for background tasks on the server.
**Problem:** Spent 30 minutes designing a file-based notification + polling system.
**Root cause:** Forgot the existing toolkit already had a `--notify` webhook callback.
**Fix:** Before building anything, scan the tool inventory first.
**Lesson:** Check existing capabilities before designing new solutions. Long sessions with many context switches cause "capability amnesia."

## Silent delivery failure (2025-07-20)

**Scenario:** Cron job completed successfully but user never received the report.
**Problem:** `delivery.mode: "announce"` silently dropped the message (>4096 chars).
**Root cause:** Announce delivery has known instability with long content + no error reporting.
**Fix:** Switch to `delivery.mode: "none"` + agent sends via message tool directly.
**Lesson:** Silent failures are the worst kind. Always have explicit error handling and never exit without confirming delivery.

## Incomplete project closure (2025-08-01)

**Scenario:** Finished a project — code done, tests passing, pushed to GitHub.
**Problem:** Forgot to close the Linear issue and update project memory files.
**Root cause:** No enforced closure checklist.
**Fix:** Closure = code → push → memory → task tracker. All four steps required.
**Lesson:** "Done" means all tracking systems are updated, not just the code.

## Platform assumption mismatch (2025-07-25)

**Scenario:** Built token tracking on the assumption that `session_status` returns token counts.
**Problem:** It does in main sessions, but returns nothing in isolated (cron) sessions.
**Root cause:** Assumed tools work identically across all session types.
**Fix:** Verify assumptions in the actual execution context before building on them.
**Lesson:** What works in main session may not work in cron/sub-agent sessions. Test in the target environment.
