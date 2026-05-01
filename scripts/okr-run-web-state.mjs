import fs from "node:fs";
import path from "node:path";

/**
 * 从 Markdown 中提取指定 ## 标题下的内容
 */
export function extractSection(markdown, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const lines = markdown.split("\n");
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(new RegExp(`^## ${escaped}\\s*$`))) {
      start = i + 1;
      break;
    }
  }
  if (start === -1) return "";
  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    if (/^## /.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n").trim();
}

/**
 * 解析 Markdown 表格为对象数组
 */
export function parseMarkdownTable(markdown) {
  const lines = markdown.split("\n").filter((l) => l.trim().startsWith("|"));
  if (lines.length < 2) return [];
  const headers = lines[0].split("|").map((h) => h.trim()).filter(Boolean);
  const rows = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i].split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length === 0) continue;
    const row = {};
    headers.forEach((h, idx) => { row[h] = cells[idx] || ""; });
    rows.push(row);
  }
  return rows;
}

/**
 * 解析 YAML frontmatter
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fields = {};
  for (const line of match[1].split("\n")) {
    const m = line.match(/^(\w[\w_]*?):\s*(.+)$/);
    if (m) fields[m[1]] = m[2].trim();
  }
  return fields;
}

/**
 * 读取 .okr/ 目录状态，返回 UI 快照对象
 */
export function readOkrState(projectRoot) {
  const okrDir = path.join(projectRoot, ".okr");
  const activePath = path.join(okrDir, "active.md");
  const statusPath = path.join(okrDir, "status.md");
  const evidenceDir = path.join(okrDir, "evidence");
  const reviewsDir = path.join(okrDir, "reviews");
  const parseWarnings = [];

  const hasActive = fs.existsSync(activePath);
  let activeContent = "";
  let frontmatter = {};
  if (hasActive) {
    try {
      activeContent = fs.readFileSync(activePath, "utf8");
      frontmatter = parseFrontmatter(activeContent);
    } catch (e) {
      parseWarnings.push(`active.md read error: ${e.message}`);
    }
  }

  const sections = {
    requirement: extractSection(activeContent, "甲方需求"),
    gmOkr: extractSection(activeContent, "GM OKR"),
    roleTree: extractSection(activeContent, "角色树"),
    hierarchicalOkr: extractSection(activeContent, "层级 OKR"),
    deliveryPlan: extractSection(activeContent, "交付幕计划"),
    verificationPlan: extractSection(activeContent, "交付验证计划"),
  };

  let statusRows = [];
  if (fs.existsSync(statusPath)) {
    try {
      const statusContent = fs.readFileSync(statusPath, "utf8");
      const tableSection = extractSection(statusContent, "OKR 状态看板") || statusContent;
      const rawRows = parseMarkdownTable(tableSection);
      statusRows = rawRows.map((r) => ({
        kr: r["KR"] || r["kr"] || "",
        upperKr: r["上级 KR"] || r["Upper KR"] || "",
        role: r["角色"] || r["Role"] || "",
        act: r["幕"] || r["Act"] || "",
        status: r["状态"] || r["Status"] || "",
        progress: r["进展"] || r["Progress"] || "0",
        evidence: r["证据"] || r["Evidence"] || "",
        nextStep: r["下一步"] || r["Next Step"] || "",
      }));
    } catch (e) {
      parseWarnings.push(`status.md read error: ${e.message}`);
    }
  }

  let evidenceFiles = [];
  if (fs.existsSync(evidenceDir)) {
    try {
      evidenceFiles = fs.readdirSync(evidenceDir).filter((f) => f.endsWith(".md"));
    } catch (e) {
      parseWarnings.push(`evidence/ read error: ${e.message}`);
    }
  }

  let reviewFiles = [];
  if (fs.existsSync(reviewsDir)) {
    try {
      reviewFiles = fs.readdirSync(reviewsDir).filter((f) => f.endsWith(".md"));
    } catch (e) {
      parseWarnings.push(`reviews/ read error: ${e.message}`);
    }
  }

  const events = readWebEvents(projectRoot);

  return {
    projectRoot,
    currentAct: frontmatter.current_act || "",
    hasActive,
    sections,
    statusRows,
    evidenceFiles,
    reviewFiles,
    events,
    parseWarnings,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 生成用户自定义 GM OKR 的 active.md 内容
 */
export function renderUserGmActive(input) {
  const { objective, keyResults = [], boundaries = "" } = input;
  const krLines = keyResults.map((kr, i) => {
    const id = kr.match(/^(GM-KR\d+)/)?.[1] || `GM-KR${i + 1}`;
    const desc = kr.replace(/^GM-KR\d+[：:]\s*/, "");
    return `| ${id} | ${desc} | 待补充 | 未开始 |`;
  });

  return [
    "---",
    "version: 1",
    "current_act: M0",
    `last_updated: ${new Date().toISOString().slice(0, 10)}`,
    "updated_by: okr-run-web",
    "source: user_gm_input",
    "---",
    "",
    "## GM OKR",
    "",
    `O-GM：${objective}`,
    "",
    "| KR | 验收标准 | 证据要求 | 状态 |",
    "| --- | --- | --- | --- |",
    ...krLines,
    "",
    "### 边界",
    "",
    boundaries || "无",
  ].join("\n");
}

/**
 * 将用户 GM OKR 写入 .okr/active.md
 */
export function writeUserGmOkr(projectRoot, input) {
  const okrDir = path.join(projectRoot, ".okr");
  fs.mkdirSync(okrDir, { recursive: true });
  const content = renderUserGmActive(input);
  fs.writeFileSync(path.join(okrDir, "active.md"), content, "utf8");
}

/**
 * 追加 Web 事件到 .okr/web/events.jsonl
 */
export function appendWebEvent(projectRoot, event) {
  const webDir = path.join(projectRoot, ".okr", "web");
  fs.mkdirSync(webDir, { recursive: true });
  const entry = { time: new Date().toISOString(), ...event };
  fs.appendFileSync(path.join(webDir, "events.jsonl"), JSON.stringify(entry) + "\n", "utf8");
}

/**
 * 读取 .okr/web/events.jsonl 中的所有事件
 */
export function readWebEvents(projectRoot) {
  const eventsPath = path.join(projectRoot, ".okr", "web", "events.jsonl");
  if (!fs.existsSync(eventsPath)) return [];
  try {
    const lines = fs.readFileSync(eventsPath, "utf8").trim().split("\n").filter(Boolean);
    return lines.map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}
