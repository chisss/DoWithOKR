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
