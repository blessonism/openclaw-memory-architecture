# OpenClaw Memory Architecture

> A battle-tested memory system for AI agents that need to remember across sessions.

## The Problem

AI agents wake up fresh every session. No memory of yesterday's decisions, last week's debugging session, or the user's preferences. Most "memory" solutions are either too simple (a single file that grows forever) or too complex (vector databases that lose context).

## Our Approach

A two-layer file-based memory system, refined over months of daily use with [OpenClaw](https://github.com/openclaw/openclaw):

```
MEMORY.md (hot cache, ~50 lines)     ← Covers 90% of daily decoding
memory/ (deep storage, unlimited)     ← Covers the rest + full history
```

**Hot cache** for instant context loading. **Deep storage** for everything else. Simple files, no database, fully version-controllable.

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              AI Agent (Main Session)              │
│                                                   │
│  Session Start:                                   │
│    1. Load MEMORY.md (hot cache)                  │
│    2. Load today's daily log                      │
│    3. Ready to work in seconds                    │
│                                                   │
│  During Work:                                     │
│    - Path A: Deterministic lookup (known terms)   │
│    - Path B: Semantic search (fuzzy recall)       │
│                                                   │
│  Session End:                                     │
│    - Write daily log                              │
│    - Update entity files if needed                │
│    - Hot cache auto-maintains via promotion rules │
└─────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────┐    ┌──────────────────┐
│  MEMORY.md  │    │    memory/       │
│  (hot cache)│    │  (deep storage)  │
│  ~50 lines  │    │  glossary.md     │
│  Tables     │    │  people/         │
│  Quick scan │    │  projects/       │
│             │    │  knowledge/      │
│             │    │  daily/          │
│             │    │  post-mortems.md │
└─────────────┘    └──────────────────┘
```

## Key Design Decisions

1. **Two layers, not one.** A single file can't serve both fast decoding and deep retrieval. Hot cache handles 90% of lookups; deep storage handles the rest.

2. **Files over databases.** Plain Markdown + JSON. Git-friendly, human-readable, zero infrastructure. Your memory survives platform migrations.

3. **Supersede, never delete.** When facts change, old facts get marked `superseded` with a pointer to the new fact. Full history preserved, no data loss.

4. **Tiered lookup protocol.** Path A (deterministic) for known entities. Path B (semantic search) for fuzzy recall. Complex queries use both.

5. **Promotion/demotion.** Used 3+ times this week → promote to hot cache. Unused for 30 days → demote to deep storage only. Hot cache stays lean.

6. **Clerk model for knowledge capture.** The main agent doesn't do meta-cognitive tagging during work. A separate review process scans daily logs and proposes knowledge extractions. Human approves before changes land.

## Directory Structure

```
.
├── README.md                          ← You are here
├── docs/
│   ├── 01-core-architecture.md        ← Two-layer design + rationale
│   ├── 02-memory-layout.md            ← File structure + schemas
│   ├── 03-lookup-protocol.md          ← Tiered lookup (Path A + B)
│   ├── 04-entity-tracking.md          ← Supersede mechanism + items.json
│   ├── 05-knowledge-pipeline.md       ← Clerk model + review process
│   ├── 06-cron-automation.md          ← Scheduled tasks + delivery
│   ├── 07-execution-transparency.md   ← Exec logs + dashboards
│   ├── 08-backup-system.md            ← Git-based backup
│   ├── 09-task-management.md          ← Linear integration
│   ├── 10-post-mortems.md             ← Learning from failures
│   └── 11-data-flow.md               ← System-wide data flow
├── templates/
│   ├── MEMORY.md                      ← Hot cache template
│   ├── AGENTS.md                      ← Agent behavior protocol
│   ├── items.json                     ← Entity fact tracking schema
│   ├── daily-log.md                   ← Daily log template
│   ├── knowledge-file.md             ← Knowledge file template
│   ├── post-mortems.md               ← Post-mortem template
│   └── cron-prompt.md                ← Cron task prompt template
├── scripts/
│   ├── token-tracker.js              ← Zero-LLM token usage tracker
│   └── auto-backup.sh                ← Git backup script
└── examples/
    ├── MEMORY.md                      ← Populated hot cache example
    └── memory/                        ← Full directory example
        ├── glossary.md
        ├── daily/
        ├── people/
        ├── projects/
        ├── knowledge/
        ├── context/
        └── post-mortems.md
```

## Quick Start

1. Copy `templates/` into your OpenClaw workspace
2. Rename and customize `MEMORY.md` with your entities
3. Set up `memory/` directory structure
4. Add the lookup protocol to your agent's system prompt (see `templates/AGENTS.md`)
5. Optionally set up cron jobs for automated review and backup

## Design Philosophy

- **Accumulation > novelty.** Each feature has alternatives, but centralized accumulation is the compound interest.
- **Transparency.** No silent automation. Every automated task produces a visible report.
- **Data sovereignty.** Local files, git backup, no platform lock-in.
- **Depth > breadth.** One deep analysis beats ten shallow summaries.

## Origin

This system evolved through daily use over several months, starting from Anthropic's `knowledge-work-plugins` concept and iterating based on real failures (see `docs/10-post-mortems.md`). Every design decision has a story behind it.

## License

MIT
