# Core Architecture

> Two-layer memory: fast decoding + deep retrieval, without compromise.

## The Core Contradiction

An AI agent's memory needs to serve two conflicting purposes simultaneously:

1. **Fast decoding**: Wake up and understand "who am I, who's the user, what am I working on" in seconds
2. **Deep retrieval**: Find a technical decision from weeks ago, or a lesson learned from a past failure

A single-layer approach fails at both. Too large → slow to scan. Too small → missing information.

## Two-Layer Solution

```
MEMORY.md (hot cache, ~50 lines)
├── People table (who's who)
├── Terms table (abbreviations, internal jargon)
├── Projects table (active + completed)
├── Preferences (user's working style)
└── Protocols (behavioral rules)
    → Each section points to deep storage: "Full details: memory/xxx"

memory/ (deep storage, unlimited)
├── glossary.md          ← Authoritative decoder for all terms
├── people/{name}/       ← Person profiles (summary.md + items.json)
├── projects/{name}/     ← Project archives (summary.md + items.json)
├── knowledge/{prefix}-* ← Reusable knowledge (fw-/ref-/pat-/sys-)
├── context/             ← Environment info (deployment, tools)
├── daily/YYYY-MM/       ← Daily event logs (by month)
│   └── YYYY-MM-DD.md
└── post-mortems.md      ← Lessons from failures
```

## Why This Works

**Hot cache** is designed for one-pass scanning:
- Table format (not prose) — eyes can jump to any row
- ~50 lines max — fits in a single context window load
- Every table has a pointer to deep storage for details

**Deep storage** is organized by type, not by time:
- `glossary.md` for term decoding (deterministic lookup)
- `people/` and `projects/` for entity tracking (with fact history)
- `knowledge/` for reusable insights (survives project completion)
- `daily/` for chronological events (raw material for review)
- `post-mortems.md` for failure lessons (prevents repeat mistakes)

## Promotion / Demotion

The hot cache stays lean through automatic lifecycle rules:

| Rule | Trigger | Action |
|------|---------|--------|
| Promote | Used 3+ times in one week | Add to MEMORY.md table |
| Demote | Unused for 30 days | Remove from MEMORY.md, keep in deep storage |

Goal: hot cache covers 90% of daily needs. Deep storage is the safety net.

## Security Boundary

- **Main session** (direct chat with user): Loads MEMORY.md — full context
- **Shared contexts** (group chats, other users): Does NOT load MEMORY.md — prevents personal data leakage
- **Sensitive identifiers** in `memory/people/` (emails, IDs, accounts): Never output in shared contexts

## Inspiration

The two-layer concept draws from Anthropic's `knowledge-work-plugins` project. Their code was all Markdown (low value), but the design pattern (tiered memory + promotion/demotion) was the real insight. We took the idea and built a production system around it.
