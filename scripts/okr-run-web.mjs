import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { appendWebEvent, readOkrState, writeUserGmOkr } from "./okr-run-web-state.mjs";
import { startOkrRun, startRunnerPrompt, buildGmRefinePrompt, detectRunner } from "./okr-run-web-runner.mjs";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function resolveWebDir() {
  const scriptDir = path.dirname(new URL(import.meta.url).pathname);
  const candidates = [
    path.resolve(scriptDir, "..", "web", "okr-run-web"),
    path.resolve(scriptDir, "..", "..", "web", "okr-run-web"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, "index.html"))) return c;
  }
  return candidates[0];
}

export function createServer(options = {}) {
  const projectRoot = options.projectRoot || process.cwd();
  const projectName = path.basename(path.resolve(projectRoot)) || projectRoot;
  const token = options.token || crypto.randomBytes(18).toString("hex");
  const openBrowser = options.openBrowser !== false;
  const noRunner = options.noRunner === true;
  const runnerEnv = options.runnerEnv || process.env;
  const webDir = resolveWebDir();
  const sseClients = new Set();
  let watcher = null;
  let projectWatcher = null;
  let debounceTimer = null;

  function checkToken(req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    return url.searchParams.get("token") === token;
  }

  function getState() {
    return {
      ...readOkrState(projectRoot),
      project: {
        name: projectName,
      },
    };
  }

  function broadcastSnapshot() {
    const state = getState();
    const data = `event: snapshot\ndata: ${JSON.stringify(state)}\n\n`;
    for (const res of sseClients) {
      try { res.write(data); } catch {}
    }
  }

  function startWatcher() {
    if (watcher) return;
    const okrDir = path.join(projectRoot, ".okr");
    if (!fs.existsSync(okrDir)) return;
    try {
      watcher = fs.watch(okrDir, { recursive: true }, () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(broadcastSnapshot, 250);
      });
    } catch {}
  }

  function startProjectWatcher() {
    if (projectWatcher) return;
    try {
      projectWatcher = fs.watch(projectRoot, (_event, filename) => {
        if (filename !== ".okr") return;
        startWatcher();
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(broadcastSnapshot, 250);
      });
    } catch {}
  }

  function getRunner() {
    return noRunner ? { runner: "manual" } : detectRunner(runnerEnv);
  }

  function runInput(input) {
    const result = startOkrRun(projectRoot, input, {
      ...getRunner(),
      env: runnerEnv,
    });
    startWatcher();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(broadcastSnapshot, 50);
    return result;
  }

  function archiveName(dir, baseName) {
    const ext = path.extname(baseName);
    const stem = baseName.slice(0, -ext.length);
    const today = new Date().toISOString().slice(0, 10);
    let candidate = `${today}-${baseName}`;
    let index = 2;
    while (fs.existsSync(path.join(dir, candidate))) {
      candidate = `${today}-${stem}-${index}${ext}`;
      index++;
    }
    return candidate;
  }

  function archiveCurrentState() {
    const okrDir = path.join(projectRoot, ".okr");
    const archiveDir = path.join(okrDir, "archive");
    fs.mkdirSync(archiveDir, { recursive: true });
    const archived = [];
    for (const name of ["active.md", "status.md"]) {
      const src = path.join(okrDir, name);
      if (!fs.existsSync(src)) continue;
      const destName = archiveName(archiveDir, name);
      fs.copyFileSync(src, path.join(archiveDir, destName));
      fs.rmSync(src, { force: true });
      archived.push(path.join(".okr", "archive", destName));
    }
    appendWebEvent(projectRoot, {
      skill: "okr-run-web",
      act: "M0",
      status: "restarted",
      changed: archived,
      summary: "Current OKR state archived for restart.",
    });
    return archived;
  }

  function safeStaticPath(pathname) {
    let decoded;
    try {
      decoded = decodeURIComponent(pathname);
    } catch {
      return null;
    }
    const relative = decoded === "/" || decoded === "/index.html"
      ? "index.html"
      : decoded.startsWith("/assets/")
        ? decoded.slice(8)
        : decoded.slice(1);
    const resolved = path.resolve(webDir, relative);
    const root = path.resolve(webDir);
    if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) return null;
    return resolved;
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (pathname.startsWith("/api/") || pathname === "/events") {
      if (!checkToken(req)) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "forbidden" }));
        return;
      }
    }

    if (pathname === "/api/state" && req.method === "GET") {
      const state = getState();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(state));
      return;
    }

    if (pathname === "/api/start" && req.method === "POST") {
      let body = "";
      req.on("data", (c) => { body += c; });
      req.on("end", () => {
        try {
          const input = JSON.parse(body);
          if (input.mode === "gm") {
            writeUserGmOkr(projectRoot, input);
          }
          const result = runInput(input);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (e) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    if (pathname === "/api/action" && req.method === "POST") {
      let body = "";
      req.on("data", (c) => { body += c; });
      req.on("end", () => {
        try {
          const { action, requirement = "" } = JSON.parse(body || "{}");
          let result;
          if (action === "continue") {
            result = runInput({
              mode: "raw",
              requirement: "从 .okr/active.md 的 current_act 断点继续执行当前 OKR 周期，不重新开始。",
            });
          } else if (action === "restart") {
            const previousRequirement = getState().sections?.requirement || "";
            const archived = archiveCurrentState();
            result = {
              ...runInput({
                mode: "raw",
                requirement: requirement || previousRequirement || "重新开始当前 OKR 周期。",
              }),
              archived,
            };
          } else if (action === "cancel") {
            appendWebEvent(projectRoot, {
              skill: "okr-run-web",
              act: getState().currentAct || "",
              status: "cancelled",
              summary: "User cancelled the current web action.",
            });
            result = { ok: true, status: "cancelled" };
            broadcastSnapshot();
          } else {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: `unsupported action: ${action}` }));
            return;
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (e) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    if (pathname === "/api/refine-gm" && req.method === "POST") {
      let body = "";
      req.on("data", (c) => { body += c; });
      req.on("end", () => {
        try {
          const { answers } = JSON.parse(body);
          const currentState = getState();
          const requirement = currentState.sections?.requirement || "";
          const prompt = buildGmRefinePrompt(requirement, answers);
          const result = startRunnerPrompt(projectRoot, prompt, {
            ...getRunner(),
            env: runnerEnv,
            act: "M0",
          });
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (e) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    if (pathname === "/events") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      });
      sseClients.add(res);
      const state = getState();
      res.write(`event: snapshot\ndata: ${JSON.stringify(state)}\n\n`);
      req.on("close", () => { sseClients.delete(res); });
      return;
    }

    // 静态文件服务
    let filePath;
    if (pathname === "/" || pathname === "/index.html") {
      if (!checkToken(req)) {
        res.writeHead(403, { "Content-Type": "text/plain" });
        res.end("Forbidden");
        return;
      }
    }
    filePath = safeStaticPath(pathname);
    if (!filePath) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("Forbidden");
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  });

  return new Promise((resolve, reject) => {
    const preferredPort = options.port === 0 ? 0 : (options.port || 3767);

    function close() {
      return new Promise((r) => {
        if (watcher) watcher.close();
        if (projectWatcher) projectWatcher.close();
        for (const c of sseClients) { try { c.end(); } catch {} }
        server.close(r);
      });
    }

    function finishListen() {
      const port = server.address().port;
      startWatcher();
      startProjectWatcher();
      if (openBrowser) {
        const appUrl = `http://127.0.0.1:${port}/?token=${token}`;
        console.log(`DoWithOKR Web: ${appUrl}`);
        import("node:child_process").then(({ exec }) => {
          exec(`open ${JSON.stringify(appUrl)}`);
        });
      }
      resolve({ server, token, port, close });
    }

    function listen(port) {
      server.once("error", (e) => {
        if (e.code === "EADDRINUSE" && port !== 0) {
          listen(port + 1);
          return;
        }
        reject(e);
      });
      server.listen(port, "127.0.0.1", finishListen);
    }

    listen(preferredPort);
  });
}

export async function startServer(options = {}) {
  const result = await createServer(options);
  console.log(`Server running at http://127.0.0.1:${result.port}/?token=${result.token}`);
  return result;
}

// CLI 入口
if (process.argv[1] && process.argv[1].endsWith("okr-run-web.mjs")) {
  const args = process.argv.slice(2);
  const projectIdx = args.indexOf("--project");
  const projectRoot = projectIdx >= 0 ? args[projectIdx + 1] : process.cwd();
  const noRunner = args.includes("--no-runner");
  const openBrowser = !args.includes("--no-browser");
  startServer({ projectRoot, openBrowser, noRunner });
}
