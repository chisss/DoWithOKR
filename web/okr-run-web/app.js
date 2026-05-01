/* DoWithOKR Run Web - app.js */
(function () {
  "use strict";

  const params = new URLSearchParams(location.search);
  const TOKEN = params.get("token") || "";

  const I18N = {
    zh: {
      title: "DoWithOKR Run Web",
      project: "项目",
      menu: "菜单",
      rawRequirement: "原始需求",
      gmOkr: "GM OKR",
      roleTree: "角色树",
      deliveryAct: "交付幕",
      statusBoard: "状态看板",
      upperMapping: "上级映射",
      evidence: "证据",
      finalR: "最终 R",
      startRun: "开始运行",
      continueRun: "从断点继续",
      restart: "重新开始",
      cancel: "取消",
      objective: "目标 (Objective)",
      keyResults: "关键结果 (Key Results)",
      boundaries: "边界约束",
      requirementPlaceholder: "描述你的需求、目标、约束和验收标准...",
      currentAct: "当前幕",
      events: "执行日志",
      hierarchicalOkr: "层级 OKR",
      verificationPlan: "交付验证计划",
      reviews: "评分复盘",
      connected: "已连接",
      disconnected: "连接断开",
      noData: "暂无数据",
      krId: "KR",
      role: "角色",
      act: "幕",
      status: "状态",
      progress: "进展",
      nextStep: "下一步",
      manualHint: "未检测到可用 Runner，请复制以下指令手动执行：",
      pending: "未开始",
      inProgress: "进行中",
      blocked: "阻塞",
      done: "已完成",
      abandoned: "放弃",
      pendingQuestions: "待确认",
      include: "包含",
      exclude: "不包含",
      optional: "不默认包含",
      ignoreQuestion: "忽略此问题",
      recommend: "推荐",
      submitRefine: "提交反馈并重新生成 GM OKR",
    },
    en: {
      title: "DoWithOKR Run Web",
      project: "Project",
      menu: "Menu",
      rawRequirement: "Raw Requirement",
      gmOkr: "GM OKR",
      roleTree: "Role Tree",
      deliveryAct: "Delivery Act",
      statusBoard: "Status Board",
      upperMapping: "Upper Mapping",
      evidence: "Evidence",
      finalR: "Final R",
      startRun: "Start Run",
      continueRun: "Continue",
      restart: "Restart",
      cancel: "Cancel",
      objective: "Objective",
      keyResults: "Key Results",
      boundaries: "Boundaries",
      requirementPlaceholder: "Describe your requirement, goals, constraints...",
      currentAct: "Current Act",
      events: "Event Log",
      hierarchicalOkr: "Hierarchical OKR",
      verificationPlan: "Verification Plan",
      reviews: "Score Review",
      connected: "Connected",
      disconnected: "Disconnected",
      noData: "No data",
      krId: "KR",
      role: "Role",
      act: "Act",
      status: "Status",
      progress: "Progress",
      nextStep: "Next Step",
      manualHint: "No runner detected. Copy the prompt below and run manually:",
      pending: "Pending",
      inProgress: "In Progress",
      blocked: "Blocked",
      done: "Done",
      abandoned: "Abandoned",
      pendingQuestions: "Pending Questions",
      include: "Include",
      exclude: "Exclude",
      optional: "Optional",
      ignoreQuestion: "Ignore this question",
      recommend: "Recommended",
      submitRefine: "Submit Feedback & Regenerate GM OKR",
    },
  };

  let lang = localStorage.getItem("dowithokrLang") || "zh";
  let state = null;
  let selectedKr = null;
  let inputMode = "raw";
  let evtSource = null;
  let activeNav = "nav-gm-okr";
  let pendingAnswers = {};

  function t(key) { return I18N[lang]?.[key] || I18N.zh[key] || key; }

  window.toggleLang = function () {
    lang = lang === "zh" ? "en" : "zh";
    localStorage.setItem("dowithokrLang", lang);
    document.getElementById("lang-toggle").textContent = lang === "zh" ? "EN" : "中文";
    render();
  };

  function api(path, opts = {}) {
    const sep = path.includes("?") ? "&" : "?";
    return fetch(`${path}${sep}token=${TOKEN}`, opts).then((r) => r.json());
  }

  function statusClass(s) {
    if (!s) return "status-pending";
    if (s.includes("完成") || s === "Done") return "status-done";
    if (s.includes("进行") || s === "In Progress") return "status-progress";
    if (s.includes("阻塞") || s === "Blocked") return "status-blocked";
    if (s.includes("放弃") || s === "Abandoned") return "status-abandoned";
    return "status-pending";
  }

  function esc(s) {
    if (!s) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function renderMarkdown(text) {
    if (!text) return `<p class="md-paragraph" style="color:var(--text-secondary)">${t("noData")}</p>`;
    const lines = text.split("\n");
    const parts = [];
    let tableLines = [];
    let listLines = [];

    function flushTable() {
      if (!tableLines.length) return;
      const headers = tableLines[0].split("|").map((h) => h.trim()).filter(Boolean);
      let html = `<table><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr>`;
      for (let i = 2; i < tableLines.length; i++) {
        const cells = tableLines[i].split("|").map((c) => c.trim()).filter(Boolean);
        html += "<tr>";
        cells.forEach((c, ci) => {
          const isStatus = headers[ci] && /状态|Status/i.test(headers[ci]);
          const label = esc(headers[ci] || "");
          html += isStatus
            ? `<td data-label="${label}"><span class="status-badge ${statusClass(c)}">${esc(c)}</span></td>`
            : `<td data-label="${label}">${esc(c)}</td>`;
        });
        html += "</tr>";
      }
      html += "</table>";
      parts.push(html);
      tableLines = [];
    }

    function flushList() {
      if (!listLines.length) return;
      parts.push(`<ul class="md-list">${listLines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`);
      listLines = [];
    }

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("|")) {
        flushList();
        tableLines.push(trimmed);
        continue;
      }
      flushTable();
      if (/^#{1,3} /.test(trimmed)) {
        flushList();
        parts.push(`<div class="md-heading">${esc(trimmed.replace(/^#{1,3}\s+/, ""))}</div>`);
        continue;
      }
      if (trimmed.startsWith("- ")) {
        listLines.push(trimmed.replace(/^-\s+/, ""));
        continue;
      }
      flushList();
      if (trimmed === "") continue;
      parts.push(`<p class="md-paragraph">${esc(trimmed)}</p>`);
    }
    flushTable();
    flushList();
    return parts.join("");
  }

  function renderSidebar() {
    const sb = document.getElementById("sidebar");
    const items = [
      { id: "nav-gm-okr", label: t("gmOkr") },
      { id: "nav-tree", label: t("roleTree") },
      { id: "nav-hier-okr", label: t("hierarchicalOkr") },
      { id: "nav-act", label: t("deliveryAct") },
      { id: "nav-status", label: t("statusBoard") },
      { id: "nav-evidence", label: t("evidence") },
      { id: "nav-events", label: t("events") },
      { id: "nav-reviews", label: t("reviews") },
      { id: "nav-final", label: t("finalR") },
    ];
    sb.innerHTML = `
      <div class="menu-title">${t("menu")}</div>
      <div class="menu-list">
        ${items.map((i) => `
          <button class="menu-item ${activeNav === i.id ? "active" : ""}" type="button" onclick="switchView('${i.id}')">
            <span>${i.label}</span>
          </button>
        `).join("")}
      </div>`;
  }

  window.switchView = function (id) {
    activeNav = id;
    renderSidebar();
    const sections = document.querySelectorAll("#workspace > .section");
    sections.forEach((el) => {
      el.style.display = el.id === id ? "" : "none";
    });
  };

  function renderStartForm() {
    if (state?.hasActive) return "";
    return `<div class="gm-subsection">
      <div class="tabs">
        <div class="tab ${inputMode === "raw" ? "active" : ""}" onclick="setMode('raw')">${t("rawRequirement")}</div>
        <div class="tab ${inputMode === "gm" ? "active" : ""}" onclick="setMode('gm')">${t("gmOkr")}</div>
      </div>
      ${inputMode === "raw" ? `
        <textarea id="input-requirement" rows="5" placeholder="${t("requirementPlaceholder")}"></textarea>
      ` : `
        <input type="text" id="input-objective" placeholder="${t("objective")}" style="margin-bottom:8px">
        <textarea id="input-krs" rows="3" placeholder="${t("keyResults")} (one per line)"></textarea>
        <input type="text" id="input-boundaries" placeholder="${t("boundaries")}" style="margin-top:8px">
      `}
      <button class="btn btn-primary" style="margin-top:12px" onclick="doStart()">${t("startRun")}</button>
    </div>`;
  }

  function renderBoundaryTag(type) {
    const labels = { include: t("include"), exclude: t("exclude"), optional: t("optional") };
    const cls = { include: "tag-include", exclude: "tag-exclude", optional: "tag-optional", plain: "tag-plain" };
    return `<span class="boundary-tag ${cls[type] || "tag-plain"}">${labels[type] || ""}</span>`;
  }

  function renderRequirementBanner() {
    if (!state?.hasActive) return "";
    const req = state.sections?.requirement || "";
    if (!req) return "";
    return `<div class="requirement-banner">
      <div class="req-label">${t("rawRequirement")}</div>
      <div class="req-text">${esc(req)}</div>
      <div class="req-actions">
        <span class="act-badge">${t("currentAct")}: ${state.currentAct || "?"}</span>
        <button class="btn btn-primary" onclick="doAction('continue')">${t("continueRun")}</button>
        <button class="btn btn-secondary" onclick="doAction('restart')">${t("restart")}</button>
        <button class="btn btn-secondary" onclick="doAction('cancel')">${t("cancel")}</button>
      </div>
    </div>`;
  }

  function renderPendingQuestions(questions) {
    if (!questions || !questions.length) return "";
    const items = questions.map((q, idx) => {
      const name = `pq_${idx}`;
      const hasSuggestions = q.suggestions && q.suggestions.length > 0;

      let optionsHtml;
      if (hasSuggestions) {
        const options = q.suggestions.map((s, si) => {
          const checked = pendingAnswers[idx] === s ? "checked" : "";
          const recTag = si === 0 ? `<span class="recommend-tag">${t("recommend")}</span>` : "";
          return `<label class="pending-option">
            <input type="radio" name="${name}" value="${esc(s)}" ${checked} onchange="setPendingAnswer(${idx}, this.value)">
            <span>${esc(s)}</span>${recTag}
          </label>`;
        }).join("");
        const ignoreChecked = pendingAnswers[idx] === "__ignore__" ? "checked" : "";
        const ignoreOpt = `<label class="pending-option is-ignore">
          <input type="radio" name="${name}" value="__ignore__" ${ignoreChecked} onchange="setPendingAnswer(${idx}, '__ignore__')">
          <span>${t("ignoreQuestion")}</span>
        </label>`;
        optionsHtml = `<div class="pending-options">${options}${ignoreOpt}</div>`;
      } else {
        const val = pendingAnswers[idx] || "";
        optionsHtml = `<div class="pending-options">
          <input type="text" class="pending-text-input" placeholder="${t("requirementPlaceholder")}" value="${esc(val)}" onchange="setPendingAnswer(${idx}, this.value)">
          <label class="pending-option is-ignore" style="margin-top:4px">
            <input type="radio" name="${name}" value="__ignore__" ${pendingAnswers[idx] === "__ignore__" ? "checked" : ""} onchange="setPendingAnswer(${idx}, '__ignore__')">
            <span>${t("ignoreQuestion")}</span>
          </label>
        </div>`;
      }

      return `<div class="pending-question-item">
        <div class="pending-question-text">${idx + 1}. ${esc(q.question)}</div>
        ${optionsHtml}
      </div>`;
    }).join("");
    return `<div class="gm-subsection">
      <div class="section-title">${t("pendingQuestions")}</div>
      <div class="card" style="padding:0">
        ${items}
        <div class="pending-submit-bar">
          <button class="btn btn-primary" onclick="doRefineGm()">${t("submitRefine")}</button>
        </div>
      </div>
    </div>`;
  }

  function renderGmOkr() {
    const parsed = state?.gmOkrParsed;
    const hasContent = parsed || state?.sections?.gmOkr;

    if (!state?.hasActive && !hasContent) {
      return `<div class="section" id="nav-gm-okr">
        <div class="section-title">${t("gmOkr")}</div>
        ${renderStartForm()}
      </div>`;
    }

    if (!hasContent) {
      return `<div class="section" id="nav-gm-okr">
        <div class="section-title">${t("gmOkr")}</div>
        ${renderRequirementBanner()}
        <div class="card"><p style="color:var(--text-secondary)">${t("noData")}</p></div>
      </div>`;
    }

    if (!parsed) {
      return `<div class="section" id="nav-gm-okr">
        <div class="section-title">${t("gmOkr")}</div>
        ${renderRequirementBanner()}
        <div class="card md-content">${renderMarkdown(state.sections.gmOkr)}</div>
      </div>`;
    }

    const krHeaders = parsed.keyResults.length > 0 ? Object.keys(parsed.keyResults[0]) : [];
    const krRows = parsed.keyResults.map((kr) => {
      return `<tr>${krHeaders.map((h) => {
        const val = kr[h] || "";
        const isStatus = /状态|Status/i.test(h);
        const label = esc(h);
        return isStatus
          ? `<td data-label="${label}"><span class="status-badge ${statusClass(val)}">${esc(val)}</span></td>`
          : `<td data-label="${label}">${esc(val)}</td>`;
      }).join("")}</tr>`;
    }).join("");

    const boundaryItems = (parsed.boundaries || []).map((b) =>
      `<li>${renderBoundaryTag(b.type)}${esc(b.text)}</li>`
    ).join("");

    return `<div class="section" id="nav-gm-okr">
      <div class="section-title">${t("gmOkr")}</div>
      ${renderRequirementBanner()}
      <div class="objective-panel">
        <div class="objective-label">${t("objective")}</div>
        <div class="objective-text">${esc(parsed.objective)}</div>
      </div>
      ${parsed.keyResults.length ? `
        <div class="gm-subsection">
          <div class="section-title">${t("keyResults")}</div>
          <table>
            <tr>${krHeaders.map((h) => `<th>${esc(h)}</th>`).join("")}</tr>
            ${krRows}
          </table>
        </div>
      ` : ""}
      ${parsed.boundaries.length ? `
        <div class="gm-subsection">
          <div class="section-title">${t("boundaries")}</div>
          <div class="card"><ul class="boundary-list">${boundaryItems}</ul></div>
        </div>
      ` : ""}
      ${renderPendingQuestions(parsed.pendingQuestions)}
    </div>`;
  }

  function renderRoleTree() {
    if (!state?.sections?.roleTree) return `<div class="section" id="nav-tree"><div class="section-title">${t("roleTree")}</div><div class="card"><p style="color:var(--text-secondary)">${t("noData")}</p></div></div>`;
    return `<div class="section" id="nav-tree">
      <div class="section-title">${t("roleTree")}</div>
      <div class="card md-content">${renderMarkdown(state.sections.roleTree)}</div>
    </div>`;
  }

  function renderHierarchicalOkr() {
    if (!state?.sections?.hierarchicalOkr) return `<div class="section" id="nav-hier-okr"><div class="section-title">${t("hierarchicalOkr")}</div><div class="card"><p style="color:var(--text-secondary)">${t("noData")}</p></div></div>`;
    return `<div class="section" id="nav-hier-okr">
      <div class="section-title">${t("hierarchicalOkr")}</div>
      <div class="card md-content">${renderMarkdown(state.sections.hierarchicalOkr)}</div>
    </div>`;
  }

  function renderDeliveryAct() {
    if (!state?.sections?.deliveryPlan) return `<div class="section" id="nav-act"><div class="section-title">${t("deliveryAct")}</div><div class="card"><p style="color:var(--text-secondary)">${t("noData")}</p></div></div>`;
    return `<div class="section" id="nav-act">
      <div class="section-title">${t("deliveryAct")}</div>
      <div class="card md-content">${renderMarkdown(state.sections.deliveryPlan)}</div>
    </div>`;
  }

  function renderStatusTable() {
    if (!state?.statusRows?.length) return `<div class="section" id="nav-status"><div class="section-title">${t("statusBoard")}</div><div class="card"><p style="color:var(--text-secondary)">${t("noData")}</p></div></div>`;
    const rows = state.statusRows.map((r) => {
      const cls = r.kr === selectedKr ? "selected" : "";
      const progressWidth = Math.max(0, Math.min(100, (parseFloat(r.progress) || 0) * 100));
      return `<tr class="${cls}" onclick="selectKr('${esc(r.kr)}')">
        <td data-label="${t("krId")}">${esc(r.kr)}</td><td data-label="${t("upperMapping")}">${esc(r.upperKr)}</td><td data-label="${t("role")}">${esc(r.role)}</td>
        <td data-label="${t("act")}">${esc(r.act)}</td>
        <td data-label="${t("status")}"><span class="status-badge ${statusClass(r.status)}">${esc(r.status)}</span></td>
        <td data-label="${t("progress")}">
          <div class="progress-bar"><div class="progress-fill" style="width:${progressWidth}%"></div></div>
          ${r.progress}
        </td>
        <td data-label="${t("evidence")}">${esc(r.evidence)}</td><td data-label="${t("nextStep")}">${esc(r.nextStep)}</td>
      </tr>`;
    }).join("");
    return `<div class="section" id="nav-status">
      <div class="section-title">${t("statusBoard")}</div>
      <table>
        <tr><th>${t("krId")}</th><th>${t("upperMapping")}</th><th>${t("role")}</th>
        <th>${t("act")}</th><th>${t("status")}</th><th>${t("progress")}</th>
        <th>${t("evidence")}</th><th>${t("nextStep")}</th></tr>
        ${rows}
      </table>
    </div>`;
  }

  function renderEvidence() {
    const items = state?.evidenceItems || [];
    if (!items.length) return `<div class="section" id="nav-evidence"><div class="section-title">${t("evidence")}</div><div class="card"><p style="color:var(--text-secondary)">${t("noData")}</p></div></div>`;
    const visible = selectedKr ? items.filter((item) => item.name.includes(selectedKr) || item.content.includes(selectedKr)) : items;
    const list = (visible.length ? visible : items).map((item) => `
      <div class="card">
        <div class="section-title">${esc(item.name)}</div>
        <div class="md-content">${renderMarkdown(item.content)}</div>
      </div>
    `).join("");
    return `<div class="section" id="nav-evidence">
      <div class="section-title">${t("evidence")}</div>
      ${list}
    </div>`;
  }

  function renderEvents() {
    if (!state?.events?.length) return `<div class="section" id="nav-events"><div class="section-title">${t("events")}</div><div class="card"><p style="color:var(--text-secondary)">${t("noData")}</p></div></div>`;
    const items = [...state.events].reverse().map((e) =>
      `<div class="event-item">
        <span class="event-time">${e.time?.slice(0, 19) || ""}</span>
        <strong>${esc(e.skill || "")}</strong> [${esc(e.act || "")}] ${esc(e.status || "")}
        <div>${esc(e.summary || "")}</div>
      </div>`
    ).join("");
    return `<div class="section" id="nav-events">
      <div class="section-title">${t("events")}</div>
      ${items}
    </div>`;
  }

  function renderReviews() {
    const items = state?.reviewItems || [];
    if (!items.length) return `<div class="section" id="nav-reviews"><div class="section-title">${t("reviews")}</div><div class="card"><p style="color:var(--text-secondary)">${t("noData")}</p></div></div>`;
    const list = items.map((item) => `
      <div class="card">
        <div class="section-title">${esc(item.name)}</div>
        <div class="md-content">${renderMarkdown(item.content)}</div>
      </div>
    `).join("");
    return `<div class="section" id="nav-reviews">
      <div class="section-title">${t("reviews")}</div>
      ${list}
    </div>`;
  }

  function renderFinalResult() {
    if (!state?.finalResult) return `<div class="section" id="nav-final"><div class="section-title">${t("finalR")}</div><div class="card"><p style="color:var(--text-secondary)">${t("noData")}</p></div></div>`;
    return `<div class="section" id="nav-final">
      <div class="section-title">${t("finalR")}</div>
      <div class="card md-content">${renderMarkdown(state.finalResult)}</div>
    </div>`;
  }

  function renderDrawer() {
    const drawer = document.getElementById("detail-drawer");
    if (!selectedKr || !state?.statusRows) {
      drawer.classList.remove("open");
      return;
    }
    const row = state.statusRows.find((r) => r.kr === selectedKr);
    if (!row) { drawer.classList.remove("open"); return; }
    drawer.classList.add("open");
    drawer.innerHTML = `
      <div class="section-title">${esc(row.kr)}</div>
      <div class="card">
        <p><strong>${t("upperMapping")}:</strong> ${esc(row.upperKr)}</p>
        <p><strong>${t("role")}:</strong> ${esc(row.role)}</p>
        <p><strong>${t("status")}:</strong> <span class="status-badge ${statusClass(row.status)}">${esc(row.status)}</span></p>
        <p><strong>${t("progress")}:</strong> ${row.progress}</p>
        <p><strong>${t("evidence")}:</strong> ${esc(row.evidence)}</p>
        <p><strong>${t("nextStep")}:</strong> ${esc(row.nextStep)}</p>
      </div>`;
  }

  function render() {
    document.getElementById("lang-toggle").textContent = lang === "zh" ? "EN" : "中文";
    const projectName = state?.project?.name || "";
    document.getElementById("project-name").textContent = projectName ? `${t("project")}: ${projectName}` : "";
    document.getElementById("project-name").title = projectName;
    document.getElementById("current-act").textContent = state?.currentAct ? `${t("currentAct")}: ${state.currentAct}` : "";

    if (state?.hasActive && state?.gmOkrParsed && activeNav === "nav-start") {
      activeNav = "nav-gm-okr";
    }

    renderSidebar();
    const ws = document.getElementById("workspace");
    ws.innerHTML = [
      renderGmOkr(),
      renderRoleTree(),
      renderHierarchicalOkr(),
      renderDeliveryAct(),
      renderStatusTable(),
      renderEvidence(),
      renderEvents(),
      renderReviews(),
      renderFinalResult(),
    ].join("");
    renderDrawer();

    const sections = ws.querySelectorAll(".section");
    sections.forEach((el) => {
      el.style.display = el.id === activeNav ? "" : "none";
    });
  }

  window.setMode = function (m) { inputMode = m; render(); };
  window.selectKr = function (kr) { selectedKr = selectedKr === kr ? null : kr; render(); };

  window.setPendingAnswer = function (idx, value) {
    pendingAnswers[idx] = value;
  };

  window.doRefineGm = async function () {
    const questions = state?.gmOkrParsed?.pendingQuestions || [];
    const answers = questions.map((q, i) => ({
      question: q.question,
      answer: pendingAnswers[i] === "__ignore__" ? null : (pendingAnswers[i] || null),
    }));
    const result = await api("/api/refine-gm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    if (result.mode === "manual") {
      alert(`${t("manualHint")}\n\n${result.prompt}`);
    } else if (result.command) {
      alert(`${result.mode} command:\n\n${result.command}`);
    }
    pendingAnswers = {};
  };

  window.doStart = async function () {
    let input;
    if (inputMode === "raw") {
      const req = document.getElementById("input-requirement")?.value;
      if (!req) return;
      input = { mode: "raw", requirement: req };
    } else {
      const obj = document.getElementById("input-objective")?.value;
      const krs = (document.getElementById("input-krs")?.value || "").split("\n").filter(Boolean);
      const bounds = document.getElementById("input-boundaries")?.value || "";
      if (!obj) return;
      input = { mode: "gm", objective: obj, keyResults: krs, boundaries: bounds };
    }
    const result = await api("/api/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (result.mode === "manual") {
      alert(`${t("manualHint")}\n\n${result.prompt}`);
    }
  };

  window.doAction = async function (action) {
    await api("/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
  };

  function connectSSE() {
    if (evtSource) evtSource.close();
    evtSource = new EventSource(`/events?token=${TOKEN}`);
    evtSource.addEventListener("snapshot", (e) => {
      try {
        state = JSON.parse(e.data);
        render();
      } catch {}
    });
    evtSource.onopen = () => {
      document.getElementById("connection-status").textContent = t("connected");
      document.getElementById("connection-status").style.color = "var(--status-done)";
    };
    evtSource.onerror = () => {
      document.getElementById("connection-status").textContent = t("disconnected");
      document.getElementById("connection-status").style.color = "var(--status-blocked)";
    };
  }

  async function init() {
    try {
      state = await api("/api/state");
    } catch {}
    render();
    connectSSE();
  }

  init();
})();
