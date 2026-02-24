# Tiered Lookup Protocol

> Two paths for finding information: deterministic (fast) and semantic (fuzzy).

## The Two Paths

Every lookup follows one or both paths depending on the query type:

**Path A — Deterministic Lookup (exact decoding)**
For: known entity decoding (abbreviations, nicknames, project codes), session startup loading

```
1. MEMORY.md (hot cache)         → Check here first, covers 90%
2. memory/glossary.md            → Not in hot cache? Check full decoder
3. memory/people/ | projects/    → Need details? Read entity profiles
4. memory/knowledge/             → Need technical knowledge? Read topic files
5. memory/context/ | post-mortems → Need environment/lessons? Read those
6. Ask the user                  → Nothing found? Learn the new term
```

**Path B — Semantic Search (fuzzy recall)**
For: recalling past events/decisions/discussions, "did we discuss X before" questions, cross-file associations

```
1. semantic_search(query)        → Fuzzy match, finds things even with different wording
                                   (OpenClaw: memory_search; alternatives: grep, embeddings)
2. read_snippet(path, lines)     → Pull full context from search results
                                   (OpenClaw: memory_get; alternatives: cat, head/tail)
3. Supplement with Path A        → Search not enough? Fill gaps with deterministic lookup
```

## When to Use Which

| Scenario | Path | Why |
|----------|------|-----|
| Decode abbreviation/nickname | A (deterministic) | Table exact match, zero latency |
| "Did we discuss X before?" | B (semantic) | Don't know which file, need fuzzy recall |
| "Status of project X?" | A first → B if needed | Hot cache has summary, search adds details |
| Context gathering before task | A + B in parallel | Decode entities + search related experience |
| After writing new memory | Neither | Index auto-updates, next search will find it |

## Key Principles

1. **Path A is the default.** Fast and deterministic, covers 90% of daily scenarios.
2. **Path B is the enhancement.** For fuzzy/cross-file/historical recall that Path A can't handle.
3. **Never use only one path for complex queries.** Simple decoding → Path A only. Complex questions → both paths.
4. **Semantic search returns snippets.** Always pull full context before acting on search results.

## Decode-First Protocol

Before executing any request, decode all entities first:
- Person names → Who is this?
- Abbreviations → What does this mean?
- Project codes → What project is this?

Unknown terms get searched/verified before execution. Never execute blindly on unresolved entities.

## Implementation Notes

The semantic search layer depends on your platform's capabilities:
- OpenClaw: `memory_search` (embedding-based) + `memory_get` (precise read)
- Claude Code / Codex: grep/ripgrep + file read
- Custom: embedding database (overkill for <500 files)

For most setups under 500 memory files, file-based search with good naming conventions is sufficient. The tiered lookup protocol works regardless of the search backend.
