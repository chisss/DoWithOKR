---
name: okr-role-splitter
description: Build a DoWithOKR role tree from Boss OKR, including hierarchy, responsibilities, participation reasons, and role pruning notes.
---

# OKR Role Splitter

## 执行规则

- 先读取 Boss OKR，再拆解角色树。
- 默认组织树为 Boss 下设产品经理和架构师，架构师下设后端、前端、测试、DevOps、安全等技术角色。
- 小任务可以裁剪角色，但必须说明裁剪原因和风险。
- 每个角色必须有职责、上级和参与原因。
- 角色树用于后续层级 OKR、交付幕和上级评分。

## 输出格式

使用 `references/role-tree-template.md`，并展示角色树、上下级关系、角色职责、参与原因、裁剪说明。

必须包含：

- 角色树
- 上下级关系
- 参与原因
- 裁剪说明
