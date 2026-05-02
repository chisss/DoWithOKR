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
 * 从 Markdown 中提取指定 ### 标题下的内容
 */
export function extractSubSection(markdown, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const lines = markdown.split("\n");
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(new RegExp(`^### ${escaped}\\s*$`))) {
      start = i + 1;
      break;
    }
  }
  if (start === -1) return "";
  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    if (/^###? /.test(lines[i]) && i !== start - 1) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n").trim();
}

/**
 * 解析 bullet list，识别边界分类前缀
 */
export function parseBulletList(text) {
  if (!text) return [];
  return text.split("\n")
    .filter((l) => l.trim().startsWith("- "))
    .map((l) => {
      const content = l.replace(/^-\s+/, "");
      if (/^包含[：:]/.test(content)) return { type: "include", text: content.replace(/^包含[：:]\s*/, "") };
      if (/^不包含[：:]/.test(content)) return { type: "exclude", text: content.replace(/^不包含[：:]\s*/, "") };
      if (/^不默认包含[：:]/.test(content)) return { type: "optional", text: content.replace(/^不默认包含[：:]\s*/, "") };
      return { type: "plain", text: content };
    });
}

/**
 * 解析待确认区块：主级 bullet 为问题，子级 bullet 为推荐方案
 */
export function parsePendingQuestions(text) {
  if (!text) return [];
  const lines = text.split("\n");
  const questions = [];
  let current = null;

  for (const line of lines) {
    if (/^- /.test(line)) {
      if (current) questions.push(current);
      current = { question: line.replace(/^-\s+/, ""), suggestions: [] };
    } else if (/^\s{2,}- /.test(line) && current) {
      current.suggestions.push(line.replace(/^\s+- /, ""));
    }
  }
  if (current) questions.push(current);
  return questions;
}

function splitMarkdownRow(line) {
  let body = line.trim();
  if (body.startsWith("|")) body = body.slice(1);
  if (body.endsWith("|")) body = body.slice(0, -1);

  const cells = [];
  let current = "";
  for (let i = 0; i < body.length; i++) {
    const char = body[i];
    const next = body[i + 1];
    if (char === "\\" && next === "|") {
      current += "|";
      i++;
      continue;
    }
    if (char === "|") {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

/**
 * 解析 GM OKR 区块为结构化对象
 */
export function parseGmOkrSection(rawMarkdown) {
  if (!rawMarkdown) return null;
  let objective = "";
  let keyResults = [];
  let boundaries = [];
  let pendingQuestions = [];

  const hasFullFormat = /^### GM Objective/m.test(rawMarkdown);

  if (hasFullFormat) {
    objective = extractSubSection(rawMarkdown, "GM Objective").split("\n").filter(Boolean)[0] || "";
    const krText = extractSubSection(rawMarkdown, "GM Key Results");
    keyResults = parseMarkdownTable(krText);
    boundaries = parseBulletList(extractSubSection(rawMarkdown, "边界"));
    pendingQuestions = parsePendingQuestions(extractSubSection(rawMarkdown, "待确认"));
  } else {
    const lines = rawMarkdown.split("\n");
    const objLine = lines.find((l) => /^O-GM[：:]/.test(l));
    objective = objLine ? objLine.replace(/^O-GM[：:]\s*/, "") : lines.find((l) => l.trim() && !l.startsWith("|") && !l.startsWith("#") && !l.startsWith("-")) || "";
    keyResults = parseMarkdownTable(rawMarkdown);
    boundaries = parseBulletList(extractSubSection(rawMarkdown, "边界"));
  }

  if (!objective && keyResults.length === 0) return null;
  return { objective, keyResults, boundaries, pendingQuestions };
}

/**
 * 解析 Markdown 表格为对象数组
 */
export function parseMarkdownTable(markdown) {
  const lines = markdown.split("\n").filter((l) => l.trim().startsWith("|"));
  if (lines.length < 2) return [];
  const headers = splitMarkdownRow(lines[0]);
  const rows = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = splitMarkdownRow(lines[i]);
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

function readMarkdownItems(dir, parseWarnings, label) {
  if (!fs.existsSync(dir)) return [];
  try {
    return fs.readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .sort()
      .map((name) => {
        const filePath = path.join(dir, name);
        try {
          return {
            name,
            path: path.join(".okr", label, name),
            content: fs.readFileSync(filePath, "utf8"),
          };
        } catch (e) {
          parseWarnings.push(`${label}/${name} read error: ${e.message}`);
          return { name, path: path.join(".okr", label, name), content: "" };
        }
      });
  } catch (e) {
    parseWarnings.push(`${label}/ read error: ${e.message}`);
    return [];
  }
}

function extractFinalResult(reviewItems) {
  for (const item of [...reviewItems].reverse()) {
    const line = item.content
      .split("\n")
      .find((l) => /(?:GM\s*)?最终\s*R\s*[：:]/.test(l.replace(/[*_`]/g, "")));
    if (line) return line.trim();
    const summary = extractSection(item.content, "汇总");
    if (summary) return summary;
    const conclusion = extractSection(item.content, "结论");
    if (conclusion) return conclusion;
  }
  return "";
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

  const evidenceItems = readMarkdownItems(evidenceDir, parseWarnings, "evidence");
  const reviewItems = readMarkdownItems(reviewsDir, parseWarnings, "reviews");
  const evidenceFiles = evidenceItems.map((item) => item.name);
  const reviewFiles = reviewItems.map((item) => item.name);
  const events = readWebEvents(projectRoot, parseWarnings);
  const gmOkrParsed = sections.gmOkr ? parseGmOkrSection(sections.gmOkr) : null;

  return {
    projectRoot,
    currentAct: frontmatter.current_act || "",
    hasActive,
    sections,
    gmOkrParsed,
    statusRows,
    evidenceFiles,
    evidenceItems,
    reviewFiles,
    reviewItems,
    finalResult: extractFinalResult(reviewItems),
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
    const match = kr.match(/^(?:GM-)?KR(\d+)/i);
    const id = match ? `GM-KR${match[1]}` : `GM-KR${i + 1}`;
    const desc = kr.replace(/^(?:GM-)?KR\d+[：:]\s*/i, "");
    return `| ${id} | ${desc} | 待补充 | 未开始 |`;
  });

  return [
    "---",
    "version: 1",
    "current_act: M1",
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
export function readWebEvents(projectRoot, parseWarnings = []) {
  const eventsPath = path.join(projectRoot, ".okr", "web", "events.jsonl");
  if (!fs.existsSync(eventsPath)) return [];
  try {
    const lines = fs.readFileSync(eventsPath, "utf8").trim().split("\n").filter(Boolean);
    const events = [];
    lines.forEach((line, idx) => {
      try {
        events.push(JSON.parse(line));
      } catch (e) {
        parseWarnings.push(`events.jsonl line ${idx + 1} parse error: ${e.message}`);
      }
    });
    return events;
  } catch (e) {
    parseWarnings.push(`events.jsonl read error: ${e.message}`);
    return [];
  }
}
