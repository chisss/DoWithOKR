import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { readOkrState } from "./okr-run-web-state.mjs";
import { startOkrRun, detectRunner } from "./okr-run-web-runner.mjs";

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
  const webDir = resolveWebDir();
  const sseClients = new Set();
  let watcher = null;
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
    const okrDir = path.join(projectRoot, ".okr");
    if (!fs.existsSync(okrDir)) return;
    try {
      watcher = fs.watch(okrDir, { recursive: true }, () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(broadcastSnapshot, 250);
      });
    } catch {}
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
          const runner = detectRunner();
          const result = startOkrRun(projectRoot, input, { ...runner, dryRun: true });
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
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
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
      filePath = path.join(webDir, "index.html");
    } else if (pathname.startsWith("/assets/")) {
      filePath = path.join(webDir, pathname.slice(8));
    } else {
      filePath = path.join(webDir, pathname);
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

  return new Promise((resolve) => {
    const preferredPort = options.port === 0 ? 0 : (options.port || 3767);
    server.listen(preferredPort, "127.0.0.1", () => {
      const port = server.address().port;
      startWatcher();
      if (openBrowser) {
        const url = `http://127.0.0.1:${port}/?token=${token}`;
        console.log(`DoWithOKR Web: ${url}`);
        import("node:child_process").then(({ exec }) => {
          exec(`open ${JSON.stringify(url)}`);
        });
      }
      resolve({
        server,
        token,
        port,
        close: () => new Promise((r) => {
          if (watcher) watcher.close();
          for (const c of sseClients) { try { c.end(); } catch {} }
          server.close(r);
        }),
      });
    });
    server.on("error", (e) => {
      if (e.code === "EADDRINUSE" && preferredPort !== 0) {
        server.listen(0, "127.0.0.1", () => {
          const port = server.address().port;
          startWatcher();
          resolve({ server, token, port, close: () => new Promise((r) => { if (watcher) watcher.close(); server.close(r); }) });
        });
      }
    });
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
  startServer({ projectRoot, openBrowser });
}
