# OpenClaw Memory Architecture

一套经过实战验证的 AI Agent 记忆系统。解决 Agent 跨 session 失忆的问题。

[English version below](#english)

---

## 这个项目是什么

AI Agent 每次启动都是一张白纸——不记得昨天做了什么决策、上周踩了什么坑、用户有什么偏好。这是所有长期运行 Agent 的核心痛点。

现有的"记忆"方案要么太简单（一个无限增长的文件，越来越慢），要么太重（向量数据库，丢失上下文结构，运维成本高）。

这个项目提供了一个中间路线：**两层文件架构**，纯 Markdown + JSON，零基础设施依赖，Git 友好，经过数月日常使用打磨。

```
MEMORY.md (热缓存, ~50 行)     <- 覆盖 90% 日常解码
memory/ (深度存储, 无限扩展)    <- 覆盖剩余 10% + 完整历史
```

## 为什么不用现有方案

| 方案 | 问题 |
|------|------|
| 单文件记忆 (MEMORY.md only) | 文件越来越大，加载慢，信息密度下降，找东西靠运气 |
| 向量数据库 (Pinecone, Chroma) | 丢失文档结构，检索结果碎片化，需要额外基础设施，迁移困难 |
| 对话历史直接塞 context | token 成本爆炸，compaction 丢信息，无法跨 session |
| 平台内置记忆 (ChatGPT Memory) | 黑盒，不可控，不可迁移，容量有限 |

我们的方案：

| 特性 | 实现 |
|------|------|
| 快速启动 | 热缓存 ~50 行，表格格式，一眼扫完 |
| 深度检索 | 按类型分目录，确定性查找 + 语义搜索双路径 |
| 事实演变追踪 | Supersede 机制：旧事实标记替代，不删除，保留完整历史链 |
| 知识自动沉淀 | 程序职员模式：独立进程扫描日志，提取知识，人工审核后落地 |
| 零基础设施 | 纯文件，Markdown + JSON，不需要数据库 |
| 完全可控 | 本地文件，Git 备份，随时迁移，不锁定任何平台 |
| 执行透明 | 每个自动化任务产出可追溯的执行日志 |

## 核心设计

### 两层架构

热缓存（MEMORY.md）负责快速解码——Agent 醒来后几秒内就能理解"我是谁、用户是谁、在做什么"。深度存储（memory/）负责一切细节：人物档案、项目状态、技术知识、经验教训、每日事件流。

两层之间有自动晋升/降级机制：一周内使用 3 次以上的条目晋升到热缓存，30 天未使用的条目降级到深度存储。热缓存始终保持精简。

### 分层查找协议

两条路径按场景选择：

- 路径 A（确定性查找）：已知实体解码，从热缓存到术语表到档案目录，逐层查找，快且确定
- 路径 B（语义搜索）：模糊回忆，"我们之前讨论过 X 吗"类问题，跨文件关联

简单查询走路径 A，复杂问题两条都走。

### Supersede 机制

事实会变。项目从"进行中"变成"已完成"，人员换了角色，配置更新了。直接覆盖旧值会丢失历史。

我们的做法：每个实体（人物、项目）用 JSON 原子事实链追踪。新事实与旧事实矛盾时，旧事实标记为 `superseded` 并指向新事实。不删除任何记录，完整历史链可追溯。

```json
{
  "id": "alice-002",
  "fact": "Working on Project Alpha",
  "status": "superseded",
  "supersededBy": "alice-004"
}
```

### 程序职员模式

灵感来自 Brooks《人月神话》中的程序职员角色。

主 Agent 在执行任务时不做任何"这个要不要记下来"的元认知判断——只管把每日日志写清楚。一个独立的审查进程（程序职员）定期扫描日志，自动识别设计决策、可复用经验、新术语、实体变更、重复模式，生成结构化提案。人工审核通过后才写入记忆。

好处：主 Agent 零额外负担，知识沉淀不依赖"记得要标记"，审查质量由独立进程保证。

### 执行透明

所有自动化任务必须产出可见报告。不允许静默执行。

每个定时任务写结构化执行日志（元信息、执行步骤、关键决策、结果摘要），即时推送到 Git 仓库，报告末尾附可点击的日志链接。配合 token 追踪脚本（零 LLM 开销）和自动更新的仪表盘，实现完整的执行可追溯性。

## 目录结构

```
.
├── README.md                          <- 本文件
├── docs/
│   ├── 00-getting-started.md          <- 上手指南
│   ├── 01-core-architecture.md        <- 两层架构设计
│   ├── 02-memory-layout.md            <- 文件结构与 schema
│   ├── 03-lookup-protocol.md          <- 分层查找协议
│   ├── 04-entity-tracking.md          <- Supersede 机制
│   ├── 05-knowledge-pipeline.md       <- 程序职员模式
│   ├── 06-cron-automation.md          <- 定时任务与投递
│   ├── 07-execution-transparency.md   <- 执行日志与仪表盘
│   ├── 08-backup-system.md            <- Git 备份体系
│   ├── 09-task-management.md          <- 任务管理集成
│   ├── 10-post-mortems.md             <- 从失败中学习
│   └── 11-data-flow.md               <- 数据流全景
├── templates/                         <- 可直接使用的模板
│   ├── MEMORY.md                      <- 热缓存模板
│   ├── AGENTS.md                      <- Agent 行为协议
│   ├── SOUL.md                        <- Agent 人格模板
│   ├── USER.md                        <- 用户画像模板
│   ├── items.json                     <- 实体事实追踪 schema
│   ├── daily-log.md                   <- 每日日志模板
│   ├── knowledge-file.md              <- 知识文件模板
│   ├── post-mortems.md                <- 经验教训模板
│   └── cron-prompt.md                 <- 定时任务 prompt 模板
├── scripts/                           <- 辅助脚本（脱敏版）
│   ├── token-tracker.js               <- Token 用量追踪（零 LLM）
│   └── auto-backup.sh                 <- Git 全量备份
└── examples/                          <- 完整示例（脱敏数据）
    ├── MEMORY.md
    └── memory/
        ├── glossary.md
        ├── daily/
        ├── people/
        ├── projects/
        ├── knowledge/
        ├── context/
        └── post-mortems.md
```

## 快速开始

详见 [docs/00-getting-started.md](docs/00-getting-started.md)。简要步骤：

1. 复制 `templates/` 到你的工作区，将核心文件（MEMORY.md、AGENTS.md、SOUL.md、USER.md）移到根目录
2. 创建 `memory/` 目录结构：`daily/`、`people/`、`projects/`、`knowledge/`、`context/`
3. 自定义 SOUL.md（Agent 人格）、USER.md（用户画像）、MEMORY.md（初始实体）
4. 将 AGENTS.md 中的查找协议加入 Agent 的 system prompt
5. 可选：配置 `scripts/auto-backup.sh` 和 `scripts/token-tracker.js`（需先编辑路径和 job ID）
6. 参考 `examples/` 中的完整示例

## 适用场景

- 使用 OpenClaw、Claude Code、Codex 等平台运行长期 AI Agent
- 需要 Agent 跨 session 记住用户偏好、项目状态、技术决策
- 希望记忆系统透明可控，而非平台黑盒
- 重视数据主权，不想被锁定在某个平台

## 设计哲学

- 积淀大于新鲜感。各功能单独都有替代品，但集中沉淀才是质变。
- 透明可追溯。不信任黑盒，所有自动化必须有输出报告。
- 数据主权。本地文件，Git 备份，不锁定平台。
- 深度大于广度。一篇深度分析胜过十条浅层摘要。

## 项目背景

这套系统在 [OpenClaw](https://github.com/openclaw/openclaw) 上经过数月日常使用演化而来。最初参考了 Anthropic 的 `knowledge-work-plugins` 项目的分层记忆概念，之后根据实际失败不断迭代（见 [docs/10-post-mortems.md](docs/10-post-mortems.md)）。每个设计决策背后都有真实的踩坑故事。

虽然在 OpenClaw 上开发和验证，但架构本身是平台无关的——核心是 Markdown 文件 + 查找协议 + 知识沉淀流程，可以适配任何支持文件读写的 Agent 平台。

## License

MIT

---

<a id="english"></a>

## English

A battle-tested memory system for AI agents that need to remember across sessions.

Two-layer file-based architecture: a hot cache (MEMORY.md, ~50 lines) for instant context loading, and deep storage (memory/) for everything else. Plain Markdown + JSON, no database, fully Git-friendly.

Key features:
- Tiered lookup protocol (deterministic + semantic search)
- Supersede mechanism for fact evolution tracking (never delete, always trace)
- Clerk model for knowledge capture (separate review process, human-in-the-loop)
- Execution transparency (structured logs, instant push, dashboards)
- Zero infrastructure dependencies (files only, no vector DB)

See [docs/00-getting-started.md](docs/00-getting-started.md) to get started. Browse `examples/` for fully populated sample files.

Developed and validated on [OpenClaw](https://github.com/openclaw/openclaw), but the architecture is platform-agnostic — it works with any agent platform that supports file read/write.
