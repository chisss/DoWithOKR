# DoWithOKR

[English](README_EN.md)

> 用 OKR 驱动 AI 团队交付价值。面向 Claude Code 与 Codex 的多技能工作流插件。

## Design Philosophy

DoWithOKR 不是任务管理工具，而是**价值对齐引擎**。

技术团队的日常工作本质是"执行动作"——写代码、改 bug、做联调。但 OKR 框架要回答的不是"做了什么"，而是**交付了什么价值、达到了什么标准**。DoWithOKR 围绕这个核心理念构建：

**用户是甲方，GM 是需求代理，AI 扮演一支完整的产品技术团队。** 需求经过 OKR 转译、角色拆解、交付幕推进，最终收敛为可验证的交付物和评分。

### 五条设计信条

1. **O 对齐价值，不写任务** — O 是方向（"高质量交付 Agent 核心模块"），不是动作（"开发 Agent 工具"）
2. **KR 是交付标准，必须量化** — 公式：`时间 + 交付物 + 质量指标`
3. **角色自主决定怎么做** — 系统只验证结果是否达标，不规定实现路径
4. **能力在周期中积累** — 角色不是无状态执行器，而是有经验的专业人士
5. **价值可追溯** — 从需求到交付到评分，形成完整的价值链闭环

### 分层对齐：上层谈价值，下层谈交付

```
┌───────────────────────────────────────────────┐
│  战略层 (GM)                                    │
│  O: 业务价值、技术战略    KR: 里程碑、性能指标     │
├───────────────────────────────────────────────┤
│  管理层 (PD / ArchD)                            │
│  O: 交付效率、团队能力    KR: 质量标准、进度里程碑  │
├───────────────────────────────────────────────┤
│  执行层 (BE / FE / QA / DevOps / SEC / ...)     │
│  O: 高质量模块交付        KR: 时间+交付物+质量指标  │
└───────────────────────────────────────────────┘
```

每层 KR 都是上层 KR 的具体化，下层的 O 必须能回答"我在支撑上层的哪个 KR"。

### KR 范式：从"写动作"到"写交付标准"

| 日常动作 | ❌ 错误 KR | ✅ 正确 KR |
|---------|-----------|-----------|
| 开发功能 | 开发用户管理模块 | 5.10 前完成用户模块，单测覆盖率 ≥ 90% |
| 改 bug | 修复线上 bug | 线上 bug 24h 响应，修复率 ≥ 95% |
| 写文档 | 写接口文档 | 5.15 前完成接口文档，联调零阻塞 |
| 优化性能 | 优化检索速度 | 6.1 前完成检索优化，响应时间降低 30% |

### 能力积累：角色会成长

每次 OKR 周期结束后，系统从评分和回顾中提炼经验，写入角色的 `wisdom` 记忆。下一周期启动时，角色读取历史经验作为先验知识，避免重复犯错，持续提升专业判断力。

```
需求 → OKR → 交付 → 评分 → 价值总结 → 能力提炼 → wisdom
 ↑                                                    │
 └────────────────────────────────────────────────────┘
                  (下一周期更精准)
```

---

## How It Works

```mermaid
graph LR
    A[甲方需求] --> B[GM OKR]
    B --> C[角色树]
    C --> D[层级 OKR]
    D --> E[交付幕计划]
    E --> F[角色执行]
    F --> G[状态看板]
    G --> H[评分复盘]
    H --> I[最终 R]
    I --> J[能力积累]
    J -.-> B
```

## 角色架构

```text
GM 总经理（甲方需求代理）
├── PD 产品总监
│   ├── PM 产品经理
│   ├── UI 设计师
│   └── TW 技术写作 / DX
└── ArchD 技术总监
    ├── BE 后端工程师
    ├── FE 前端工程师
    ├── QA 测试工程师
    ├── DevOps 发布工程师
    └── SEC 安全工程师
```

