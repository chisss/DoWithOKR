# DoWithOKR Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first runnable DoWithOKR plugin package for Claude Code and Codex, with manifests, multiple skills, references, examples, and validation.

**Architecture:** Implement a content-first plugin: manifests register the plugin, each skill is a focused `SKILL.md`, shared output contracts live in `references/`, and `scripts/validate-plugin.mjs` enforces structure and key content. No runtime service is needed for MVP.

**Tech Stack:** Markdown skills, JSON plugin manifests, Node.js built-in `fs/path/assert` validation, shell commands for verification.

---

## File Structure

- Manifests: `DoWithOKR/.codex-plugin/plugin.json`, `DoWithOKR/.claude-plugin/plugin.json`
- Validation: `DoWithOKR/scripts/validate-plugin.mjs`
- Skills: `DoWithOKR/skills/{okr-run,okr-boss,okr-role-splitter,okr-planner,okr-execution-plan,okr-role-run,okr-status-tracker,okr-alignment-check,okr-review-score,okr-next-cycle}/SKILL.md`
- References: `DoWithOKR/references/{boss-okr-template,role-tree-template,status-board-template,score-review-template}.md`
- Example and docs: `DoWithOKR/examples/login-access-okr.md`, `DoWithOKR/README.md`

## Task 1: Validation Harness

**Files:**
- Create: `DoWithOKR/scripts/validate-plugin.mjs`

- [ ] **Step 1: Write the failing validator**

```js
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const skills = [
  "okr-run",
  "okr-boss",
  "okr-role-splitter",
  "okr-planner",
  "okr-execution-plan",
  "okr-role-run",
  "okr-status-tracker",
  "okr-alignment-check",
  "okr-review-score",
  "okr-next-cycle"
];
const refs = [
  "boss-okr-template.md",
  "role-tree-template.md",
  "status-board-template.md",
  "score-review-template.md"
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  assert.ok(fs.existsSync(path.join(root, relativePath)), `${relativePath} must exist`);
}

for (const manifest of [".codex-plugin/plugin.json", ".claude-plugin/plugin.json"]) {
  exists(manifest);
  const json = JSON.parse(read(manifest));
  assert.equal(json.name, "dowithokr");
  assert.ok(json.description.includes("OKR"));
}

for (const skill of skills) {
  const file = `skills/${skill}/SKILL.md`;
  exists(file);
  const content = read(file);
  assert.ok(content.startsWith("---\nname:"), `${file} needs frontmatter`);
  assert.ok(content.includes(`name: ${skill}`), `${file} needs correct name`);
  assert.ok(content.includes("## 输出格式"), `${file} needs output format section`);
  assert.ok(content.includes("## 执行规则"), `${file} needs execution rules`);
}

for (const ref of refs) {
  exists(`references/${ref}`);
}

const docs = read("docs/DoWithOKR-product-document.md") + read("docs/DoWithOKR-output-format-spec.md");
assert.ok(docs.includes("交付幕"));
assert.ok(docs.includes("上级评分"));
assert.ok(docs.includes("Boss OKR"));

console.log("DoWithOKR plugin validation passed");
```

- [ ] **Step 2: Run validator and confirm it fails**

Run: `node DoWithOKR/scripts/validate-plugin.mjs`

Expected: FAIL with a missing `.codex-plugin/plugin.json` assertion.

## Task 2: Plugin Manifests

**Files:**
- Create: `DoWithOKR/.codex-plugin/plugin.json`
- Create: `DoWithOKR/.claude-plugin/plugin.json`

- [ ] **Step 1: Create Codex manifest**

```json
{"name":"dowithokr","version":"0.1.0","description":"A multi-skill OKR plugin that works like a small technical company for AI tasks.","interface":{"displayName":"DoWithOKR"},"skills":{"path":"skills"}}
```

- [ ] **Step 2: Create Claude manifest**

```json
{"name":"dowithokr","version":"0.1.0","description":"A multi-skill OKR plugin that turns user needs into Boss OKR, role OKR, delivery acts, score reviews, and final results.","author":{"name":"DoWithOKR"}}
```

- [ ] **Step 3: Run validator**

Run: `node DoWithOKR/scripts/validate-plugin.mjs`

Expected: FAIL with a missing `skills/okr-run/SKILL.md` assertion.

## Task 3: Shared Reference Templates

**Files:**
- Create: `DoWithOKR/references/boss-okr-template.md`
- Create: `DoWithOKR/references/role-tree-template.md`
- Create: `DoWithOKR/references/status-board-template.md`
- Create: `DoWithOKR/references/score-review-template.md`

