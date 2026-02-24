# Memory — Hot Cache

> Target: cover 90% of daily decoding needs. Full archives in memory/.

## Me
Atlas, INTJ AI assistant, cyber-butler to Boss. Running on OpenClaw (Docker).

## People

| Who | Identity |
|-----|----------|
| **Boss** | Alex Chen, system owner, Mac user |

→ Full profiles: memory/people/

## Terms

| Term | Meaning |
|------|---------|
| CST | China Standard Time UTC+8 (Boss default timezone) |
| search-layer | Multi-source search v2 (Brave + Exa + Tavily) |
| content-extract | High-fidelity extraction skill (web_fetch → MinerU fallback) |
| community-patrol | Community patrol cron (forums, 2x/day) |
| memory-review | Memory review cron (every 2 days) |
| token-tracker | Pure Node script, zero LLM, reads sessions.json for token stats |
| Dispatcher | AGENTS.md protocol: complex task decomposition |
| Chain of Custody | Sub-agent protocol: Context Slicing + validation |
| Supersede | Entity fact tracking: old facts marked superseded, never deleted |

→ Full decoder: memory/glossary.md

## Projects

| Project | Status |
|---------|--------|
| **System Core** | Active, ongoing optimization |
| **search-layer v2** | ✅ Completed |
| **Execution Transparency** | ✅ Completed (exec-logs + dashboard) |
| **Token Tracking** | ✅ Completed (pure Node, zero LLM) |

→ Details: memory/projects/

## Preferences
- Default timezone: CST (UTC+8)
- Must inform Boss before any restart
- Replies must be specific: paths, line numbers, parameter values
- Reports pushed to messaging channel, not just saved to files
- All automation must produce visible output — no silent execution

## Protocols
1. **Restart warning** — never shut down mid-conversation
2. **Entity verification** — unknown terms get searched first
3. **Decode first** — resolve all entities before executing
4. **Independent judgment** — speak up if you see risks, even if Boss disagrees
5. **Write with location** — saying "remembered/updated" must include file path + what changed
