# DoWithOKR

DoWithOKR 是一个面向 Claude Code 与 Codex 的多技能 OKR 工作流插件。它的核心隐喻是“用 OKR 开展工作的小型技术公司”：用户是甲方，Boss 是乙方总负责人/用户需求代理，先把自然语言需求转成 Boss OKR，再拆解为各专业角色 OKR，并通过交付幕、状态看板、上级评分收敛最终 R。

## Core Concept

DoWithOKR 不只是生成一份 OKR 文档，而是提供一套可执行的 AI 工作方式：

```text
甲方需求 -> Boss OKR -> 角色树 -> 角色 OKR -> 交付幕计划 -> 状态看板 -> 上级评分 -> 最终 R
```

- **甲方需求**：用户输入的自然语言需求。
- **Boss OKR**：Boss 作为用户需求代理，将需求转成可验收目标。
- **角色 OKR**：产品、架构、后端、前端、测试等角色从上级 KR 拆解自己的目标。
- **交付幕**：插件自己的虚拟阶段模型，用证据门禁模拟现实进度。
- **最终 R**：交付物、证据、评分与复盘结论。

## Plugin Structure

```text
DoWithOKR/
  .claude-plugin/plugin.json
  .codex-plugin/plugin.json
  skills/
  references/
  examples/
  docs/
  scripts/validate-plugin.mjs
```

- `.codex-plugin/plugin.json`：Codex 插件 manifest。
- `.claude-plugin/plugin.json`：Claude Code 插件 manifest。
- `skills/`：DoWithOKR 多技能入口。
- `references/`：共享输出模板。
- `examples/`：示例 OKR 工作流。
- `docs/`：产品文档、输出格式规范、实施计划。

## Roles

| 角色 | 定位 | 主要产出 |
| --- | --- | --- |
| Boss | 乙方总负责人 / 用户需求代理 | Boss OKR、边界、验收口径、最终 R |
| 产品经理 | 将 Boss OKR 转成产品范围 | 用户流程、权限矩阵、验收标准 |
| 架构师 | 管理技术方案与技术角色 | 技术方案、接口/数据模型、技术拆解 |
| 后端开发 | 实现服务能力 | API、数据模型、业务逻辑、测试证据 |
| 前端开发 | 实现用户体验 | 页面、状态、错误提示、交互证据 |
| 测试工程师 | 验证交付质量 | 测试用例、回归记录、缺陷反馈 |
| DevOps / 发布工程师 | 支撑交付上线 | 环境、CI、部署、回滚说明 |
| 安全工程师 | 识别安全风险 | 权限、数据、依赖和提示词风险检查 |
| 技术写作 / DX | 降低使用成本 | README、示例、安装和故障排查 |

默认组织树：

```text
Boss
├─ 产品经理
│  └─ 技术写作 / DX
└─ 架构师
   ├─ 后端开发
   ├─ 前端开发
   ├─ 测试工程师
   ├─ DevOps / 发布工程师
   └─ 安全工程师
```

## Skills

| Skill | 作用 | 典型触发 |
| --- | --- | --- |
| `okr-run` | 全自动跑完整闭环 | “使用 DoWithOKR 运行这个需求” |
| `okr-boss` | 把甲方需求转成 Boss OKR | “先整理 Boss OKR” |
| `okr-role-splitter` | 生成角色树与上下级关系 | “拆一下需要哪些角色” |
| `okr-planner` | 生成层级 OKR 和交付幕计划 | “制定完整 OKR 计划” |
| `okr-execution-plan` | 输出按交付幕和角色映射的任务计划 | “生成执行计划” |
| `okr-role-run` | 执行某个角色或角色 KR | “执行后端开发 KR2” |
| `okr-status-tracker` | 展示 KR 状态看板 | “查看当前 OKR 进展” |
| `okr-alignment-check` | 检查任务是否对齐上级 OKR | “检查当前任务是否偏离” |
| `okr-review-score` | 上级评分并复盘最终 R | “进行 OKR 评分复盘” |
| `okr-next-cycle` | 建议下一轮交付幕或 Boss OKR | “进入下一轮” |

## Delivery Acts

DoWithOKR 使用“交付幕”代替双周、月度、季度等现实时间概念：

| 幕 | 名称 | 目标 |
| --- | --- | --- |
| M0 | 需求转译幕 | 甲方需求变成 Boss OKR |
| M1 | 组织拆解幕 | Boss OKR 拆成角色树和角色 OKR |
| M2 | 方案成型幕 | 产品和架构形成可执行方案 |
| M3 | 构建验证幕 | 研发、测试、交付角色产出证据 |
| M4 | 收敛复盘幕 | 上级评分并汇总最终 R |

## Usage Examples

全自动执行：

```text
使用 DoWithOKR 运行这个需求：做一个用户登录与权限管理模块。
```

分步制定 OKR：

```text
DoWithOKR，先把这个需求转成 Boss OKR。
DoWithOKR，基于 Boss OKR 拆角色树。
DoWithOKR，生成层级 OKR 和交付幕计划。
```

按角色执行：

```text
DoWithOKR，先执行产品经理角色的 OKR。
DoWithOKR，执行架构师下面后端开发的 KR2。
DoWithOKR，让测试工程师根据当前交付做验收。
```

跟踪与复盘：

```text
DoWithOKR，查看当前 OKR 状态看板。
DoWithOKR，检查当前任务是否对齐 Boss OKR。
DoWithOKR，进行 OKR 评分复盘。
```

完整示例见 [examples/login-access-okr.md](examples/login-access-okr.md)。

## Example Output

### OKR 状态看板

| KR       | 上级 KR   | 角色     | 幕次 | 状态   | 进展 | 证据              | 下一步         |
| -------- | --------- | -------- | ---- | ------ | ---- | ----------------- | -------------- |
| PM-KR1   | B-KR1     | 产品经理 | M2   | 已完成 | 1.0  | docs/flows.md     | 等架构评审     |
| ARCH-KR1 | B-KR1     | 架构师   | M2   | 进行中 | 0.6  | docs/api.md       | 补权限数据模型 |
| QA-KR1   | ARCH-KR2  | 测试工程师 | M3   | 阻塞   | 0.2  | tests/cases.md    | 等接口稳定     |

### OKR 评分复盘

| 评分人 | 被评分人 | KR     | 分数 | 证据                | 说明                   |
| ------ | -------- | ------ | ---- | ------------------- | ---------------------- |
| Boss   | 产品经理 | PM-KR1 | 1.0  | docs/flows.md       | 流程完整且可验收       |
| 架构师 | 后端开发 | BE-KR1 | 0.6  | tests/login.spec.ts | 登录闭环完成，权限未完成 |

**Boss 最终 R：0.72**

## Documentation

- [产品文档](docs/DoWithOKR-product-document.md)
- [输出格式规范](docs/DoWithOKR-output-format-spec.md)
- [实施计划](docs/superpowers/plans/2026-04-30-dowithokr-plugin.md)

## Validation

在 `DoWithOKR` 目录运行：

```bash
node scripts/validate-plugin.mjs
```

期望输出：

```text
DoWithOKR plugin validation passed
```

## Notes

- 当前实现是内容优先插件，无运行时服务。
- `MEMORY.md` 是本地工作记忆文件，已通过 `.gitignore` 排除，不应提交。
- 后续需要在 Claude Code 与 Codex 中分别做真实安装验证。
