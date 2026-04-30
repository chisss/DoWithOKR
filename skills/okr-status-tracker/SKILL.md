---
name: okr-status-tracker
description: Show and update the DoWithOKR status board with KR state, progress, evidence, blockers, next steps, and upper-level mapping.
---

# OKR Status Tracker

## 执行规则

- 用于展示或更新 OKR 状态看板。
- 所有 KR 必须显示上级映射、角色、交付幕、状态、进展、证据和下一步。
- 状态只能使用：未开始、进行中、阻塞、已完成、放弃。
- 已完成必须有证据；无证据时只能标记为进行中或阻塞。
- 看板应先输出摘要，再输出明细。

## 输出格式

使用 `references/status-board-template.md`。

必须包含：

- OKR 状态看板
- 当前交付幕
- 阻塞项
- 下一步
