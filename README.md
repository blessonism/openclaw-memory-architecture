# OpenClaw Memory Architecture

一套经过实战验证的 AI Agent 记忆系统。解决 Agent 跨 session 失忆的问题。

[English version below](#english)

---

## 这个项目是什么

AI Agent 每次启动都是一张白纸——不记得昨天做了什么决策、上周踩了什么坑、用户有什么偏好。这是所有长期运行 Agent 的核心痛点。

这个项目提供了一套完整的解决方案：**两层文件架构 + 分层查找协议 + 知识自动沉淀流程**，纯 Markdown + JSON，零基础设施依赖，Git 友好，经过数月日常使用打磨。

```
MEMORY.md (热缓存, ~50 行)     <- 覆盖 90% 日常解码
memory/ (深度存储, 无限扩展)    <- 覆盖剩余 10% + 完整历史
```

## 架构总览

```
                         ┌──────────────────────────────────────┐
                         │          AI Agent (主 Session)        │
                         │                                      │
                         │  启动:                                │
                         │    1. 加载 MEMORY.md (热缓存)         │
                         │    2. 加载当日日志                     │
                         │    3. 几秒内就绪                      │
                         │                                      │
                         │  工作中:                              │
                         │    路径 A: 确定性查找 (已知实体)       │
                         │    路径 B: 语义搜索 (模糊回忆)        │
                         │                                      │
                         │  结束:                                │
                         │    写入每日日志                       │
                         │    按需更新实体档案                   │
                         │    热缓存自动晋升/降级                │
                         └──────────┬──────────┬────────────────┘
                                    │          │
                    ┌───────────────┘          └───────────────┐
                    v                                          v
          ┌─────────────────┐                    ┌──────────────────────┐
          │   MEMORY.md     │                    │      memory/         │
          │   (热缓存)      │                    │    (深度存储)         │
          │                 │                    │                      │
          │  ~50 行表格     │  ── 晋升/降级 ──>  │  glossary.md  术语表  │
          │  People 表      │                    │  people/     人物档案 │
          │  Terms 表       │                    │  projects/   项目档案 │
          │  Projects 表    │                    │  knowledge/  知识库   │
          │  Preferences    │                    │  daily/      每日日志 │
          │  Protocols      │                    │  context/    环境信息 │
          └─────────────────┘                    │  post-mortems.md     │
                                                 └──────────────────────┘
                                                          |
                                                          v
                                                 ┌──────────────────┐
                                                 │  程序职员 (审查)   │
                                                 │  定期扫描日志      │
                                                 │  提取知识 -> 提案  │
                                                 │  人工审核 -> 落地  │
                                                 └──────────────────┘
```

## 与同类方案的深度对比

AI Agent 记忆是 2025-2026 年的热门赛道。从 Mem0 到 Letta/MemGPT，从 Zep 的时序知识图谱到 Claude Code 的 CLAUDE.md，方案很多。但它们解决的问题侧重点不同，适用场景也不同。

### 记忆方案光谱

当前的 Agent 记忆方案大致分布在一条光谱上：

```
简单                                                              复杂
 |                                                                  |
 单文件        文件分层        向量检索        知识图谱        混合架构
 CLAUDE.md     本项目         Mem0/LangMem    Zep/Graphiti    Letta/MemGPT
```

越往左，越简单、越可控、越便宜，但能力有限。越往右，能力越强，但复杂度、成本和锁定风险也越高。

### 逐一对比

**CLAUDE.md / 单文件方案**

Claude Code 的 CLAUDE.md 是最简单的记忆方案：一个 Markdown 文件，每次 session 加载。社区里很多人也用类似的单文件方案。

- 优势：零配置，人人都能用
- 问题：文件增长不可控（Claude Code 社区报告一个 "hi" 消息就消耗 53K tokens），没有查找协议（全靠 LLM 自己在长文本里找），没有事实演变追踪（覆盖即丢失），没有知识沉淀流程（全靠人手动维护）
- 我们的差异：两层分离解决了增长问题（热缓存始终 ~50 行），分层查找协议解决了检索问题，Supersede 机制解决了事实追踪问题，程序职员模式解决了知识沉淀问题

**Mem0**

Mem0 是目前融资最多、最受关注的 Agent 记忆平台。它从对话中自动提取"记忆"，存入向量数据库 + 可选知识图谱，按用户/session/agent 三级组织。

- 优势：自动提取，无需手动维护；语义检索能力强；有托管服务，开箱即用
- 问题：黑盒提取（你不知道它提取了什么、遗漏了什么）；向量检索丢失文档结构（检索结果是碎片，不是有组织的知识）；依赖外部基础设施（向量数据库 + embedding API）；数据锁定在平台内；每次检索有成本（embed + rerank + LLM，约 $0.002-0.01/query）
- 我们的差异：完全透明（每条记忆都是你能读的文件），结构化存储（不是碎片化的向量，而是按类型组织的目录），零运行成本（纯文件，不需要 embedding API），数据主权（本地文件 + Git，随时迁移）

**Zep / Graphiti（时序知识图谱）**

Zep 的核心创新是用知识图谱追踪事实的时间演变——不只是"用户喜欢咖啡"，而是"用户在周二讨论晨间习惯时提到喜欢某家店的咖啡"。

- 优势：时间维度追踪，关系推理能力强，适合复杂的多实体场景
- 问题：需要图数据库基础设施（Neo4j 等），schema 设计复杂，查询成本高，小规模场景 ROI 低
- 我们的差异：Supersede 机制用 JSON 平面文件实现了事实演变追踪（不需要图数据库），items.json 的 supersede 链提供了完整的时间线，在 <500 实体的规模下比知识图谱更简单且够用

**Letta / MemGPT（虚拟内存管理）**

Letta 把操作系统的虚拟内存概念搬到了 Agent 上：core memory（常驻 context）+ archival memory（按需检索）+ recall memory（最近访问）。Agent 可以自己决定什么放进 context、什么存到外部。

- 优势：Agent 自主管理记忆，理论上最灵活；有可视化开发环境（ADE）
- 问题：Agent 自主管理 = 不可预测（你不知道它会把什么踢出 context），Letta 自己的 benchmark 显示纯文件系统在 LoCoMo 测试上得分 74%（已经很高），复杂的记忆基础设施只多了 26% 的提升
- 我们的差异：我们选择了确定性而非自主性——查找协议是明确的规则（先查热缓存、再查术语表、再查档案），不是让 Agent 自己决定。可预测性在生产环境中比灵活性更重要。Letta 的 74% benchmark 也侧面验证了文件方案的可行性

**LangMem / LangChain Memory**

LangChain 生态的记忆模块，提供 ConversationBufferMemory、ConversationSummaryMemory 等多种策略。

- 优势：与 LangChain 生态深度集成，策略可选
- 问题：绑定 LangChain 框架，记忆策略是代码级的（不是文件级的，不可人工审查），没有跨框架可移植性
- 我们的差异：平台无关（纯文件，任何能读写文件的 Agent 都能用），人类可读可审查（打开文件就能看到所有记忆），不绑定任何框架

### 对比总结

| 维度 | CLAUDE.md | Mem0 | Zep | Letta | 本项目 |
|------|-----------|------|-----|-------|--------|
| 基础设施需求 | 无 | 向量数据库 + embedding API | 图数据库 | Letta 服务 | 无（纯文件） |
| 检索方式 | 全文扫描 | 语义检索 | 图查询 | 自主管理 | 确定性 + 语义双路径 |
| 事实演变追踪 | 无（覆盖即丢失） | 有限 | 时序图谱 | 有限 | Supersede 链 |
| 知识沉淀 | 手动 | 自动提取 | 自动提取 | Agent 自主 | 程序职员（自动提案 + 人工审核） |
| 透明度 | 高（单文件） | 低（黑盒提取） | 中 | 中（ADE 可视化） | 高（所有文件可读） |
| 数据主权 | 高 | 低（平台锁定） | 中 | 中 | 高（本地 + Git） |
| 运行成本 | 零 | 每次检索付费 | 图数据库运维 | Letta 服务费 | 零 |
| 可扩展性 | 差（文件膨胀） | 好 | 好 | 好 | 中（<500 文件最佳） |
| 适用规模 | 小 | 中-大 | 中-大 | 中-大 | 小-中 |

### 我们的定位

这不是一个试图替代 Mem0 或 Zep 的方案。如果你的场景是：数千用户、海量交互历史、需要复杂的关系推理——你应该用专业的记忆平台。

我们解决的是另一个场景：**一个人（或一个小团队）和一个长期运行的 AI Agent 协作**。在这个场景下：

- 实体数量有限（几十到几百，不是几千）
- 透明度和可控性比自动化更重要（你想知道 Agent 记住了什么）
- 数据主权是硬需求（不想把记忆交给第三方平台）
- 零运维成本是现实约束（不想为了记忆系统维护数据库）
- 知识沉淀需要人在回路（自动提取的质量不够，需要人工审核）

在这个场景下，文件方案不是妥协，而是最优解。

## 核心设计

### 两层架构

热缓存（MEMORY.md）负责快速解码——Agent 醒来后几秒内就能理解"我是谁、用户是谁、在做什么"。深度存储（memory/）负责一切细节：人物档案、项目状态、技术知识、经验教训、每日事件流。

两层之间有自动晋升/降级机制：一周内使用 3 次以上的条目晋升到热缓存，30 天未使用的条目降级到深度存储。热缓存始终保持精简。

### 分层查找协议

两条路径按场景选择：

- 路径 A（确定性查找）：已知实体解码，从热缓存到术语表到档案目录，逐层查找，快且确定
- 路径 B（语义搜索）：模糊回忆，"我们之前讨论过 X 吗"类问题，跨文件关联

简单查询走路径 A，复杂问题两条都走。确定性优先，语义搜索兜底。

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

这是用平面文件实现的"穷人版时序知识图谱"——在小规模场景下，效果相当，复杂度低一个数量级。

### 程序职员模式

灵感来自 Brooks《人月神话》中的程序职员角色。

主 Agent 在执行任务时不做任何"这个要不要记下来"的元认知判断——只管把每日日志写清楚。一个独立的审查进程（程序职员）定期扫描日志，自动识别设计决策、可复用经验、新术语、实体变更、重复模式，生成结构化提案。人工审核通过后才写入记忆。

这跟 Mem0 的自动提取有本质区别：Mem0 是全自动的（提取了什么你不一定知道），我们是半自动的（自动发现，人工审核）。在记忆这种核心资产上，我们选择质量优先于便利。

### 执行透明

所有自动化任务必须产出可见报告。不允许静默执行。

每个定时任务写结构化执行日志（元信息、执行步骤、关键决策、结果摘要），即时推送到 Git 仓库，报告末尾附可点击的日志链接。配合 token 追踪脚本（零 LLM 开销）和自动更新的仪表盘，实现完整的执行可追溯性。

## 目录结构

```
.
├── README.md                          <- 本文件
├── docs/
│   ├── 00-getting-started.md          <- 上手指南（从这里开始）
│   ├── 01-core-architecture.md        <- 两层架构设计与理由
│   ├── 02-memory-layout.md            <- 文件结构与 schema
│   ├── 03-lookup-protocol.md          <- 分层查找协议
│   ├── 04-entity-tracking.md          <- Supersede 机制详解
│   ├── 05-knowledge-pipeline.md       <- 程序职员模式
│   ├── 06-cron-automation.md          <- 定时任务与投递最佳实践
│   ├── 07-execution-transparency.md   <- 执行日志与仪表盘
│   ├── 08-backup-system.md            <- Git 备份体系
│   ├── 09-task-management.md          <- 任务管理集成
│   ├── 10-post-mortems.md             <- 从失败中学习
│   └── 11-data-flow.md               <- 数据流全景
├── templates/                         <- 可直接使用的模板
│   ├── MEMORY.md, AGENTS.md, SOUL.md, USER.md
│   ├── items.json                     <- 实体事实追踪 schema
│   ├── daily-log.md, knowledge-file.md, post-mortems.md
│   └── cron-prompt.md                 <- 定时任务 prompt 模板
├── scripts/                           <- 辅助脚本（脱敏版）
│   ├── token-tracker.js               <- Token 用量追踪（零 LLM 开销）
│   └── auto-backup.sh                 <- Git 全量备份
└── examples/                          <- 完整示例（脱敏数据）
    ├── MEMORY.md                      <- 填充好的热缓存示例
    └── memory/                        <- 完整目录结构示例
```

## 快速开始

详见 [docs/00-getting-started.md](docs/00-getting-started.md)。简要步骤：

1. 复制 `templates/` 到你的工作区，将核心文件（MEMORY.md、AGENTS.md、SOUL.md、USER.md）移到根目录
2. 创建 `memory/` 目录结构：`daily/`、`people/`、`projects/`、`knowledge/`、`context/`
3. 自定义各模板文件，参考 `examples/` 中的完整示例
4. 将 AGENTS.md 中的查找协议加入 Agent 的 system prompt
5. 可选：配置备份脚本和 token 追踪（需先编辑路径和 job ID）

## 适用场景

- 使用 OpenClaw、Claude Code、Codex 等平台运行长期 AI Agent
- 一个人或小团队与 Agent 长期协作，实体规模在几十到几百
- 需要 Agent 跨 session 记住用户偏好、项目状态、技术决策
- 希望记忆系统透明可控，而非平台黑盒
- 重视数据主权，不想被锁定在某个平台

## 设计哲学

- 积淀大于新鲜感。各功能单独都有替代品，但集中沉淀才是质变。
- 透明可追溯。不信任黑盒，所有自动化必须有输出报告。
- 数据主权。本地文件，Git 备份，不锁定平台。
- 深度大于广度。一篇深度分析胜过十条浅层摘要。
- 确定性优先。可预测的行为比灵活的自主性更适合生产环境。

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

Key differentiators vs. existing solutions:
- vs. CLAUDE.md (single file): Solves file bloat with two-layer separation, adds structured lookup protocol and fact evolution tracking
- vs. Mem0 (vector DB): Fully transparent (every memory is a readable file), zero runtime cost, no platform lock-in
- vs. Zep (knowledge graph): Supersede mechanism provides fact evolution tracking without graph database infrastructure
- vs. Letta/MemGPT (virtual memory): Deterministic lookup over autonomous management -- predictability matters in production

Best suited for: individual or small-team long-running agents with <500 entities, where transparency, data sovereignty, and zero infrastructure are priorities.

See [docs/00-getting-started.md](docs/00-getting-started.md) to get started. Browse `examples/` for fully populated sample files.

Developed and validated on [OpenClaw](https://github.com/openclaw/openclaw), but the architecture is platform-agnostic.
