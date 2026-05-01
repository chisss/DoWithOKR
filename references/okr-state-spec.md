# OKR 状态文件规范

本文档定义 DoWithOKR 插件在用户项目中创建和维护的 `.okr/` 状态文件体系。所有技能通过读写这些文件实现跨调用的状态传递。

## 目录结构

```text
.okr/
  active.md          # 当前 OKR 主文件（GM OKR、角色树、角色 OKR、交付幕计划、交付验证计划）
  status.md          # KR 状态看板
  evidence/          # 证据索引，每个 KR 一个文件
    GM-KR1.md
    PD-KR1.md
    PM-KR1.md
    ...
  reviews/           # 评分复盘记录
    YYYY-MM-DD.md
  wisdom/            # 角色能力积累（参考 references/wisdom-spec.md）
    gm.md
    pd.md
    archd.md
    be.md
    fe.md
    qa.md
    team.md
  archive/           # 历史归档
    YYYY-MM-DD-active.md       # 文件级归档（断点重启）
    YYYY-MM-DD-status.md
    YYYY-MM-DD-cycle/          # 目录级归档（周期完成）
      active.md
      status.md
      evidence/
      reviews/
      summary.md
```

## 初始化规则

- 首次运行 `okr-gm` 或 `okr-run` 时创建 `.okr/` 目录和 `active.md`。
- 写入前必须检查 `.okr/` 是否已存在：
  - 不存在 → 创建目录和文件。
  - 已存在且包含内容 → 提示用户选择：覆盖、追加新轮次、或取消。
- 建议在项目 `.gitignore` 中添加 `.okr/`，除非用户明确要求版本控制 OKR 状态。

## active.md 结构

```markdown
---
version: 1
current_act: M0
last_updated: 2026-04-30
updated_by: okr-gm
---

## 甲方需求

用户原始需求文本。

## GM OKR

O-GM：...

| KR | 验收标准 | 证据要求 | 状态 |
| --- | --- | --- | --- |
| GM-KR1 | ... | ... | 未开始 |

### 边界

...

### 待确认

...

## 角色树

```text
GM 甲方总经理（甲方代理）
├─ PD 产品总监
│  ├─ PM 产品经理
│  ├─ UI 设计师
│  └─ TW 文档专家/DX
└─ ArchD 技术总监
   ├─ BE 后端开发工程师
   ├─ FE 前端开发工程师
   ├─ QA 测试工程师
   ├─ DevOps 发布工程师
   └─ SEC 安全工程师
```

### 裁剪说明

...
<!-- PLACEHOLDER_ACTIVE_CONTINUED -->
```

## active.md 结构（续）

```markdown
## 层级 OKR

### PD 产品总监

上级映射：GM-KR1, GM-KR2

O：...

- PD-KR1：...
- PD-KR2：...

### PM 产品经理

上级映射：PD-KR1

O：...

- PM-KR1：...

### ArchD 技术总监

上级映射：GM-KR1, GM-KR2

O：...

- ARCHD-KR1：...

## 交付幕计划

| 幕 | 目标 | 负责人 | 退出门禁 |
| --- | --- | --- | --- |
| M0 需求转译幕 | ... | GM | ... |
| M1 组织拆解幕 | ... | GM | ... |
| M2 方案成型幕 | ... | ... | ... |
| M3 构建验证幕 | ... | ... | ... |
| M4 收敛复盘幕 | ... | GM | ... |

## 交付验证计划

| KR ID | 角色 | 验收标准 | 验证方法 | 证据类型 | 上级映射 |
| --- | --- | --- | --- | --- | --- |
| BE-KR1 | BE 后端开发 | ... | ... | ... | ARCHD-KR1 |
```

### 区块写入规则

每个技能只写入自己负责的区块，不修改其他区块：

| 技能 | 写入区块 |
| --- | --- |
| okr-gm | `## 甲方需求`、`## GM OKR`（含边界和待确认） |
| okr-role-splitter | `## 角色树`（含裁剪说明） |
| okr-planner | `## 层级 OKR`、`## 交付幕计划` |
| okr-execution-plan | `## 交付验证计划` |

写入时更新 frontmatter 的 `last_updated` 和 `updated_by` 字段。

## status.md 结构

```markdown
---
version: 1
last_updated: 2026-04-30
updated_by: okr-role-run
---

## OKR 状态看板

| KR | 上级 KR | 角色 | 幕 | 状态 | 进展 | 证据 | 下一步 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PM-KR1 | GM-KR1 | PM 产品经理 | M2 | 未开始 | 0.0 | 无 | ... |
```

### 初始化规则

- `okr-planner` 或 `okr-execution-plan` 执行后，根据角色 OKR 生成初始 `status.md`，所有 KR 状态为"未开始"。
- `okr-role-run` 执行后更新对应 KR 行的状态、进展、证据和下一步。

