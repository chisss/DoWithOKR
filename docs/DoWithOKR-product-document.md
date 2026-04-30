# DoWithOKR 产品文档

**版本**：0.5  
**日期**：2026-04-30  
**目标平台**：Claude Code、Codex  
**产品形态**：一个“用 OKR 开展工作的小型技术公司”插件。  
**核心定位**：用户是甲方，DoWithOKR 是乙方小团队；Boss 将用户自然语言需求转成 Boss OKR，再拆解为层级角色 OKR，并通过虚拟交付阶段、状态看板和上级评分收敛最终 R。

## 1. 本轮评估结论

上一版产品方向成立，但还有三处需要补强：

- **阶段模型不应照搬现实时间**：双周、月度、季度只是现实组织的时间容器；插件应使用自己的虚拟交付阶段，用交付证据而不是日历时间推动流转。
- **输出格式需要标准化**：每个技能都应有固定展示格式，用户才能稳定看到 OKR 树、状态看板、进展、评分和复盘。
- **上下级 OKR 与评分关系需要显性化**：Boss 下有产品经理和架构师，架构师下可有后端、前端、测试等角色；评分应默认由上级根据下级 KR 证据给出。

## 2. 产品心智

DoWithOKR 的隐喻是“小型技术乙方公司”：

- **用户 / 甲方**：提出需求、确认方向、验收最终结果。
- **Boss / 乙方总负责人**：代表用户需求制定 Boss OKR，并协调团队交付。
- **专业角色团队**：围绕上级 OKR 拆解自己的 OKR 并执行。
- **OKR 看板**：展示层级、状态、阻塞、证据、评分。
- **最终 R**：可交付产品、验证证据、评分与复盘结论。

Boss 不是强控制型 CEO，也不是替用户做主的人。Boss 是用户需求代理、项目负责人和 OKR 翻译器：把甲方需求变成乙方团队可执行、可验收的目标系统。

## 3. 执行方式

### 3.1 全自动总命令：`okr-run`

用户一句话交给 DoWithOKR 跑完整闭环：

```text
使用 DoWithOKR 运行这个需求：做一个用户登录与权限管理模块。
```

链路：甲方需求 → Boss OKR → 角色树 → 角色 OKR → 交付幕计划 → 角色执行 → 状态看板 → 对齐检查 → 上级评分 → 最终 R。全自动模式仍需保留确认点：写入状态文件前、高风险操作前、需求范围变化时、证据不足却准备标记完成时。

### 3.2 分步技能模式

用户逐步触发 `okr-boss`、`okr-role-splitter`、`okr-planner`、`okr-execution-plan`、`okr-status-tracker`、`okr-alignment-check`、`okr-review-score`、`okr-next-cycle`。该模式适合真实项目推进和人工把关。

### 3.3 按角色执行：`okr-role-run`

Boss OKR 和角色 OKR 生成后，用户可指定角色或某个 KR 执行：

```text
DoWithOKR，先执行产品经理角色的 OKR。
DoWithOKR，执行架构师下面后端开发的 KR2。
DoWithOKR，让测试工程师根据当前交付做验收。
```

推荐顺序：产品经理 → 架构师 → 后端/前端并行 → 测试 → DevOps / 发布 → 技术写作 / DX。用户可跳过、重排或指定角色；Boss 只提示风险，不强制阻止。

## 4. 组织树与上下级 OKR

默认组织树：

```text
Boss
  产品经理
    技术写作 / DX
  架构师
    后端开发
    前端开发
    测试工程师
    DevOps / 发布工程师
    安全工程师
```

规则：

- Boss OKR 来自甲方需求，是所有角色 OKR 的源头。
- 下级角色 OKR 必须映射到上级 KR。
- 上级角色负责给直接下级评分，Boss 负责最终验收与总 R 汇总。
- 小任务可裁剪组织树；例如只保留 Boss、产品经理、后端开发、测试工程师。
- 用户可以手动调整上下级关系，但插件必须提示影响。

## 5. 虚拟阶段模型：交付幕

DoWithOKR 不使用双周、月度、季度等现实时间概念作为阶段。插件使用 **交付幕** 模拟现实时间推进：每一幕代表一个目标状态，是否进入下一幕由证据门禁决定，而不是由天数决定。

| 交付幕 | 目标 | 退出门禁 |
| --- | --- | --- |
| M0 需求转译幕 | 甲方需求变成 Boss OKR | 用户确认 Boss O/K |
| M1 组织拆解幕 | Boss OKR 拆成角色树和角色 OKR | 无无人负责的 Boss KR |
| M2 方案成型幕 | 产品、架构形成可执行方案 | 范围、架构、验收标准明确 |
| M3 构建验证幕 | 研发、测试、交付角色产出证据 | 关键 KR 有交付物和验证记录 |
| M4 收敛复盘幕 | 上级评分并汇总最终 R | 评分、证据、复盘结论完整 |

规模映射：轻量需求可合并 M1/M2 或 M3/M4；复杂需求可重复 M2/M3 多轮。交付幕是虚拟进度，不承诺真实耗时。

## 6. OKR 分层与收敛

DoWithOKR 采用五层结构：

1. **甲方需求**：用户自然语言输入，是所有 OKR 的源头。
2. **Boss OKR**：甲方需求的 OKR 化表达。
3. **角色 OKR**：各角色对上级 KR 的拆解。
4. **交付幕 KR**：每一幕要完成和验证的结果。
5. **最终 R**：交付物、证据、评分、复盘结论。

收敛规则：角色 KR 必须映射到上级 KR；交付幕任务必须映射到角色 KR；下级 R 先汇总为上级 R，最终由 Boss 汇总为总 R；如果局部完成但不贡献 Boss KR，应提示“局部完成但甲方价值未收敛”。

