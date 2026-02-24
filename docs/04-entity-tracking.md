# Entity Tracking & Supersede Mechanism

> Track how facts about people and projects evolve over time, without losing history.

## The Problem

Facts change. A project moves from "active" to "completed". A person changes roles. A configuration gets updated. If you just overwrite the old value, you lose the history of what changed and when.

## Solution: Atomic Facts + Supersede Chain

Each entity (person, project) gets a directory with two files:

```
memory/people/alice/
├── summary.md      ← Current snapshot (human/LLM reads this)
└── items.json      ← Atomic fact chain (tracks all changes)
```

### items.json Schema

```json
{
  "entity": "alice",
  "type": "person",
  "items": [
    {
      "id": "alice-001",
      "fact": "Frontend engineer, joined 2025",
      "category": "identity",
      "timestamp": "2025-06-15",
      "source": "conversation:session-abc123",
      "status": "active",
      "supersededBy": null
    },
    {
      "id": "alice-002",
      "fact": "Working on Project Alpha",
      "category": "status",
      "timestamp": "2025-07-01",
      "source": "log:2025-07-01",
      "status": "superseded",
      "supersededBy": "alice-004"
    },
    {
      "id": "alice-003",
      "fact": "Prefers async communication",
      "category": "preference",
      "timestamp": "2025-07-10",
      "source": "conversation:session-def456",
      "status": "active",
      "supersededBy": null
    },
    {
      "id": "alice-004",
      "fact": "Moved to Project Beta as tech lead",
      "category": "status",
      "timestamp": "2025-09-01",
      "source": "log:2025-09-01",
      "status": "active",
      "supersededBy": null
    }
  ]
}
```

### Field Reference

| Field | Description |
|-------|-------------|
| `id` | `{entity}-{NNN}`, globally unique, incrementing |
| `fact` | One atomic fact, cannot be split further |
| `category` | `identity` \| `status` \| `relationship` \| `milestone` \| `preference` \| `decision` \| `config` |
| `timestamp` | When the fact was established (YYYY-MM-DD) |
| `source` | Where the fact came from: `conversation:{key}` \| `log:{date}` \| `cron:{job}` \| `migration:{file}` |
| `status` | `active` \| `superseded` \| `historical` |
| `supersededBy` | Points to the replacing fact's id, null if current |

### Category Guide

| Category | Use for |
|----------|---------|
| `identity` | Name, role, contact info, accounts |
| `status` | Current state, what they're working on |
| `relationship` | Connections to other entities |
| `milestone` | Completed achievements, key dates |
| `preference` | Working style, communication preferences |
| `decision` | Choices made, directions set |
| `config` | Technical configuration (API keys location, ports, etc.) |

When in doubt, use `status` — it has the broadest coverage.

### Supersede Rules

1. **New fact contradicts old fact** → Old fact gets `status: "superseded"` + `supersededBy: "new-id"`
2. **Never delete facts** — superseded facts preserve the full history chain
3. **`historical`** is for facts that are no longer relevant but don't contradict anything (e.g., completed project milestones)

### Atomic Fact Granularity

One fact = one piece of information. Don't compress multiple facts into comma-separated lists.

```
❌ "Values: accumulation > novelty, transparency, data sovereignty"  ← 3 facts in 1
✅ Separate each value/decision/preference into its own fact item
```

Why: coarse granularity makes it impossible to supersede a single piece of information without touching unrelated facts.

## summary.md

Auto-generated from `items.json` by the review process. Humans and LLMs read this file for quick context.

```markdown
<!-- auto-generated from items.json, do not edit manually -->
# Alice

Frontend engineer, joined 2025. Currently tech lead on Project Beta.
Prefers async communication.
```

**Fidelity principle**: summary must preserve the full semantic detail of every active fact. If a fact says "requires specific paths, line numbers, parameter values", the summary must include those specifics — no compression or abbreviation.

## Compatibility

- `knowledge/`, `context/`, `post-mortems.md` stay as plain Markdown — they're not entities, they don't need fact tracking
- Low-frequency entities (appeared 1-2 times) can stay as single `.md` files — no forced migration
- Migration priority: active entities first, inactive entities on-demand
