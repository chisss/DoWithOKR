---
name: okr-alignment-check
description: Check whether the current task, role work, or recent changes align with upper-level OKR and Boss OKR.
---

# OKR Alignment Check

## 执行规则

- 用户可主动触发，也可在任务变化时触发。
- 比较当前任务与上级 OKR、Boss OKR 的关系。
- 输出对齐、部分对齐或偏离。
- 偏离时给出继续、调整 OKR、放弃任务三种建议。
- 不清楚上级映射时必须提示补齐映射。

## 输出格式

输出当前任务与上级 OKR 的对齐结论。

必须包含：

- 结论
- 当前任务
- 上级映射
- 对齐点
- 偏离点
- 建议