| 角色 | 缩写 | 定位 | 主要产出 |
| --- | --- | --- | --- |
| 总经理 | GM | 甲方需求代理，定义顶层 OKR | GM OKR、边界、验收口径 |
| 产品总监 | PD | 产品方向管理 | 产品方案，协调 PM/UI/TW |
| 产品经理 | PM | 需求分析与验收 | 用户流程、权限矩阵、验收标准 |
| 设计师 | UI | 交互与视觉设计 | 设计规范、交互指引 |
| 技术写作 / DX | TW | 降低使用门槛 | README、示例、安装指南 |
| 技术总监 | ArchD | 技术方案与工程管理 | 技术方案、接口契约、模块拆解 |
| 后端工程师 | BE | 服务能力实现 | API、数据模型、业务逻辑 |
| 前端工程师 | FE | 用户体验实现 | 页面、状态管理、交互 |
| 测试工程师 | QA | 交付质量验证 | 测试用例、回归记录 |
| 发布工程师 | DevOps | 交付与发布支撑 | CI/CD、部署、环境配置 |
| 安全工程师 | SEC | 安全风险识别 | 权限检查、漏洞扫描 |

评分链：GM → PD + ArchD，PD → PM + UI + TW，ArchD → BE + FE + QA + DevOps + SEC

## 技能列表

| 技能 | 作用 | 典型触发 |
| --- | --- | --- |
| `okr-run` | 全自动跑完整闭环 | "使用 DoWithOKR 运行这个需求" |
| `okr-gm` | 将需求转成 GM OKR | "先整理 GM OKR" |
| `okr-role-splitter` | 生成角色树与上下级关系 | "拆一下需要哪些角色" |
| `okr-planner` | 生成层级 OKR 和交付幕计划 | "制定完整 OKR 计划" |
| `okr-execution-plan` | 输出交付验证计划 | "生成交付验证计划" |
| `okr-role-run` | 执行某个角色的 KR | "执行后端工程师 KR2" |
| `okr-status-tracker` | 展示 KR 状态看板 | "查看当前 OKR 进展" |
| `okr-alignment-check` | 检查交付结果是否对齐 KR 标准 | "检查当前任务是否偏离" |
| `okr-review-score` | 上级评分、经验提炼、周期归档 | "进行 OKR 评分复盘" |
| `okr-next-cycle` | 建议下一轮方向，更新能力报告 | "进入下一轮" |
| `okr-archive` | 手动归档当前周期并清理工作区 | "归档当前 OKR 周期" |

## 交付幕模型

DoWithOKR 使用"交付幕"代替现实时间周期，以证据门禁驱动推进：

| 幕 | 名称 | 目标 | 关键角色 |
| --- | --- | --- | --- |
| M0 | 需求转译 | 甲方需求 → GM OKR | GM |
| M1 | 组织拆解 | 角色树 + 角色 OKR | GM |
| M2 | 方案成型 | 产品方案 + 技术方案 | PD, PM, UI, ArchD |
| M3 | 构建验证 | 代码、测试、文档 | BE, FE, QA, DevOps, SEC, TW |
| M4 | 收敛复盘 | 评分 + 价值总结 + 能力积累 + 周期归档 | GM |

## 安装

### 前置依赖