### 状态流转规则

只允许以下状态值：`未开始`、`进行中`、`阻塞`、`已完成`、`放弃`。

合法流转：
- 未开始 → 进行中
- 进行中 → 已完成（必须有证据）、阻塞、放弃
- 阻塞 → 进行中、放弃
- 已完成和放弃为终态，不可回退（如需重做，创建新 KR）

## evidence/ 目录

每个 KR 一个证据文件，文件名为 KR 编号：

```markdown
# GM-KR1 证据

| 类型 | 路径/引用 | 说明 | 时间 |
| --- | --- | --- | --- |
| 文件 | src/api/login.ts | 登录接口实现 | 2026-04-30 |
| 测试 | tests/login.spec.ts | 登录单元测试通过 | 2026-04-30 |
```

证据类型枚举：`文件`、`测试`、`截图`、`日志`、`文档`、`commit`。

## archive/ 目录

历史 OKR 周期的归档快照，供回溯参考和跨周期对比。

### 归档触发场景

| 场景 | 触发技能 | archived_reason | 归档范围 |
| --- | --- | --- | --- |
| 用户在断点续跑时选择"重新开始" | okr-run | `user-restart` | active.md + status.md（文件级） |
| M4 评分复盘完成后的周期归档 | okr-review-score | `cycle-complete` | active.md + status.md + evidence/ + reviews/（目录级） |
| 用户确认本轮结束 | okr-next-cycle | `cycle-complete` | 同上 |
| 用户手动触发归档 | okr-archive | `manual` | 同上 |

### 归档格式

#### 文件级归档（user-restart）

用于断点重启场景，仅归档核心状态文件：

```text
.okr/archive/
  <YYYY-MM-DD>-active.md
  <YYYY-MM-DD>-status.md
```

- 命名规则：`<YYYY-MM-DD>-<原文件名>.md`。
- 同一天多次归档时追加序号：`<YYYY-MM-DD>-active-2.md`。

#### 目录级归档（cycle-complete / manual）

用于周期完成或手动归档，完整保存整个周期的所有产出：

```text
.okr/archive/
  <YYYY-MM-DD>-cycle/
    active.md
    status.md
    evidence/
      PM-KR1.md
      BE-KR1.md
      ...
    reviews/
      <YYYY-MM-DD>.md
    summary.md          # 归档摘要
```

- 目录命名规则：`<YYYY-MM-DD>-cycle/`。
- 同一天多次归档时追加序号：`<YYYY-MM-DD>-cycle-2/`。
- `summary.md` 包含：GM 最终 R、需求摘要、KR 完成统计、参与角色列表。

### 归档文件结构

归档文件保持原文件的完整内容不变，仅在 frontmatter 中追加归档元数据：

```markdown
---
version: 1
current_act: M4
last_updated: 2026-04-30
updated_by: okr-review-score
archived_at: 2026-04-30
archived_reason: cycle-complete
---

（原文件完整内容）
```

### summary.md 结构

```markdown
---
archived_at: 2026-04-30
archived_reason: cycle-complete
gm_final_r: 0.72
---

## 归档摘要

- **需求**: （一句话概括甲方需求）
- **GM 最终 R**: 0.72
- **KR 完成**: 25/30（已完成/总数）
- **参与角色**: GM, PD, PM, ArchD, BE, FE, QA, DevOps, TW

## 周期时间线

- 开始: 2026-04-28
- 结束: 2026-04-30
- 交付幕: M0 → M1 → M2 → M3 → M4
```

### frontmatter 归档字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| archived_at | string | 归档日期 YYYY-MM-DD |
| archived_reason | string | 归档原因：`user-restart`（断点重启）、`cycle-complete`（周期完成）、`manual`（手动归档） |
| gm_final_r | number | GM 最终 R 分数（仅 summary.md） |

### 清理规则

归档完成后，清空工作区状态文件：

| 文件/目录 | 操作 | 说明 |
| --- | --- | --- |
| `.okr/active.md` | 删除 | 已归档 |
| `.okr/status.md` | 删除 | 已归档 |
| `.okr/evidence/` | 删除 | 已归档 |
| `.okr/reviews/` | 删除 | 已归档 |
| `.okr/wisdom/` | **保留** | 角色经验跨周期积累 |
| `.okr/archive/` | **保留** | 历史归档 |

### 用户确认

- 归档和清理前必须向用户展示归档摘要并请求确认。
- 用户拒绝归档时，跳过归档和清理步骤。

## reviews/ 目录

每次评分复盘一个文件，文件名为日期：

