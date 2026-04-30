---
name: okr-role-run
description: Execute a specified DoWithOKR role or role KR while preserving upper-level mapping, evidence, and status updates.
---

# OKR Role Run

## 执行规则

- 用于执行某个角色或某个角色 KR。
- 执行前必须展示上级映射，例如 BE-KR1 -> ARCH-KR1 -> B-KR1。
- 执行中只处理该角色职责范围内的内容。
- 跳过上游角色时，提示风险但不强制阻止。
- 完成后必须更新状态：未开始、进行中、阻塞、已完成、放弃。

## 输出格式

输出角色执行报告。

必须包含：

- 角色
- 执行 KR
- 上级映射
- 已完成
- 证据
- 状态
- 下一步
