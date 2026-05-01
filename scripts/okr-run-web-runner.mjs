import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { appendWebEvent } from "./okr-run-web-state.mjs";

/**
 * 构建 okr-run 的执行 prompt
 */
export function buildRunPrompt(input) {
  if (input.mode === "gm") {
    const krs = (input.keyResults || []).join("\n");
    return [
      `从已确认 GM OKR 继续执行 okr-run。`,
      `Objective: ${input.objective}`,
      `Key Results:\n${krs}`,
      input.boundaries ? `边界: ${input.boundaries}` : "",
    ].filter(Boolean).join("\n");
  }
  return `使用 okr-run 技能运行这个需求：${input.requirement}`;
}

/**
 * 检测可用的 runner：DOWITHOKR_RUNNER > codex > claude > manual
 */
export function detectRunner(env = process.env) {
  if (env.DOWITHOKR_RUNNER) {
    return { runner: env.DOWITHOKR_RUNNER };
  }
  try {
    execSync("which codex", { env, stdio: "ignore" });
    return { runner: "codex" };
  } catch {}
  try {
    execSync("which claude", { env, stdio: "ignore" });
    return { runner: "claude" };
  } catch {}
  return { runner: "manual" };
}

/**
 * 启动 okr-run 执行
 */
export function startOkrRun(projectRoot, input, options = {}) {
  const runner = options.runner || detectRunner().runner;
  const prompt = buildRunPrompt(input);
  const dryRun = options.dryRun || false;

  if (runner === "manual") {
    appendWebEvent(projectRoot, {
      skill: "okr-run-web",
      act: "M0",
      status: "manual-required",
      summary: "No runner available. Copy the prompt and run manually.",
    });
    return { mode: "manual", prompt, command: null };
  }

  let command;
  if (runner === "codex") {
    command = `codex exec --full-auto -C ${JSON.stringify(projectRoot)} ${JSON.stringify(prompt)}`;
  } else {
    command = `claude -p ${JSON.stringify(prompt)} --cwd ${JSON.stringify(projectRoot)}`;
  }

  if (!dryRun) {
    appendWebEvent(projectRoot, {
      skill: "okr-run-web",
      act: "M0",
      status: "started",
      summary: `Runner: ${runner}`,
    });
  }

  return { mode: runner, prompt, command };
}
