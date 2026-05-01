import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { createServer } from "./okr-run-web.mjs";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "okr-web-server-"));
const projectName = path.basename(root);
fs.mkdirSync(path.join(root, ".okr", "evidence"), { recursive: true });
fs.writeFileSync(path.join(root, ".okr", "active.md"), [
  "---", "current_act: M1", "---",
  "## 甲方需求", "做登录模块",
  "## GM OKR", "O-GM：交付登录能力",
].join("\n"));
fs.writeFileSync(path.join(root, ".okr", "status.md"), [
  "## OKR 状态看板",
  "| KR | 上级 KR | 角色 | 幕 | 状态 | 进展 | 证据 | 下一步 |",
  "| --- | --- | --- | --- | --- | --- | --- | --- |",
].join("\n"));

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const opts = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || "GET",
      headers: options.headers || {},
    };
    const req = http.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runTests() {
  const { server, token, port, close } = await createServer({
    projectRoot: root,
    openBrowser: false,
    port: 0,
  });

  const base = `http://127.0.0.1:${port}`;

  try {
    // 未授权请求返回 403
    const unauth = await fetch(`${base}/api/state`);
    assert.equal(unauth.status, 403, "unauthorized should be 403");

    // 授权请求返回 JSON 状态
    const stateRes = await fetch(`${base}/api/state?token=${token}`);
    assert.equal(stateRes.status, 200);
    const state = JSON.parse(stateRes.body);
    assert.equal(state.currentAct, "M1");
    assert.equal(state.hasActive, true);
    assert.equal(state.project.name, projectName);

    // POST /api/start 接受请求
    const startRes = await fetch(`${base}/api/start?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "raw", requirement: "做登录模块" }),
    });
    assert.equal(startRes.status, 200);
    const startData = JSON.parse(startRes.body);
    assert.ok(startData.prompt);

    // SSE /events 返回 snapshot 事件
    const sseRes = await new Promise((resolve, reject) => {
      const req = http.get(`${base}/events?token=${token}`, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
          if (data.includes("event: snapshot")) {
            req.destroy();
            resolve({ status: res.statusCode, body: data });
          }
        });
        setTimeout(() => { req.destroy(); resolve({ status: res.statusCode, body: data }); }, 3000);
      });
      req.on("error", (e) => {
        if (e.code !== "ECONNRESET") reject(e);
      });
    });
    assert.equal(sseRes.status, 200);
    assert.ok(sseRes.body.includes("event: snapshot"), "SSE should send snapshot event");

    // 静态资源测试
    const htmlRes = await fetch(`${base}/?token=${token}`);
    assert.equal(htmlRes.status, 200);
    assert.ok(htmlRes.body.includes("DoWithOKR"), "HTML should contain DoWithOKR");

    console.log("All server tests passed");
  } finally {
    await close();
    fs.rmSync(root, { recursive: true, force: true });
  }
}

runTests().catch((e) => { console.error(e); process.exit(1); });