## 7. 多技能矩阵

| 技能 | 类型 | 核心输出 |
| --- | --- | --- |
| `okr-run` | 总编排 | 从甲方需求到最终 R 的完整闭环 |
| `okr-boss` | 需求代理 | Boss OKR、边界、验收口径 |
| `okr-role-splitter` | 组织 | 角色树、上下级关系、参与原因 |
| `okr-planner` | 规划 | 层级 OKR、交付幕计划、映射关系 |
| `okr-execution-plan` | 执行准备 | 按交付幕和角色映射的任务计划 |
| `okr-role-run` | 执行 | 执行某角色或某角色 KR |
| `okr-status-tracker` | 跟踪 | KR 状态看板、阻塞、证据 |
| `okr-alignment-check` | 校准 | 当前任务与上级 OKR 的对齐结论 |
| `okr-review-score` | 复盘 | 上级评分、角色 R、最终 R |
| `okr-next-cycle` | 迭代 | 下一轮交付幕或下一轮 Boss OKR 建议 |

各技能详细输出格式和示例见 [DoWithOKR 输出格式规范](./DoWithOKR-output-format-spec.md)。

## 8. 状态与看板

KR 状态枚举：

- **未开始**：尚未进入执行。
- **进行中**：已有任务或证据产生。
- **阻塞**：存在依赖、决策、环境、信息缺口。
- **已完成**：达到验收标准并有证据。
- **放弃**：明确不再追踪，需说明原因。

看板字段：KR 编号、上级 KR、角色、交付幕、状态、完成度、证据、阻塞、下一步、上级评价。

## 9. 评分机制

评分采用“上级给直接下级打分”的方式：

- Boss 评分产品经理和架构师。
- 产品经理评分技术写作 / DX。
- 架构师评分后端、前端、测试、DevOps、安全等技术角色。
- 每个角色的 O 得分默认取其 KR 平均分。
- 上级评分必须引用下级证据，不能只给主观判断。
- Boss 最终 R 由产品线 R、技术线 R、证据质量、甲方验收结论共同决定。

建议评分口径：0 无进展；0.3 有探索但未形成有效交付；0.7 基本达成且证据可信；1.0 完全达成并超过验收预期。

## 10. 状态文件设计

默认在用户项目中创建：

- `.okr/active.md`：Boss OKR、组织树、角色 OKR、交付幕计划。
- `.okr/status.md`：当前 KR 状态看板。
- `.okr/checkins/YYYY-MM-DD.md`：阶段检查记录。
- `.okr/reviews/YYYY-MM-DD.md`：评分复盘记录。
- `.okr/evidence/`：证据索引。

写入前需用户确认；如果无写入权限，则在对话中输出完整状态。

## 11. 推荐项目结构

```text
DoWithOKR/
  .claude-plugin/plugin.json
  .codex-plugin/plugin.json
  skills/
    okr-run/SKILL.md
    okr-boss/SKILL.md
    okr-role-splitter/SKILL.md
    okr-planner/SKILL.md
    okr-execution-plan/SKILL.md
    okr-role-run/SKILL.md
    okr-status-tracker/SKILL.md
    okr-alignment-check/SKILL.md
    okr-review-score/SKILL.md
    okr-next-cycle/SKILL.md
  references/
    boss-okr-template.md
    role-tree-template.md
    status-board-template.md
    score-review-template.md
  docs/
    DoWithOKR-product-document.md
    DoWithOKR-output-format-spec.md
```

## 12. 成功指标

- Boss OKR 采纳率：用户接受 Boss 对需求 OKR 化表达的比例。
- 角色拆解准确率：用户接受默认角色树的比例。
- 映射完整率：下级 KR 到上级 KR 的映射覆盖率。
- 看板可读率：用户能从看板判断当前进展与阻塞的比例。
- 证据覆盖率：已完成 KR 至少有 1 条证据的比例。
- 最终 R 通过率：用户认可最终交付结果的比例。

## 13. 风险与对策

| 风险 | 影响 | 对策 |
| --- | --- | --- |
| 交付幕概念难懂 | 用户不知道当前在哪里 | 每次输出都显示当前幕、退出门禁、下一幕 |
| Boss 像真实甲方一样擅自改需求 | 偏离用户真实意图 | Boss 只能代理和复述用户需求，重大变化需用户确认 |
| 管理流程过重 | 用户觉得插件啰嗦 | 默认输出看板摘要，详情可展开 |
| 角色 OKR 与上级 OKR 脱节 | 局部完成但整体失败 | 强制维护下级 KR 到上级 KR 映射 |
| 评分主观 | 复盘可信度低 | 评分必须绑定证据和差距说明 |

## 14. MVP 验收标准

- 用户需求能被 Boss 转成清晰 Boss OKR。
- 插件能生成可裁剪的上下级角色树。
- 所有角色 OKR 都能追溯到上级 KR。
- 插件能使用交付幕而非现实时间表达进度。
- 每个核心技能都有固定输出格式。
- 用户能看到 OKR 树、状态看板、进展和评分示例。
- 评分能体现上级对直接下级打分。
- 最终复盘能从下级 R 汇总为 Boss 最终 R。

## 15. 参考资料

- [gstack GitHub 仓库](https://github.com/garrytan/gstack)
- [Claude Code 插件参考文档](https://docs.claude.com/en/docs/claude-code/plugins-reference)
- [Claude Code Skills 文档](https://docs.claude.com/en/docs/claude-code/skills)
- [Codex Plugins Build 文档](https://developers.openai.com/codex/plugins/build)
- [Codex Skills 文档](https://developers.openai.com/codex/skills/)
- [What Matters: Google OKR Playbook](https://www.whatmatters.com/resources/google-okr-playbook)
