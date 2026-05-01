import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { appendWebEvent, readOkrState, renderUserGmActive, writeUserGmOkr, readWebEvents, parseMarkdownTable, extractSection } from "./okr-run-web-state.mjs";

// 创建临时 .okr/ 目录
const root = fs.mkdtempSync(path.join(os.tmpdir(), "okr-web-state-"));
fs.mkdirSync(path.join(root, ".okr", "evidence"), { recursive: true });
fs.writeFileSync(path.join(root, ".okr", "active.md"), [
  "---",
  "current_act: M2",
  "---",
  "## 甲方需求",
  "做登录权限模块",
  "## GM OKR",
  "O-GM：交付安全可用的登录权限能力",
  "| KR | 验收标准 | 证据要求 | 状态 |",
  "| --- | --- | --- | --- |",
  "| GM-KR1 | 完成登录闭环 | 测试记录 | 进行中 |",
  "## 角色树",
  "GM 甲方总经理",
  "└── ArchD 技术总监",
  "    └── BE 后端开发工程师",
  "## 层级 OKR",
  "### BE 后端开发工程师",
  "上级映射：ARCHD-KR1 -> GM-KR1",
  "- BE-KR1：完成登录接口"
].join("\n"));
fs.writeFileSync(path.join(root, ".okr", "status.md"), [
  "## OKR 状态看板",
  "| KR | 上级 KR | 角色 | 幕 | 状态 | 进展 | 证据 | 下一步 |",
  "| --- | --- | --- | --- | --- | --- | --- | --- |",
  "| BE-KR1 | ARCHD-KR1 | BE 后端开发 | M3 | 进行中 | 0.6 | .okr/evidence/BE-KR1.md | 补测试 |"
].join("\n"));

// --- readOkrState 测试 ---
const state = readOkrState(root);
assert.equal(state.currentAct, "M2");
assert.equal(state.sections.gmOkr.includes("GM-KR1"), true);
assert.equal(state.statusRows[0].kr, "BE-KR1");
assert.equal(state.statusRows[0].progress, "0.6");
assert.equal(state.hasActive, true);
assert.ok(state.sections.requirement.includes("做登录权限模块"));
assert.ok(state.sections.roleTree.includes("GM 甲方总经理"));
assert.ok(state.sections.hierarchicalOkr.includes("BE-KR1"));
assert.ok(Array.isArray(state.evidenceFiles));
assert.ok(Array.isArray(state.events));
assert.ok(Array.isArray(state.parseWarnings));
assert.ok(state.updatedAt);

// --- renderUserGmActive 测试 ---
const gm = renderUserGmActive({ objective: "交付权限能力", keyResults: ["GM-KR1：完成 RBAC"], boundaries: "不含 SSO" });
assert.equal(gm.includes("source: user_gm_input"), true);
assert.equal(gm.includes("current_act: M1"), true);
assert.equal(gm.includes("## GM OKR"), true);
assert.ok(gm.includes("交付权限能力"));
assert.ok(gm.includes("GM-KR1"));
assert.ok(gm.includes("不含 SSO"));

// --- writeUserGmOkr 测试 ---
const writeRoot = fs.mkdtempSync(path.join(os.tmpdir(), "okr-web-write-"));
writeUserGmOkr(writeRoot, { objective: "测试目标", keyResults: ["KR1：测试结果"], boundaries: "无" });
const written = fs.readFileSync(path.join(writeRoot, ".okr", "active.md"), "utf8");
assert.ok(written.includes("## GM OKR"));
assert.ok(written.includes("user_gm_input"));
assert.ok(written.includes("测试目标"));
assert.ok(written.includes("current_act: M1"));

// --- appendWebEvent / readWebEvents 测试 ---
appendWebEvent(root, { skill: "okr-gm", act: "M0", status: "completed", summary: "GM OKR 已生成" });
const eventsContent = fs.readFileSync(path.join(root, ".okr", "web", "events.jsonl"), "utf8");
assert.ok(eventsContent.includes("okr-gm"));
const events = readWebEvents(root);
assert.equal(events.length, 1);
assert.equal(events[0].skill, "okr-gm");

appendWebEvent(root, { skill: "okr-role-splitter", act: "M1", status: "completed", summary: "角色树已生成" });
const events2 = readWebEvents(root);
assert.equal(events2.length, 2);

// 坏事件行不能导致整份执行日志丢失
fs.appendFileSync(path.join(root, ".okr", "web", "events.jsonl"), "{bad json}\n", "utf8");
appendWebEvent(root, { skill: "okr-planner", act: "M1", status: "completed", summary: "层级 OKR 已生成" });
const stateWithBadEvent = readOkrState(root);
assert.equal(stateWithBadEvent.events.length, 3);
assert.ok(stateWithBadEvent.parseWarnings.some((w) => w.includes("events.jsonl line")));

// --- parseMarkdownTable 测试 ---
const tableRows = parseMarkdownTable([
  "| KR | 状态 |",
  "| --- | --- |",
  "| GM-KR1 | 进行中 |",
  "| GM-KR2 | 未开始 |"
].join("\n"));
assert.equal(tableRows.length, 2);
assert.equal(tableRows[0].KR, "GM-KR1");
assert.equal(tableRows[1]["状态"], "未开始");

const escapedTableRows = parseMarkdownTable([
  "| KR | 说明 | 状态 |",
  "| --- | --- | --- |",
  "| GM-KR1 | 支持 A\\|B 权限 | 进行中 |",
  "| GM-KR2 | [证据](docs/a\\|b.md) | |"
].join("\n"));
assert.equal(escapedTableRows.length, 2);
assert.equal(escapedTableRows[0]["说明"], "支持 A|B 权限");
assert.equal(escapedTableRows[1]["状态"], "");

// 证据与评分内容应可供 Web 页面直接展示
fs.writeFileSync(path.join(root, ".okr", "evidence", "BE-KR1.md"), "# BE-KR1 证据\n\n| 类型 | 路径/引用 |\n| --- | --- |\n| 测试 | tests/login.spec.ts |", "utf8");
fs.mkdirSync(path.join(root, ".okr", "reviews"), { recursive: true });
fs.writeFileSync(path.join(root, ".okr", "reviews", "2026-05-01.md"), "## 汇总\n\nGM 最终 R：0.82", "utf8");
const richState = readOkrState(root);
assert.equal(richState.evidenceItems[0].name, "BE-KR1.md");
assert.ok(richState.evidenceItems[0].content.includes("tests/login.spec.ts"));
assert.equal(richState.reviewItems[0].name, "2026-05-01.md");
assert.ok(richState.finalResult.includes("GM 最终 R：0.82"));

// --- extractSection 测试 ---
const md = "## 甲方需求\n做登录\n## GM OKR\nO-GM：目标\n## 角色树\nGM";
assert.ok(extractSection(md, "甲方需求").includes("做登录"));
assert.ok(extractSection(md, "GM OKR").includes("O-GM"));
assert.equal(extractSection(md, "不存在的章节"), "");

// --- 空项目测试 ---
const emptyRoot = fs.mkdtempSync(path.join(os.tmpdir(), "okr-web-empty-"));
const emptyState = readOkrState(emptyRoot);
assert.equal(emptyState.hasActive, false);
assert.equal(emptyState.currentAct, "");
assert.equal(emptyState.statusRows.length, 0);

// 清理
fs.rmSync(root, { recursive: true, force: true });
fs.rmSync(writeRoot, { recursive: true, force: true });
fs.rmSync(emptyRoot, { recursive: true, force: true });

console.log("All state tests passed");