- [ ] **Step 1: Create templates with the required sections**

Each template must include these exact headings:

```markdown
# Boss OKR Template
## 甲方需求
## Boss Objective
## Boss Key Results
## 边界
## 待确认
```

```markdown
# Role Tree Template
## 组织树
## 角色职责
## 上下级关系
## 裁剪说明
```

```markdown
# Status Board Template
## OKR 状态看板
| KR | 上级 KR | 角色 | 幕 | 状态 | 进展 | 证据 | 下一步 |
```

```markdown
# Score Review Template
## OKR 评分复盘
## 上级评分
## 汇总
## 下一轮建议
```

- [ ] **Step 2: Run validator**

Run: `node DoWithOKR/scripts/validate-plugin.mjs`

Expected: FAIL with missing skill assertions only.

## Task 4: Planning Skills

**Files:**
- Create: `DoWithOKR/skills/{okr-boss,okr-role-splitter,okr-planner}/SKILL.md`

- [ ] **Step 1: Create `okr-boss`**

Required content:

```markdown
---
name: okr-boss
description: Convert user/client needs into Boss OKR, scope, acceptance criteria, and confirmation questions.
---

# OKR Boss

## 执行规则
- 把用户自然语言需求视为甲方需求。
- Boss 只能代理和复述用户需求，不能擅自扩大范围。
- 输出 Boss Objective 和 2-5 个 Boss Key Results。
- 每个 KR 必须包含验收标准、证据要求和状态。

## 输出格式
使用 `references/boss-okr-template.md`，并展示 Boss OKR、边界、待确认问题。
```

- [ ] **Step 2: Create `okr-role-splitter` and `okr-planner`**

Use the same frontmatter pattern. `okr-role-splitter` must mention `角色树`, `上下级关系`, `参与原因`. `okr-planner` must mention `层级 OKR`, `交付幕计划`, `映射关系`, `M0`, `M1`, `M2`, `M3`, `M4`.

- [ ] **Step 3: Run validator**

Run: `node DoWithOKR/scripts/validate-plugin.mjs`

Expected: FAIL with missing execution/tracking skill assertions only.

## Task 5: Execution And Review Skills

**Files:**
- Create: remaining seven `DoWithOKR/skills/*/SKILL.md` files

- [ ] **Step 1: Create execution skills**

Create `okr-run`, `okr-execution-plan`, and `okr-role-run`. Each must include `## 执行规则` and `## 输出格式`. Required phrases:

```text
甲方需求 -> Boss OKR -> 角色树 -> 角色 OKR -> 交付幕计划 -> 状态看板 -> 上级评分 -> 最终 R
```

```text
上级映射
证据
未开始、进行中、阻塞、已完成、放弃
```

- [ ] **Step 2: Create tracking and review skills**

Create `okr-status-tracker`, `okr-alignment-check`, `okr-review-score`, and `okr-next-cycle`. Required phrases:

```text
OKR 状态看板
当前任务与上级 OKR 的对齐结论
上级给直接下级打分
评分必须绑定证据和差距说明
```

- [ ] **Step 3: Run validator**

Run: `node DoWithOKR/scripts/validate-plugin.mjs`

Expected: PASS with `DoWithOKR plugin validation passed`.

## Task 6: Example And README

**Files:**
- Create: `DoWithOKR/examples/login-access-okr.md`
- Modify: `DoWithOKR/README.md`

- [ ] **Step 1: Add example scenario**

The example must include:

```markdown
# Login And Access Control OKR Example
## 甲方需求
## Boss OKR
## 角色树
## 层级 OKR
## 交付幕计划
## OKR 状态看板
## 上级评分
## 最终 R
```

- [ ] **Step 2: Update README**

Add sections:

```markdown
## Plugin Structure
## Skills
## Usage
## Validation
```

Include the command: `node scripts/validate-plugin.mjs`

- [ ] **Step 3: Run final validation**

Run from `DoWithOKR`: `node scripts/validate-plugin.mjs`

Expected: PASS with `DoWithOKR plugin validation passed`.

## Self-Review Checklist

- [ ] Product doc requirements covered: small technical company, Boss OKR proxy, role tree, delivery acts.
- [ ] Output spec covered: OKR board, progress, alignment, scoring, final R.
- [ ] Validation script checks every required skill and reference.
- [ ] Skill files contain no unresolved markers.

## Execution Handoff

Plan complete and saved to `DoWithOKR/docs/superpowers/plans/2026-04-30-dowithokr-plugin.md`.

Two execution options: **Subagent-Driven (recommended)** with one fresh worker per task, or **Inline Execution** in this session using executing-plans with checkpoints.
