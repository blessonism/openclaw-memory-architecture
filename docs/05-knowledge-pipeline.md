# Knowledge Pipeline (Clerk Model)

> How knowledge gets extracted from daily work and persisted — without burdening the main agent.

## The Problem

During work, the agent makes decisions, discovers patterns, and learns lessons. These are valuable long-term. But if the agent has to stop and think "should I tag this as knowledge?" during every task, it:
1. Slows down the hot path
2. Gets forgotten under cognitive load
3. Produces inconsistent tagging quality

## Solution: The Clerk Model

Inspired by Brooks' "The Mythical Man-Month" — the surgical team's program clerk who maintains all documentation while the surgeon focuses on surgery.

```
Main Agent (surgeon)          Review Process (clerk)
─────────────────────         ──────────────────────
Execute tasks                 Scan daily logs
Write daily logs              Identify 5 signal types:
  (zero extra effort)           - Design decisions
                                - Reusable experiences
                                - New terminology
                                - Entity changes
                                - Repeated patterns
                              Generate proposals
                              Human reviews & approves
                              Changes land in memory/
```

### Core Principle

**Zero hot-path burden.** The main agent never does meta-cognitive tagging during task execution. It just writes clear daily logs. The clerk (a separate review process) handles all knowledge extraction.

## The Five Signal Types

The review process scans daily logs looking for:

| Signal | Example | Destination |
|--------|---------|-------------|
| Design decision | "We chose X over Y because Z" | `knowledge/fw-design-decisions.md` |
| Reusable experience | "This pattern works well for..." | `knowledge/pat-*.md` or `knowledge/ref-*.md` |
| New terminology | First use of an internal term | `glossary.md` + maybe MEMORY.md |
| Entity change | Project status change, new person | `people/` or `projects/` items.json |
| Repeated pattern | Same operation done 3+ times | Skill candidate proposal |

## Review Process Flow

```
1. Scan recent daily logs (since last review)
2. For each identified signal:
   a. Extract the key information
   b. If daily log is too brief, pull original conversation via session history
   c. Classify confidence: high / medium / low
3. Generate structured proposals (JSON format)
4. Push proposals for human review
5. Human approves → main session executes changes
6. Human rejects → proposal archived with reason
```

### Proposal Format

```json
{
  "type": "design_decision",
  "confidence": "high",
  "source": "daily/2025-07/2025-07-15.md",
  "content": {
    "decision": "Use file-based search instead of vector DB",
    "rationale": "Under 500 files, grep + good naming is sufficient",
    "date": "2025-07-15"
  },
  "destination": "knowledge/fw-design-decisions.md",
  "action": "append"
}
```

## Why Human-in-the-Loop

Memory is a core asset. Automated modification risks:
- False positives (misidentified "decisions" that were just musings)
- Overwriting nuanced context with simplified summaries
- Accumulating low-quality entries that degrade search quality

The clerk proposes, the human decides. Quality over automation.

## Degradation Modes

| Scenario | Handling |
|----------|----------|
| Session history unavailable (compacted/cleared) | Extract from daily log context, mark confidence as low |
| Daily log too brief | Mark low confidence, suggest main session supplement |
| Review process fails | Daily logs are preserved — no data loss, just delayed extraction |

## Implementation

This can be implemented as:
- A cron job running every 1-2 days
- A manual review triggered by the user
- A heartbeat task that checks periodically

The key is separation: the review process runs in its own session, reads daily logs as input, and produces proposals as output. It never modifies memory files directly.

## Design Decision Persistence

Design decisions get their own index file (`knowledge/fw-design-decisions.md`) with a lightweight format:

```markdown
### DD-001: [Decision Title]
- Date: YYYY-MM-DD
- Decision: [What was decided]
- Rationale: [Why]
- Rejected alternatives: [What was considered and rejected]
- Source: [daily log reference]
```

This ensures cross-session conceptual consistency — new sessions can check "was this already decided?" before re-debating settled questions.
