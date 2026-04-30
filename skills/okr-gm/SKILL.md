---
name: okr-gm
description: Convert user or client needs into GM OKR, scope, acceptance criteria, evidence requirements, and confirmation questions for DoWithOKR.
---

# OKR GM

## 输入参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| requirement | string | 是 | 用户自然语言需求描述 |

### 参数解析规则

- 从用户消息中提取需求描述作为 `requirement`。
- 如果用户消息不包含明确需求，提示用户补充："请描述你希望完成的需求或目标"。
- 多句输入时，合并为完整需求文本，保留用户原始表述。
- 示例：`把这个需求转成 GM OKR：做一个用户登录模块` → requirement = `"做一个用户登录模块"`
- 示例：`帮我规划一下订单管理系统` → requirement = `"订单管理系统"`

## 前置条件

- 需要：用户自然语言需求描述。
- 缺失处理：提示用户输入需求，例如"请描述你希望完成的需求或目标"。

## 前置读取

- 检查 `.okr/` 目录是否存在。
  - 不存在 → 创建 `.okr/` 目录。
  - 已存在且 `.okr/active.md` 包含 `## GM OKR` 区块 → 提示用户选择：覆盖当前 GM OKR、或取消。
- 读取用户输入的自然语言需求。

## 执行规则

- 把用户自然语言需求视为甲方需求。
- GM 是甲方总经理（甲方代理），只能代理和复述用户需求，不能擅自扩大范围。
- 输出 GM Objective 和 2-5 个 GM Key Results。
- 每个 KR 必须包含验收标准、证据要求和状态。
- 不确定内容进入"待确认"，不得伪装为已确认。

## 执行步骤

1. 提取用户需求中的核心关键词和业务目标。
2. 判断需求边界：
   - 用户明确提到的功能 → 纳入范围。
   - 用户未提及但常见的关联功能（如第三方登录、SSO）→ 放入"边界"标记为不包含。
   - 无法判断是否需要的功能 → 放入"待确认"。
3. 将需求转化为 1 个 GM Objective：以甲方视角表达业务结果，而非技术实现。
4. 拆解 2-5 个 GM Key Results：
   - 每个 KR 必须可验证（有明确的完成标准）。
   - 每个 KR 必须指定证据类型（接口、页面、测试记录、文档等）。
   - 初始状态统一为"未开始"。
5. 按 `references/gm-okr-template.md` 格式组织输出。
6. 写入 `.okr/active.md`。
7. 向用户展示完整 GM OKR，请求确认后再继续后续技能。

## 输出格式

使用 `references/gm-okr-template.md`，并展示 GM OKR、边界、待确认问题。

必须包含：

- 甲方需求
- GM Objective
- GM Key Results
- 边界
- 待确认

## 异常处理

- 需求过于模糊（如"做个系统"）：列出 2-3 个澄清问题，等待用户回答后再生成 GM OKR。
- 需求范围过大（涉及 5 个以上独立模块）：建议用户拆分为多轮 OKR，先聚焦核心模块。
- `.okr/` 目录已存在旧数据：展示旧 GM OKR 摘要，让用户选择覆盖或取消。

## 产出写入

- 创建或更新 `.okr/active.md`：
  - 写入 frontmatter：`version: 1`、`current_act: M0`、`last_updated: <今天日期>`、`updated_by: okr-gm`。
  - 写入 `## 甲方需求` 区块。
  - 写入 `## GM OKR` 区块（含 `### 边界` 和 `### 待确认`）。
  - 不写入其他区块（角色树、层级 OKR 等由后续技能填充）。
- 写入完成后向用户展示 GM OKR 内容并请求确认。
