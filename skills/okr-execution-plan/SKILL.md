---
name: okr-execution-plan
description: Create a delivery-act execution plan that maps tasks to GM OKR, role OKR, owners, evidence, and exit gates.
---

# OKR Execution Plan

## 前置条件

- 需要：已确认的 GM OKR、角色树和层级 OKR（`.okr/active.md` 中存在对应区块）。
- 缺失处理：
  - 缺少层级 OKR → 提示先运行 `okr-planner`。
  - 缺少角色树 → 提示先运行 `okr-role-splitter`。

## 前置读取

- 读取 `.okr/active.md`。
  - 文件不存在 → 提示用户先运行 `okr-gm`。
  - 缺少 `## 层级 OKR` 或 `## 交付幕计划` 区块 → 提示用户先运行 `okr-planner`。
- 从 `## 层级 OKR` 提取所有角色 KR 及上级映射，从 `## 交付幕计划` 提取幕次和退出门禁。

## 执行规则

- 基于已确认的 GM OKR、角色树和角色 OKR 生成计划。
- 计划必须按交付幕组织，不用现实时间周期承诺。
- 每个任务必须标注负责人、上级映射、证据和退出门禁。
- 状态只能使用：未开始、进行中、阻塞、已完成、放弃。
- 发现无人负责的 GM KR 时必须阻塞并提示。

## 执行步骤

1. 读取 `.okr/active.md` 中的层级 OKR 和交付幕计划。
2. 将每个角色 KR 分配到对应的交付幕：
   - PD 产品总监 KR + PM 产品经理 KR + UI 设计师 KR → M2 方案成型幕。
   - ArchD 技术总监 KR → M2 方案成型幕。
   - BE/FE/QA/DevOps/SEC 等执行角色 KR → M3 构建验证幕。
   - TW 文档专家 KR → M3 构建验证幕（或 M4 收敛阶段）。
   - 如果角色 KR 跨幕（如 ArchD 既有 M2 方案又有 M3 评审），拆分为子任务。
3. 为每个幕生成任务明细表：
   - 任务名称：简洁描述具体产出。
   - 负责人：角色名。
   - 上级映射：该任务对应的角色 KR → GM KR 链路。
   - 证据要求：完成后需要提供什么。
   - 退出门禁：该幕结束前必须满足的条件。
4. 检查覆盖完整性：
   - 每个角色 KR 至少有一个任务。
   - 每个 GM KR 至少被一个任务间接覆盖。
   - 缺失覆盖 → 标记为风险。
5. 写入 `.okr/active.md` 和 `.okr/status.md`。

## 输出格式

输出交付幕计划表，字段包括幕、目标、负责人、任务、上级映射、证据要求、退出门禁。

必须包含：

- 交付幕计划
- 上级映射
- 证据
- 退出门禁

## 异常处理

- 角色 KR 无法归入任何交付幕：提示用户确认该 KR 属于哪个阶段，或标记为跨幕任务。
- 某个幕的任务过多（超过 10 个）：建议拆分为多轮 M3，每轮聚焦一组角色。
- 发现无人负责的 GM KR：阻塞执行计划生成，提示用户补充角色或调整 GM KR。

## 产出写入

- 更新 `.okr/active.md`：
  - 替换 `## 交付幕计划` 区块为包含任务级明细的完整执行计划。
  - 更新 frontmatter：`last_updated`、`updated_by: okr-execution-plan`。
  - 不修改其他区块。
- 更新 `.okr/status.md`：
  - 如果 `okr-planner` 已生成初始看板，保持不变。
  - 如果 `status.md` 不存在，根据执行计划生成初始看板。
