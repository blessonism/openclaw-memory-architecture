# Memory Layout

> File structure, naming conventions, and schemas.

## Directory Structure

```
workspace/
├── MEMORY.md              ← Hot cache (~50 lines)
├── AGENTS.md              ← Agent behavior protocol
├── SOUL.md                ← Agent personality
├── USER.md                ← User profile
└── memory/
    ├── glossary.md        ← Term decoder (all abbreviations/jargon)
    ├── people/
    │   └── {name}/
    │       ├── summary.md  ← Current snapshot (human-readable)
    │       └── items.json  ← Atomic fact chain (machine-readable)
    ├── projects/
    │   └── {name}/
    │       ├── summary.md
    │       └── items.json
    ├── knowledge/
    │   ├── README.md       ← Index + prefix conventions
    │   ├── fw-*.md         ← Frameworks & methodologies
    │   ├── ref-*.md        ← Technical references
    │   ├── pat-*.md        ← Design patterns
    │   └── sys-*.md        ← System self-reflection
    ├── context/
    │   └── environment.md  ← Deployment, tools, infrastructure
    ├── daily/
    │   └── YYYY-MM/
    │       └── YYYY-MM-DD.md
    └── post-mortems.md     ← Lessons from failures
```

## MEMORY.md Format

Tables, not prose. Each section is a quick-scan table with a pointer to deep storage.

```markdown
# Memory — Hot Cache

## People
| Who | Identity |
|-----|----------|
| **Boss** | [name], system owner, [platform] user |

→ Full profiles: memory/people/

## Terms
| Term | Meaning |
|------|---------|
| CST | China Standard Time (UTC+8) |

→ Full decoder: memory/glossary.md

## Projects
| Project | Status |
|---------|--------|
| **Project Alpha** | Active, Phase 2 |

→ Details: memory/projects/

## Preferences
- Default timezone: [timezone]
- Reports pushed to [channel], not just saved to files
- All automation must produce visible output

## Protocols
1. Entity verification — unknown terms get searched first, never blind execution
2. Write it down — if you want to remember it, write it to a file
```

## Knowledge File Naming

Prefix convention for `memory/knowledge/`:

| Prefix | Category | Example |
|--------|----------|---------|
| `fw-` | Frameworks & methodologies | `fw-design-decisions.md` |
| `ref-` | Technical references | `ref-llm-infrastructure.md` |
| `pat-` | Design patterns | `pat-cron-delivery.md` |
| `sys-` | System self-reflection | `sys-system-overview.md` |

Why prefixes instead of subdirectories: with <20 files, flat + prefix is easier to scan than nested folders. Revisit when file count exceeds ~30.

## Daily Log Format

```markdown
# YYYY-MM-DD (Day)

## [Topic 1]
- What happened
- Key decisions made
- Files changed

## [Topic 2]
...
```

Daily logs are raw material. They capture events as they happen. Knowledge extraction happens later via the review process (see `05-knowledge-pipeline.md`).

## Glossary Format

```markdown
# Glossary

## Abbreviations
| Term | Meaning | Context |
|------|---------|---------|
| CST | China Standard Time (UTC+8) | Default timezone |

## Internal Terms
| Term | Meaning |
|------|---------|
| hot cache | High-frequency info in MEMORY.md |
| deep storage | Full archives in memory/ directory |

## Nicknames
| Nickname | Maps to |
|----------|---------|
| Boss | [user's name] |
```
