import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildRunPrompt, detectRunner, startOkrRun, buildRunnerCommand } from "./okr-run-web-runner.mjs";

// --- buildRunPrompt 测试 ---
const rawPrompt = buildRunPrompt({ mode: "raw", requirement: "做登录模块" });
assert.ok(rawPrompt.includes("使用 okr-run"), `raw prompt should include okr-run, got: ${rawPrompt}`);
assert.ok(rawPrompt.includes("做登录模块"));

const gmPrompt = buildRunPrompt({
  mode: "gm",
  objective: "交付权限能力",
  keyResults: ["GM-KR1：完成 RBAC"],
  boundaries: "不含 SSO",
});
assert.ok(gmPrompt.includes("从已确认 GM OKR 继续执行"), `gm prompt should include continue text, got: ${gmPrompt}`);
assert.ok(gmPrompt.includes("交付权限能力"));

// --- detectRunner 测试 ---
// 显式指定 runner
assert.equal(detectRunner({ DOWITHOKR_RUNNER: "codex" }).runner, "codex");
assert.equal(detectRunner({ DOWITHOKR_RUNNER: "claude" }).runner, "claude");
assert.equal(detectRunner({ DOWITHOKR_RUNNER: "manual" }).runner, "manual");

// 无可用 runner 时降级为 manual
const noRunnerEnv = { PATH: "/nonexistent" };
const detected = detectRunner(noRunnerEnv);
assert.equal(detected.runner, "manual");

// --- startOkrRun 测试 ---
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "okr-web-runner-"));
fs.mkdirSync(path.join(tmpRoot, ".okr", "web"), { recursive: true });

// manual 模式返回 command: null 并追加事件
const result = startOkrRun(tmpRoot, { mode: "raw", requirement: "做登录" }, { runner: "manual" });
assert.equal(result.mode, "manual");
assert.equal(result.command, null);
assert.ok(result.prompt.includes("okr-run"));

const eventsContent = fs.readFileSync(path.join(tmpRoot, ".okr", "web", "events.jsonl"), "utf8");
assert.ok(eventsContent.includes("manual-required"));

// codex 模式返回命令
const codexResult = startOkrRun(tmpRoot, { mode: "raw", requirement: "做登录" }, { runner: "codex", dryRun: true });
assert.equal(codexResult.mode, "codex");
assert.ok(codexResult.command.includes("codex"));

// claude 模式返回命令
const claudeResult = startOkrRun(tmpRoot, { mode: "raw", requirement: "做登录" }, { runner: "claude", dryRun: true });
assert.equal(claudeResult.mode, "claude");
assert.ok(claudeResult.command.includes("claude"));
const claudeCommand = buildRunnerCommand("claude", tmpRoot, rawPrompt);
assert.deepEqual(claudeCommand.args, ["-p", rawPrompt]);
assert.ok(!claudeCommand.args.includes("--cwd"), "Claude runner should rely on spawn cwd instead of unsupported --cwd");

// runner 命令参数必须可结构化执行，避免只能展示不能运行
const codexCommand = buildRunnerCommand("codex", tmpRoot, rawPrompt);
assert.deepEqual(codexCommand.args.slice(0, 3), ["exec", "--full-auto", "-C"]);
assert.equal(codexCommand.args[3], tmpRoot);
assert.equal(codexCommand.args[4], rawPrompt);

// 非 dryRun 时必须真实启动 runner 进程并记录事件
const fakeBin = fs.mkdtempSync(path.join(os.tmpdir(), "okr-web-bin-"));
const marker = path.join(tmpRoot, "runner-called.json");
fs.writeFileSync(path.join(fakeBin, "codex"), [
  "#!/bin/sh",
  `printf '%s\\n' "$@" > ${JSON.stringify(marker)}`
].join("\n"), { mode: 0o755 });
const spawned = startOkrRun(tmpRoot, { mode: "raw", requirement: "做登录" }, {
  env: { PATH: fakeBin },
});
assert.equal(spawned.mode, "codex");
assert.ok(spawned.pid > 0);
assert.ok(spawned.logPath.includes(".okr/web/runs/"));
for (let i = 0; i < 10 && !fs.existsSync(marker); i++) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}
assert.ok(fs.existsSync(marker), "runner process should be invoked");
for (let i = 0; i < 10 && !fs.readFileSync(path.join(tmpRoot, ".okr", "web", "events.jsonl"), "utf8").includes("completed"); i++) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}
const spawnedArgs = fs.readFileSync(marker, "utf8");
assert.ok(spawnedArgs.includes("exec"));
const spawnedEvents = fs.readFileSync(path.join(tmpRoot, ".okr", "web", "events.jsonl"), "utf8");
assert.ok(spawnedEvents.includes("started"));
assert.ok(spawnedEvents.includes("completed"));
assert.ok(fs.existsSync(path.join(tmpRoot, spawned.logPath)), "runner log should be written");

// 清理
fs.rmSync(tmpRoot, { recursive: true, force: true });
fs.rmSync(fakeBin, { recursive: true, force: true });

console.log("All runner tests passed");
