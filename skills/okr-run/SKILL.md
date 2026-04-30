---
name: okr-run
description: Run the full DoWithOKR workflow from client need to Boss OKR, role tree, role OKR, delivery acts, status board, scoring, and final result.
---

# OKR Run

## 执行规则

- 用于全自动闭环执行。
- 固定主链路：甲方需求 -> Boss OKR -> 角色树 -> 角色 OKR -> 交付幕计划 -> 状态看板 -> 上级评分 -> 最终 R。
- 写入状态文件、高风险操作、范围变化、证据不足标记完成前必须请求用户确认。
- 每个阶段必须更新状态：未开始、进行中、阻塞、已完成、放弃。
- 每个完成项必须有证据。

## 输出格式

先输出全局摘要，再按交付幕展示 Boss OKR、角色树、执行计划、OKR 状态看板、上级评分、最终 R。

必须包含：

- 当前交付幕
- 上级映射
- 证据
- 下一步