- [Git](https://git-scm.com/)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 或 [Codex CLI](https://github.com/openai/codex)（支持其一或同时安装）

### 一键安装

```bash
git clone https://github.com/<your-username>/DoWithOKR.git
cd DoWithOKR
./install.sh /path/to/your/project
```

`install.sh` 会同时完成两个平台的安装：

| 平台 | 安装内容 | 安装位置 |
| --- | --- | --- |
| Claude Code | 复制 SKILL.md 为 slash command，追加路由规则 | `.claude/commands/okr-*.md` + `CLAUDE.md` |
| Codex CLI | 创建插件目录，symlink 技能和引用模板 | `.codex-plugin/plugin.json` + `skills/` + `references/` |

安装是幂等的——重复运行会跳过已安装的内容。

### 卸载

```bash
./uninstall.sh /path/to/your/project
```

同时清理 Claude Code 和 Codex CLI 的安装产物。仅删除 DoWithOKR 自身的文件，不影响其他插件。

## 快速开始

**1. 安装**

```bash
git clone https://github.com/<your-username>/DoWithOKR.git
cd DoWithOKR && ./install.sh /path/to/your/project
```

**2. 运行**

Claude Code（交互模式）：

```text
使用 DoWithOKR 运行这个需求：做一个用户登录与权限管理模块。
```

Codex CLI（非交互模式）：

```bash
codex exec --full-auto -C /path/to/your/project \
  "使用 okr-gm 技能，需求是：做一个用户登录与权限管理模块"
```

**3. 查看产出**

```bash
ls /path/to/your/project/.okr/
# active.md  status.md  evidence/  reviews/  wisdom/
```

### 分步模式

Claude Code 使用 slash command，Codex 在 prompt 中指定技能名：

| 步骤 | Claude Code | Codex CLI prompt |
| --- | --- | --- |
| 需求转 GM OKR | `/okr-gm` | `"使用 okr-gm 技能，需求是：..."` |
| 拆解角色树 | `/okr-role-splitter` | `"使用 okr-role-splitter 技能"` |
| 层级 OKR + 交付幕 | `/okr-planner` | `"使用 okr-planner 技能"` |
| 交付验证计划 | `/okr-execution-plan` | `"使用 okr-execution-plan 技能"` |
| 执行角色 KR | `/okr-role-run` | `"使用 okr-role-run 技能，执行 BE 后端工程师"` |
| 状态看板 | `/okr-status-tracker` | `"使用 okr-status-tracker 技能"` |
| 评分复盘 | `/okr-review-score` | `"使用 okr-review-score 技能"` |
| 手动归档 | `/okr-archive` | `"使用 okr-archive 技能"` |

## 状态文件

所有 OKR 状态保存在项目的 `.okr/` 目录中：

```text
.okr/
  active.md       # GM OKR、角色树、层级 OKR、交付幕计划
  status.md       # KR 状态看板
  evidence/       # 各 KR 的证据索引
  reviews/        # 评分复盘记录
  wisdom/         # 角色能力积累（跨周期保留）
  archive/        # 历史归档
    <date>-cycle/   # 周期完成归档（含 active/status/evidence/reviews/summary）
    <date>-active.md  # 断点重启归档
```

建议：`echo '.okr/' >> .gitignore`

## 示例输出

### `/okr-planner` 输出样例

**OKR 树**

```text
GM 总经理
├── PD 产品总监
│   ├── PM 产品经理
│   ├── UI 设计师
│   └── TW 技术写作 / DX
└── ArchD 技术总监
    ├── BE 后端工程师
    ├── FE 前端工程师
    ├── QA 测试工程师
    ├── DevOps 发布工程师
    └── SEC 安全工程师
```

**层级 OKR**

| 层级路径 | 上级映射 | Objective | Key Results |
| --- | --- | --- | --- |
| GM 总经理 | 甲方需求 | 交付安全、可用、可扩展的登录与权限管理能力。 | GM-KR1：M4 前注册、登录、退出闭环验收通过率 100%。<br>GM-KR2：M4 前角色权限控制覆盖管理员、普通用户 2 类角色。<br>GM-KR3：M4 前关键流程安全校验通过率 100%。 |
| GM → PD 产品总监 | GM-KR1, GM-KR2 | 将登录与权限需求转成可验收的产品方案。 | PD-KR1：M2 完成核心流程与验收标准，覆盖 GM-KR1 的 3 个场景，评审通过率 100%。<br>PD-KR2：M2 完成角色权限矩阵，覆盖 GM-KR2 的 2 类角色，关键权限遗漏为 0。 |
| GM → PD → PM 产品经理 | PD-KR1, PD-KR2 | 细化登录与权限的用户流程和验收口径。 | PM-KR1：M2 完成注册、登录、退出流程说明，异常分支覆盖率 100%。<br>PM-KR2：M2 完成权限验收用例，覆盖 PD-KR2 的全部角色与操作。 |
| GM → PD → UI 设计师 | PD-KR1 | 让账号流程清晰、低误操作。 | UI-KR1：M2 完成登录、注册、权限提示交互稿，关键状态覆盖率 100%。<br>UI-KR2：M2 完成错误提示与空状态规范，评审问题关闭率 100%。 |
| GM → PD → TW 技术写作 / DX | PD-KR1, PD-KR2 | 降低集成、验收和使用理解成本。 | TW-KR1：M3 完成 README 使用说明，覆盖安装、登录、权限配置 3 类场景。<br>TW-KR2：M3 完成接口示例与验收说明，联调阻塞问题为 0。 |
| GM → ArchD 技术总监 | GM-KR1, GM-KR2, GM-KR3 | 形成可实现、可测试、可扩展的登录权限技术方案。 | ARCHD-KR1：M2 完成 API、数据模型和鉴权方案，覆盖 GM-KR1、GM-KR2 的全部验收项。<br>ARCHD-KR2：M2 完成安全校验清单和测试边界，覆盖 GM-KR3 的 3 类风险。 |
| GM → ArchD → BE 后端工程师 | ARCHD-KR1, ARCHD-KR2 | 交付稳定的认证授权服务能力。 | BE-KR1：M3 完成注册、登录、退出 API，单元测试覆盖率 ≥ 90%，接口契约通过率 100%。<br>BE-KR2：M3 完成 RBAC 权限校验中间件，越权访问测试通过率 100%。 |
| GM → ArchD → FE 前端工程师 | ARCHD-KR1 | 交付可用的登录与权限前端体验。 | FE-KR1：M3 完成登录、注册、退出页面，核心流程端到端通过率 100%。<br>FE-KR2：M3 完成权限路由与按钮级控制，权限场景覆盖率 100%。 |
| GM → ArchD → QA 测试工程师 | ARCHD-KR1, ARCHD-KR2 | 验证登录权限能力达到交付标准。 | QA-KR1：M3 完成核心流程测试集，覆盖 GM-KR1 的 3 个场景，回归通过率 100%。<br>QA-KR2：M3 完成权限与安全测试集，覆盖越权、会话、失败重试 3 类风险。 |
| GM → ArchD → DevOps 发布工程师 | ARCHD-KR1 | 保障登录权限模块可稳定交付。 | DEVOPS-KR1：M3 完成 CI 校验配置，测试与构建通过率 100%。<br>DEVOPS-KR2：M3 完成部署与回滚说明，发布演练阻塞项为 0。 |
| GM → ArchD → SEC 安全工程师 | ARCHD-KR2 | 识别并关闭关键账号安全风险。 | SEC-KR1：M3 完成认证授权安全检查，覆盖 GM-KR3 的全部风险项。<br>SEC-KR2：M3 完成高风险问题复测，P0/P1 漏洞遗留为 0。 |

**交付幕计划**

| 幕 | 目标 | 负责人 | 退出门禁 |
| --- | --- | --- | --- |
| M0 需求转译幕 | GM OKR 获得确认 | GM | GM-KR 验收标准清晰 |
| M1 组织拆解幕 | 角色树与层级 OKR 完成 | GM | GM 始终为根节点，PD 与 ArchD 分支完整 |
| M2 方案成型幕 | 产品与技术方案完成 | PD 产品总监、ArchD 技术总监 | 验收标准、接口契约、安全边界明确 |
| M3 构建验证幕 | 研发、测试、发布、安全与文档产出证据 | BE、FE、QA、DevOps、SEC、TW | 核心 KR 有代码、测试、文档或检查证据 |
| M4 收敛复盘幕 | 上级评分并汇总最终 R | GM | 评分、风险、下一周期建议完整 |

**映射关系**

| 上级节点 | 下级承接 | 覆盖判断 |
| --- | --- | --- |
| GM | PD, ArchD | GM 只向两个一级负责人下钻，保持顶层价值口径统一 |
| PD-KR1 | PM-KR1, UI-KR1, UI-KR2, TW-KR1 | 产品流程、交互和使用说明共同承接核心流程验收 |
| PD-KR2 | PM-KR2, TW-KR2 | 权限矩阵被验收用例和接口示例共同承接 |
| ARCHD-KR1 | BE-KR1, FE-KR1, FE-KR2, QA-KR1, DEVOPS-KR1, DEVOPS-KR2 | 技术方案被前后端实现、测试和发布能力共同承接 |
| ARCHD-KR2 | BE-KR2, QA-KR2, SEC-KR1, SEC-KR2 | 安全边界被权限实现、测试和安全复测共同承接 |

### OKR 状态看板

| KR | 上级 KR | 角色 | 幕次 | 状态 | 进展 | 证据 | 下一步 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PD-KR1 | GM-KR1 | PD 产品总监 | M2 | 已完成 | 1.0 | docs/product-plan.md | 等技术评审 |
| ARCHD-KR1 | GM-KR1 | ArchD 技术总监 | M2 | 进行中 | 0.6 | docs/api.md | 补权限数据模型 |
| BE-KR1 | ARCHD-KR1 | BE 后端 | M3 | 进行中 | 0.4 | src/api/login.ts | 实现鉴权检查 |
| QA-KR1 | ARCHD-KR1 | QA 测试 | M3 | 阻塞 | 0.2 | tests/cases.md | 等接口稳定 |

### 评分复盘

| 评分人 | 被评分人 | KR | 分数 | 证据 | 说明 |
| --- | --- | --- | --- | --- | --- |
| GM | PD 产品总监 | PD-KR1 | 1.0 | docs/product-plan.md | 方案完整可验收 |
| ArchD | BE 后端 | BE-KR1 | 0.7 | tests/login.spec.ts | 登录闭环完成 |

**GM 最终 R = 产品线 R × 40% + 技术线 R × 60% = 0.72**

完整示例见 [examples/login-access-okr.md](examples/login-access-okr.md)。

## 插件结构

```text
DoWithOKR/                          # 插件源目录
  .claude-plugin/plugin.json        # Claude Code manifest
  .codex-plugin/plugin.json         # Codex manifest
  skills/                           # 11 个技能入口（SKILL.md）
  references/                       # 共享模板与规范
  examples/                         # 示例 OKR 工作流
  docs/                             # 产品文档与设计理念
  scripts/validate-plugin.mjs       # 插件校验脚本
  install.sh                        # 安装脚本（Claude Code + Codex）
  uninstall.sh                      # 卸载脚本

target-project/                     # 安装后的目标项目
  .claude/commands/okr-*.md         # Claude Code slash commands（复制）
  .codex-plugin/
    plugin.json                     # Codex 插件描述（复制）
    skills/ → DoWithOKR/skills/     # symlink 到源目录
    references/ → DoWithOKR/refs/   # symlink 到源目录
  CLAUDE.md                         # 追加路由规则
  .okr/                             # 运行时产出（技能自动创建）
```

## 校验

```bash
cd DoWithOKR && node scripts/validate-plugin.mjs
# DoWithOKR plugin validation passed
```

## 说明

- 内容优先插件，无运行时服务依赖
- 技能间通过 `.okr/` 状态文件传递上下文
- 支持断点续跑：中断后重新触发 `okr-run` 自动恢复
- 周期归档：M4 评分复盘后自动归档并清理工作区，wisdom/ 跨周期保留

## Roadmap

### v1.x — 价值对齐重构（当前）

面向技术团队，落地核心设计理念：

- **KR 范式升级** — 模板和引导全面切换到"时间 + 交付物 + 质量指标"范式，增加 KR 质量自检和反模式检测
- **角色自主权** — `okr-execution-plan` 从"执行计划"重新定位为"交付验证计划"，输出验收标准和验证方法，不再拆步骤
- **能力积累系统** — 实现 `.okr/wisdom/` 角色记忆，M4 阶段写入经验，M0 阶段读取先验知识
- **价值度量闭环** — 评分之上增加价值总结（价值层 + 能力层 + 洞察层），形成跨周期正向飞轮

### v2.0 — 多团队类型

将 OKR 价值对齐框架扩展到技术团队以外：

```text
DoWithOKR 团队类型
├── 技术团队 (v1.0 ✅)
│   GM → PD + ArchD → BE / FE / QA / DevOps / SEC
│
├── 营销团队 (v2.0)
│   GM → CMO → 品牌经理 / 增长经理 / 内容运营
│   KR 示例: "Q2 品牌曝光量提升 50%，获客成本降低 20%"
│
└── 运营团队 (v2.0)
    GM → COO → 用户运营 / 活动运营 / 数据分析
    KR 示例: "月活留存率提升至 85%，NPS ≥ 60"
```

关键前提：角色体系可配置化——将角色定义从技能文件中抽离，通过配置文件定义团队类型和角色树。

### v3.0 — 跨职能混合团队

```text
GM → CTO + CMO + COO → 各专业角色
```

支持跨职能 OKR 对齐，多条业务线的 KR 在 GM 层汇聚，各线独立交付、统一评分。
