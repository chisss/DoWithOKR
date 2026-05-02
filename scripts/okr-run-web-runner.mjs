import { spawn } from "node:child_process";
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

function findExecutable(name, env = process.env) {
  const searchPath = env.PATH || process.env.PATH || "";
  return searchPath.split(path.delimiter).some((dir) => {
    const candidate = path.join(dir, name);
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * 检测可用的 runner：DOWITHOKR_RUNNER > codex > claude > manual
 */
export function detectRunner(env = process.env) {
  if (env.DOWITHOKR_RUNNER) {
    return { runner: env.DOWITHOKR_RUNNER };
  }
  if (findExecutable("codex", env)) {
    return { runner: "codex" };
  }
  if (findExecutable("claude", env)) {
    return { runner: "claude" };
  }
  return { runner: "manual" };
}

export function buildRunnerCommand(runner, projectRoot, prompt) {
  if (runner === "codex") {
    const args = ["exec", "--full-auto", "-C", projectRoot, prompt];
    return {
      command: "codex",
      args,
      display: `codex exec --full-auto -C ${JSON.stringify(projectRoot)} ${JSON.stringify(prompt)}`,
    };
  }
  if (runner === "claude") {
    const args = ["-p", "--permission-mode", "acceptEdits", prompt];
    return {
      command: "claude",
      args,
      display: `cd ${JSON.stringify(projectRoot)} && claude -p --permission-mode acceptEdits ${JSON.stringify(prompt)}`,
    };
  }
  return { command: null, args: [], display: null };
}

/**
 * 构建带用户反馈的 okr-gm 重跑 prompt
 */
export function buildGmRefinePrompt(requirement, answers) {
  const feedbackLines = answers
    .map((a, i) => `${i + 1}. ${a.question}\n   → ${a.answer || "忽略"}`)
    .join("\n");
  return [
    `使用 okr-gm 技能重新生成 GM OKR。`,
    `原始需求：${requirement}`,
    ``,
    `用户对待确认问题的反馈：`,
    feedbackLines,
    ``,
    `请根据用户反馈更新 GM OKR：将已确认的选择纳入边界或 KR 约束，忽略的问题从待确认中移除。`,
  ].join("\n");
}

function startPrompt(projectRoot, prompt, act, options = {}) {
  const env = options.env || process.env;
  const runner = options.runner || detectRunner(env).runner;
  const dryRun = options.dryRun || false;

  if (runner === "manual") {
    appendWebEvent(projectRoot, {
      skill: "okr-run-web",
      act,
      status: "manual-required",
      summary: "No runner available. Copy the prompt and run manually.",
    });
    return { mode: "manual", prompt, command: null };
  }

  const command = buildRunnerCommand(runner, projectRoot, prompt);
  if (!command.command) {
    appendWebEvent(projectRoot, {
      skill: "okr-run-web",
      act,
      status: "manual-required",
      summary: `Unsupported runner: ${runner}`,
    });
    return { mode: "manual", prompt, command: null };
  }

  if (dryRun) {
    return { mode: runner, prompt, command: command.display };
  }

  const webDir = path.join(projectRoot, ".okr", "web");
  const runsDir = path.join(webDir, "runs");
  fs.mkdirSync(runsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logRelativePath = path.join(".okr", "web", "runs", `${stamp}-${runner}.log`);
  const logPath = path.join(projectRoot, logRelativePath);
  fs.writeFileSync(logPath, `$ ${command.display}\n\n`, "utf8");
  const logFd = fs.openSync(logPath, "a");
  const hadOkrState = fs.existsSync(path.join(projectRoot, ".okr", "active.md"))
    || fs.existsSync(path.join(projectRoot, ".okr", "status.md"));

  const child = spawn(command.command, command.args, {
    cwd: projectRoot,
    env: { ...process.env, ...env },
    detached: true,
    stdio: ["ignore", logFd, logFd],
  });
  child.unref();

  child.on("exit", (code, signal) => {
    try { fs.closeSync(logFd); } catch {}
    const hasOkrState = fs.existsSync(path.join(projectRoot, ".okr", "active.md"))
      || fs.existsSync(path.join(projectRoot, ".okr", "status.md"));
    let permissionBlocked = false;
    try {
      const logText = fs.readFileSync(logPath, "utf8").slice(-4000);
      permissionBlocked = /需要.*授权|授权.*写入|permission denied|requires permission|allow.*write/i.test(logText);
    } catch {}
    const completed = code === 0 && !permissionBlocked && (hadOkrState || hasOkrState);
    appendWebEvent(projectRoot, {
      skill: "okr-run-web",
      act,
      status: completed ? "completed" : "failed",
      summary: `Runner: ${runner}; exit=${code}; signal=${signal || "none"}; log=${logRelativePath}${completed ? "" : "; no OKR state confirmed"}`,
    });
  });

  appendWebEvent(projectRoot, {
    skill: "okr-run-web",
    act,
    status: "started",
    summary: `Runner: ${runner}; log=${logRelativePath}`,
  });

  return { mode: runner, prompt, command: command.display, pid: child.pid, logPath: logRelativePath };
}

export function startRunnerPrompt(projectRoot, prompt, options = {}) {
  return startPrompt(projectRoot, prompt, options.act || "M0", options);
}

/**
 * 启动 okr-run 执行
 */
export function startOkrRun(projectRoot, input, options = {}) {
  const prompt = buildRunPrompt(input);
  const act = input.mode === "gm" ? "M1" : "M0";
  return startPrompt(projectRoot, prompt, act, options);
}
