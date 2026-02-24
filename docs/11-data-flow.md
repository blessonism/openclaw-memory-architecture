# Data Flow

> How information moves through the system: four loops that keep everything running.

## Loop 1: Daily Interaction

The primary loop — user talks to agent, agent does work, writes logs.

```
User message
  → Main Session processes request
    → Writes daily log (memory/daily/YYYY-MM/YYYY-MM-DD.md)
    → Updates entity files if needed (people/, projects/)
    → Updates hot cache if needed (MEMORY.md)
  → Responds to user

For complex tasks:
  → Dispatcher breaks into 2-5 steps
    → Spawns sub-agents (Context Slicing)
      → Each sub-agent gets: goal + deliverables + input only
      → Returns result
    → Main agent validates (Quality Gate)
    → Forwards to user
```

## Loop 2: Information Patrol

Scheduled tasks that bring external information into the system.

```
Cron trigger (e.g., 2x/day)
  → Isolated session starts
    → Scans external sources (forums, communities, feeds)
    → Filters signal from noise
    → Writes execution log (data/exec-logs/)
    → Pushes exec-log to GitHub (instant push)
    → Sends report to user's channel
  → Session ends
```

Key: patrol sessions are isolated. They can't access main session context or admin tools. Reports are self-contained.

## Loop 3: Knowledge Distillation

The clerk model — extracting lasting knowledge from daily work.

```
Main agent writes daily logs (Loop 1)
  → Review process scans logs (every 1-2 days)
    → Identifies: decisions, patterns, terminology, entity changes
    → Generates structured proposals
    → Pushes proposals for human review
  → Human approves
    → Main session executes approved changes
      → Updates knowledge/, glossary.md, people/, projects/
      → Updates MEMORY.md if promotion criteria met
```

This loop is intentionally slow. Knowledge extraction is a cold-path activity — quality matters more than speed.

## Loop 4: Backup & Persistence

Ensuring everything survives infrastructure failures.

```
Daily backup trigger (e.g., 23:00)
  → Run token-tracker (compute usage stats)
  → git add -A (all workspace changes)
  → Check diff — skip if no changes
  → Generate AI change summary
  → Commit with structured message
  → Push to GitHub
```

Plus instant push for execution logs (Loop 2 triggers this after each patrol).

## How the Loops Connect

```
Loop 1 (Daily Work)
  │ produces daily logs
  ▼
Loop 3 (Knowledge Distillation)
  │ extracts lasting knowledge
  ▼
Loop 4 (Backup)
  │ persists everything to GitHub
  
Loop 2 (Patrols)
  │ brings external info
  ▼
Loop 1 (feeds into daily work context)
```

## Sub-Agent Protocol

When the main agent spawns sub-agents (in Loop 1):

**Context Slicing** — give minimum necessary information:
- ✅ Goal + deliverables + input data
- ❌ Project history, other task status, "nice to know" background

**Three hard rules:**
1. Cut background — sub-agent doesn't need to know "why"
2. Cut neighbors — don't mention other parallel tasks
3. Validate before forwarding — check deliverables before sending to user

**Concurrency limits:**
- Independent tasks: 4-6 parallel
- Cross-referencing tasks: 2-3 parallel
- Beyond 6: rate limit collisions + context pollution risk

## Heartbeat

A periodic check-in (every ~30 minutes) that:
- Checks for urgent messages/notifications
- Runs lightweight health checks (cron status, etc.)
- Updates dashboard if needed
- Does background maintenance (memory cleanup, etc.)

Rules:
- Quiet hours: respect sleep time, don't alert unless urgent
- Useful but not annoying: a few checks per day, meaningful background work
- If nothing needs attention: silent acknowledgment, no noise
