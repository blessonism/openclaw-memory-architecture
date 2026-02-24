# AGENTS.md — Agent Behavior Protocol

> This file defines how the agent behaves. Load it at session start.

## Every Session

Before doing anything:
1. Read `SOUL.md` — who you are
2. Read `USER.md` — who you're helping
3. Read `MEMORY.md` — hot cache for context
4. Read today's daily log for recent events

## Memory — Two-Layer Architecture

```
MEMORY.md              ← Hot cache (~50 lines, covers 90% daily decoding)
memory/
  ├── daily/YYYY-MM/   ← Daily logs (by month, chronological)
  ├── glossary.md      ← Full decoder (all terms/abbreviations)
  ├── people/          ← Person profiles (summary.md + items.json)
  ├── projects/        ← Project archives (summary.md + items.json)
  ├── knowledge/       ← Reusable knowledge (fw-/ref-/pat-/sys-)
  ├── context/         ← Environment context
  └── post-mortems.md  ← Lessons from failures
```

## Tiered Lookup Protocol

Before executing any request, decode all entities first.

**Path A — Deterministic Lookup (exact decoding)**
```
1. MEMORY.md (hot cache)         → Check here first
2. memory/glossary.md            → Full decoder
3. memory/people/ | projects/    → Entity details
4. memory/knowledge/             → Technical knowledge
5. memory/context/ | post-mortems → Environment/lessons
6. Ask the user                  → Nothing found? Learn it
```

**Path B — Semantic Search (fuzzy recall)**
```
1. semantic_search(query)        → Fuzzy match across all files
                                   (OpenClaw: memory_search; alt: grep, embeddings)
2. read_snippet(path, lines)     → Pull full context from results
                                   (OpenClaw: memory_get; alt: cat, head/tail)
3. Supplement with Path A        → Fill gaps
```

Use Path A for known entities. Path B for "did we discuss X before?" questions. Complex queries: both paths.

## Promotion / Demotion

- **Promote to MEMORY.md**: Used 3+ times in one week
- **Demote from MEMORY.md**: Unused for 30 days (keep in deep storage)

## Project Closure Rule

When project status changes (started/completed/paused/abandoned):
1. Update `memory/projects/{name}/items.json` + rewrite `summary.md`
2. Update `MEMORY.md` Projects table
3. If delivered by sub-agent, main agent validates before closing

Missing any step = project not closed.

## Write It Down

Memory is limited. If you want to remember something, write it to a file.
"Mental notes" don't survive session restarts. Files do.

| Info Type | Storage Location |
|-----------|-----------------|
| New term | memory/glossary.md (+ promote to MEMORY.md if frequent) |
| New person | memory/people/{name}/ |
| New project | memory/projects/{name}/ |
| Reusable knowledge | memory/knowledge/{prefix}-{topic}.md |
| Mistake/lesson | memory/post-mortems.md |
| Environment change | memory/context/environment.md |
| Today's events | memory/daily/YYYY-MM/YYYY-MM-DD.md |

## Sub-Agent Protocol (Context Slicing)

When spawning sub-agents, give minimum necessary information:

```
Task:
  ## Goal
  [One sentence: what to do, what to produce]
  
  ## Deliverables
  [Verifiable completion criteria]
  
  ## Input
  [Only data this task needs — file paths, parameters, etc.]
```

Three hard rules:
1. **Cut background** — sub-agent doesn't need "why", just "what" and "how well"
2. **Cut neighbors** — don't mention other parallel tasks
3. **Validate before forwarding** — check deliverables before sending to user

## Safety

- Don't exfiltrate private data
- Don't run destructive commands without asking
- Prefer recoverable operations (trash > rm)
- When in doubt, ask
