# 子技能调用协议

本文档定义 DoWithOKR 角色在执行过程中调用外部技能时的规则、上下文传递格式和证据回流机制。

## 设计理念

每个角色在执行 KR 时本质上是一个子 Agent，可以调用外部技能（如 `/investigate`、`/qa`、`/review`）辅助完成交付。但调用必须服务于 KR，产出必须回流为证据。

## 调用前检查（三问）

调用外部技能前，必须通过以下三个检查：

1. **目的检查**：调用目的是否服务于当前 KR？
2. **证据检查**：调用结果是否会作为 KR 的证据？
3. **职责检查**：是否在角色职责范围内？

三问均为"是"方可调用。任一为"否"则不调用，改为标记阻塞或建议由其他角色处理。

## 调用时上下文传递

调用外部技能时，在调用指令中携带以下 OKR 上下文：

```
当前角色: {role}
当前 KR: {KR-ID} — {KR 内容}
调用目的: {为什么需要这个技能}
期望产出: {需要什么结果回流到 KR}
```

上下文传递确保外部技能在执行时理解 OKR 背景，产出能精准服务于 KR。

## 调用后处理

1. 将外部技能的关键产出记录为证据，写入 `.okr/evidence/{KR-ID}.md`。
2. 评估产出是否满足 KR 验收标准。
3. 更新 `.okr/status.md` 中的进展。

## 调用限制

- **禁止跨层调用**：执行层角色（BE、FE、QA 等）不能调用战略层技能（如 `/office-hours`）。
- **禁止越界执行**：调用技能时只处理本角色职责范围内的问题。例如 FE 调用 `/investigate` 时，只诊断前端问题，不修改后端代码。
- **结果必须回流**：外部技能的产出必须记录到 `.okr/evidence/` 中，不能"用完即弃"。
- **矩阵外调用须说明**：如确需调用权限矩阵外的技能，须在执行报告中说明理由。

## 角色-技能权限矩阵

| 角色 | 可调用技能 | 典型场景 |
| --- | --- | --- |
| GM 甲方总经理 | /office-hours | 需求澄清、价值验证 |
| PD 产品总监 | /product-requirements, /shape, /design-consultation | 产品规划、UX 设计 |
| PM 产品经理 | /product-requirements | 需求细化 |
| UI 设计师 | /shape, /design-consultation, /design-review | 设计规划、视觉审计 |
| ArchD 技术总监 | /plan-eng-review | 架构评审 |
| BE 后端开发工程师 | /investigate, /review, /qa, /health | 调试、代码审查、测试、质量检查 |
| FE 前端开发工程师 | /browse, /design-review, /qa | 页面测试、视觉审计、功能测试 |
| QA 测试工程师 | /qa, /qa-only, /browse, /investigate | 系统测试、缺陷分析 |
| TW 文档专家/DX | /document-release | 文档发布 |
| DevOps 发布工程师 | /ship, /land-and-deploy, /canary, /setup-deploy | 部署、发布、监控 |
| SEC 安全工程师 | /cso, /security-review, /audit | 安全审计 |

未在矩阵中的技能，角色不得主动调用。

## 调用记录格式

角色在执行报告中记录外部技能调用时，使用以下格式：

```markdown
### 外部技能调用

| 技能 | 目的 | 产出 | 证据类型 |
| --- | --- | --- | --- |
| /investigate | 诊断登录接口 500 错误 | 定位到 token 过期未处理 | 日志 |
| /qa | 验证登录流程 E2E | 5 条用例全部通过 | 测试 |
```
