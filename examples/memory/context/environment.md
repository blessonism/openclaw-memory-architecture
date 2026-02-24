# Environment Context

## Deployment

| Component | Location | Notes |
|-----------|----------|-------|
| OpenClaw Agent | Docker container (2H/8G) | Main service |
| Sandbox Browser | Internal DNS | CDP port 9222 |
| GitHub Backup | [github-user]/[backup-repo] | Full workspace backup |

## Tools

| Tool | Purpose |
|------|---------|
| Telegram | Primary communication channel |
| GitHub | Code hosting + backup |
| Brave Search | Web search API |
| Linear | Task management |

## File System

```
~/.openclaw/
├── workspace/           ← Agent's working directory
│   ├── MEMORY.md
│   ├── AGENTS.md
│   ├── SOUL.md
│   ├── USER.md
│   ├── memory/
│   ├── scripts/
│   ├── skills/
│   └── data/
├── agents/main/sessions/ ← Session data
├── cron/jobs.json        ← Cron job definitions
└── openclaw.json         ← Main config
```