```markdown
---
act: M4
last_updated: 2026-04-30
---

## 上级评分

| 评分人 | 被评分人 | KR | 分数 | 证据 | 说明 |
| --- | --- | --- | --- | --- | --- |
| GM | PM 产品经理 | PM-KR1 | 1.0 | docs/flows.md | ... |

## 汇总

产品线 R：...
技术线 R：...
GM 最终 R：...

## 价值总结

### 交付价值
...

### 能力提升
...

### 关键洞察
...

### 投入建议
...

## 结论

...
```

## 上下文传递协议

DoWithOKR 技能之间通过 `.okr/` 状态文件实现上下文传递，不依赖对话历史或内存。

### 传递机制

- **文件级传递**：技能 A 写入 `.okr/active.md` → 技能 B 读取同一文件。
- **区块级定位**：用 Markdown 二级标题作为区块 ID，技能只读写自己负责的区块。
- **版本标记**：每次写入更新 frontmatter 的 `last_updated` 和 `updated_by`，下游技能可据此判断上游是否已执行。

### 技能依赖图

```text
okr-gm ──写入──> active.md [## GM OKR]
    │  ──可选读取──> wisdom/gm.md
    │
    ▼
okr-role-splitter ──读取 GM OKR──写入──> active.md [## 角色树]
    │
    ▼
okr-planner ──读取 GM OKR + 角色树──写入──> active.md [## 层级 OKR, ## 交付幕计划]
    │                                  └──创建──> status.md
    ▼
okr-execution-plan ──读取 层级 OKR──写入──> active.md [## 交付验证计划]
    │
    ▼
okr-role-run ──读取 active.md + status.md──更新──> status.md + evidence/
    │  ──可选读取──> wisdom/{role}.md
    │
    ▼
okr-status-tracker ──读取 status.md──展示（只读）
    │
okr-alignment-check ──读取 active.md──分析（只读）
    │
    ▼
okr-review-score ──读取 status.md + evidence/──写入──> reviews/ + wisdom/
    │                                          └──归档──> archive/<date>-cycle/
    ▼
okr-next-cycle ──读取 reviews/ + status.md + wisdom/──建议（确认后归档+清理）
    │
okr-archive ──读取 active.md + status.md──归档──> archive/<date>-cycle/（手动触发）
```

### 前置区块验证规则

每个技能在执行前必须验证其依赖的区块存在：

| 技能 | 依赖的区块 | 缺失时的处理 |
| --- | --- | --- |
| okr-gm | 无（入口技能） | 直接执行 |
| okr-role-splitter | `## GM OKR` | 提示先运行 okr-gm |
| okr-planner | `## GM OKR` + `## 角色树` | 提示先运行 okr-role-splitter |
| okr-execution-plan | `## 层级 OKR` + `## 交付幕计划` | 提示先运行 okr-planner |
| okr-role-run | `## 层级 OKR` + `status.md` | 提示先运行 okr-planner |
| okr-status-tracker | `status.md` | 提示先运行 okr-planner |
| okr-alignment-check | `## GM OKR` | 提示先运行 okr-gm |
| okr-review-score | `status.md` + `## 角色树` | 提示先运行 okr-planner |
| okr-next-cycle | `reviews/` 非空 | 提示先运行 okr-review-score |
| okr-archive | `active.md` 存在 | 提示无可归档的 OKR 周期 |

### 编排验证协议（okr-run 专用）

`okr-run` 在调用每个子技能后，必须验证其产出：

| 子技能调用 | 验证条件 | 失败处理 |
| --- | --- | --- |
| okr-gm | `active.md` 包含 `## GM OKR` | 停止，报告 GM OKR 生成失败 |
| okr-role-splitter | `active.md` 包含 `## 角色树` | 停止，报告角色树生成失败 |
| okr-planner | `active.md` 包含 `## 层级 OKR` + `## 交付幕计划`；`status.md` 存在 | 停止，报告 OKR 规划失败 |
| okr-execution-plan | `active.md` 包含 `## 交付验证计划` | 停止，报告交付验证计划生成失败 |
| okr-role-run | `status.md` 中目标 KR 状态已更新 | 记录失败，继续执行其他角色 |
| okr-review-score | `reviews/` 目录下新增评分文件 | 停止，报告评分生成失败 |

## frontmatter 字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| version | number | 文件格式版本，当前为 1 |
| current_act | string | 当前所在交付幕（M0-M4），仅 active.md |
| last_updated | string | 最后更新日期 YYYY-MM-DD |
| updated_by | string | 最后更新的技能名称 |
| act | string | 评分对应的交付幕，仅 reviews/ |
| archived_at | string | 归档日期 YYYY-MM-DD，仅 archive/ 文件 |
| archived_reason | string | 归档原因（如 `user-restart`），仅 archive/ 文件 |
