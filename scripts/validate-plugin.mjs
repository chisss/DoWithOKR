import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const skills = fs.readdirSync(path.join(root, "skills"))
  .filter((name) => fs.existsSync(path.join(root, "skills", name, "SKILL.md")))
  .sort();
const refs = [
  "gm-okr-template.md",
  "role-tree-template.md",
  "status-board-template.md",
  "score-review-template.md",
  "okr-state-spec.md",
  "claude-routing-rules.md",
  "evidence-spec.md"
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  assert.ok(fs.existsSync(path.join(root, relativePath)), `${relativePath} must exist`);
}

/**
 * 解析 YAML frontmatter（--- 之间的内容），返回 key-value 对象。
 * 仅支持简单的 `key: value` 格式，无需外部 YAML 库。
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split("\n")) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (m) fields[m[1]] = m[2].trim();
  }
  return fields;
}

/**
 * 提取指定 ## 标题下的内容行（到下一个 ## 或文件末尾）。
 */
function extractSection(content, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^${escaped}\\s*$\\n([\\s\\S]*?)(?=^## |\\Z)`, "m");
  const match = content.match(re);
  if (!match) return null;
  // 返回去掉首尾空行后的内容行
  return match[1].trim().split("\n").filter((l) => l.trim().length > 0);
}

// 按技能名分组收集错误
const errorsBySkill = {};
function addError(skill, message) {
  if (!errorsBySkill[skill]) errorsBySkill[skill] = [];
  errorsBySkill[skill].push(message);
}

// 全局错误（不属于某个技能）
const globalErrors = [];

// --- 1. 插件清单校验（保持原有逻辑） ---
for (const manifest of [".codex-plugin/plugin.json", ".claude-plugin/plugin.json"]) {
  exists(manifest);
  const json = JSON.parse(read(manifest));
  assert.equal(json.name, "dowithokr");
  assert.ok(json.description.includes("OKR"));
}

// --- 2. 技能 SKILL.md 校验 ---
const requiredSections = [
  "## 执行规则",
  "## 输出格式",
  "## 前置读取",
  "## 产出写入",
  "## 前置条件",
  "## 执行步骤",
  "## 异常处理"
];

for (const skill of skills) {
  const file = `skills/${skill}/SKILL.md`;
  exists(file);
  const content = read(file);

  // 2a. YAML frontmatter 校验
  const fm = parseFrontmatter(content);
  if (!fm) {
    addError(skill, `${file} missing YAML frontmatter (--- block)`);
  } else {
    if (!fm.name) {
      addError(skill, `${file} frontmatter missing 'name' field`);
    } else if (fm.name !== skill) {
      addError(skill, `${file} frontmatter name '${fm.name}' does not match directory '${skill}'`);
    }
    if (!fm.description || fm.description.length === 0) {
      addError(skill, `${file} frontmatter missing or empty 'description' field`);
    }
  }

  // 2b. 必需章节校验（保持原有逻辑）
  for (const section of requiredSections) {
    // Role Preamble 是 前置读取 的升级版，两者等价
    if (section === "## 前置读取" && content.includes("## Role Preamble")) {
      continue;
    }
    if (!content.includes(section)) {
      addError(skill, `${file} missing ${section}`);
    }
  }

  // 2c. .okr/ 状态文件引用校验（保持原有逻辑）
  if (!content.includes(".okr/")) {
    addError(skill, `${file} does not reference .okr/ state files`);
  }

  // 2d. 最小行数校验（保持原有逻辑）
  const lines = content.split("\n").length;
  if (lines < 50) {
    addError(skill, `${file} too thin: ${lines} lines (minimum 50)`);
  }

  // 2e. 模板引用校验：检查引用的 references/*.md 文件是否存在
  const refPattern = /references\/[\w-]+\.md/g;
  let refMatch;
  while ((refMatch = refPattern.exec(content)) !== null) {
    const refPath = refMatch[0];
    if (!fs.existsSync(path.join(root, refPath))) {
      addError(skill, `${file} references '${refPath}' but file does not exist`);
    }
  }

  // 2f. 执行步骤最小行数校验（至少 5 行有效内容）
  const stepLines = extractSection(content, "## 执行步骤");
  if (stepLines === null) {
    // 已在必需章节校验中报告
  } else if (stepLines.length < 5) {
    addError(skill, `${file} '## 执行步骤' has only ${stepLines.length} content lines (minimum 5)`);
  }

  // 2g. 前置读取（或 Role Preamble）必须引用 .okr/ 文件
  let readSection = extractSection(content, "## 前置读取");
  if (!readSection) {
    readSection = extractSection(content, "## Role Preamble（角色上下文加载）");
  }
  if (readSection !== null) {
    const readText = readSection.join("\n");
    if (!readText.includes(".okr/")) {
      addError(skill, `${file} '## 前置读取' does not reference any .okr/ files`);
    }
  }

  // 2h. 产出写入必须引用 .okr/ 文件
  const writeSection = extractSection(content, "## 产出写入");
  if (writeSection !== null) {
    const writeText = writeSection.join("\n");
    if (!writeText.includes(".okr/")) {
      addError(skill, `${file} '## 产出写入' does not reference any .okr/ files`);
    }
  }
}

// --- 3. 引用文件存在性校验（保持原有逻辑） ---
for (const ref of refs) {
  exists(`references/${ref}`);
}

// --- 4. 状态规范校验（保持原有逻辑） ---
const stateSpec = read("references/okr-state-spec.md");
assert.ok(stateSpec.includes("active.md"), "state spec must define active.md");
assert.ok(stateSpec.includes("status.md"), "state spec must define status.md");
assert.ok(stateSpec.includes("evidence/"), "state spec must define evidence/");
assert.ok(stateSpec.includes("reviews/"), "state spec must define reviews/");

// --- 5. 路由规则校验（保持原有逻辑） ---
const routingRules = read("references/claude-routing-rules.md");
for (const skill of skills) {
  assert.ok(routingRules.includes(`/${skill}`), `routing rules must reference /${skill}`);
}

// --- 6. 文档校验（保持原有逻辑） ---
const docs = read("docs/DoWithOKR-product-document.md") + read("docs/DoWithOKR-output-format-spec.md");
assert.ok(docs.includes("交付幕"));
assert.ok(docs.includes("上级评分"));
assert.ok(docs.includes("GM OKR"));

// --- 7. 安装脚本校验（保持原有逻辑） ---
exists("install.sh");
exists("uninstall.sh");

// --- 8. okr-run-web 运行时资源校验 ---
exists("scripts/okr-run-web.mjs");
exists("scripts/okr-run-web-state.mjs");
exists("scripts/okr-run-web-runner.mjs");
exists("web/okr-run-web/index.html");

// --- 汇总错误并输出 ---
const allSkillErrors = Object.entries(errorsBySkill);
const totalErrors = allSkillErrors.reduce((sum, [, errs]) => sum + errs.length, 0) + globalErrors.length;

if (totalErrors > 0) {
  console.error(`Validation failed with ${totalErrors} error(s):\n`);
  for (const err of globalErrors) {
    console.error(`  [global] ${err}`);
  }
  for (const [skill, errs] of allSkillErrors) {
    console.error(`  [${skill}]`);
    for (const e of errs) {
      console.error(`    - ${e}`);
    }
  }
  process.exit(1);
}

console.log("DoWithOKR plugin validation passed");
