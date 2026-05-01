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
    },
  };

  let lang = localStorage.getItem("dowithokrLang") || "zh";
  let state = null;
  let selectedKr = null;
  let inputMode = "raw";
  let evtSource = null;
  let activeNav = "nav-start";

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

  function renderSidebar() {
    const sb = document.getElementById("sidebar");
    const items = [
      { id: "nav-start", label: t("rawRequirement") },
      { id: "nav-act", label: t("deliveryAct") },
      { id: "nav-tree", label: t("roleTree") },
      { id: "nav-status", label: t("statusBoard") },
      { id: "nav-events", label: t("events") },
      { id: "nav-reviews", label: t("reviews") },
    ];
    sb.innerHTML = `
      <div class="menu-title">${t("menu")}</div>
      <div class="menu-list">
        ${items.map((i) => `
          <button class="menu-item ${activeNav === i.id ? "active" : ""}" type="button" onclick="scrollToSection('${i.id}')">
            <span>${i.label}</span>
          </button>
        `).join("")}
      </div>`;
  }

  window.scrollToSection = function (id) {
    activeNav = id;
    renderSidebar();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  function renderStartForm() {
    if (state?.hasActive) {
      return `<div class="section" id="nav-start">
        <div class="section-title">${t("currentAct")}: ${state.currentAct || "?"}</div>
        <div class="card">
          <p>${state.sections?.requirement || state.sections?.gmOkr || t("noData")}</p>
          <div style="margin-top:12px;display:flex;gap:8px">
            <button class="btn btn-primary" onclick="doAction('continue')">${t("continueRun")}</button>
            <button class="btn btn-secondary" onclick="doAction('restart')">${t("restart")}</button>
            <button class="btn btn-secondary" onclick="doAction('cancel')">${t("cancel")}</button>
          </div>
        </div>
      </div>`;
    }
    return `<div class="section" id="nav-start">
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

  function renderGmOkr() {
    if (!state?.sections?.gmOkr) return "";
    return `<div class="section">
      <div class="section-title">${t("gmOkr")}</div>
      <div class="card"><pre style="white-space:pre-wrap">${esc(state.sections.gmOkr)}</pre></div>
    </div>`;
  }

  function renderRoleTree() {
    if (!state?.sections?.roleTree) return "";
    return `<div class="section" id="nav-tree">
      <div class="section-title">${t("roleTree")}</div>
      <div class="card"><pre style="white-space:pre-wrap;font-size:13px">${esc(state.sections.roleTree)}</pre></div>
    </div>`;
  }

  function renderHierarchicalOkr() {
    if (!state?.sections?.hierarchicalOkr) return "";
    return `<div class="section">
      <div class="section-title">${t("hierarchicalOkr")}</div>
      <div class="card"><pre style="white-space:pre-wrap;font-size:13px">${esc(state.sections.hierarchicalOkr)}</pre></div>
    </div>`;
  }

  function renderStatusTable() {
    if (!state?.statusRows?.length) return "";
    const rows = state.statusRows.map((r) => {
      const cls = r.kr === selectedKr ? "selected" : "";
      return `<tr class="${cls}" onclick="selectKr('${esc(r.kr)}')">
        <td>${esc(r.kr)}</td><td>${esc(r.upperKr)}</td><td>${esc(r.role)}</td>
        <td>${esc(r.act)}</td>
        <td><span class="status-badge ${statusClass(r.status)}">${esc(r.status)}</span></td>
        <td>
          <div class="progress-bar"><div class="progress-fill" style="width:${(parseFloat(r.progress) || 0) * 100}%"></div></div>
          ${r.progress}
        </td>
        <td>${esc(r.evidence)}</td><td>${esc(r.nextStep)}</td>
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

  function renderEvents() {
    if (!state?.events?.length) return "";
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

  function renderDeliveryAct() {
    if (!state?.sections?.deliveryPlan) return "";
    return `<div class="section" id="nav-act">
      <div class="section-title">${t("deliveryAct")}</div>
      <div class="card"><pre style="white-space:pre-wrap;font-size:13px">${esc(state.sections.deliveryPlan)}</pre></div>
    </div>`;
  }

  function renderReviews() {
    if (!state?.reviewFiles?.length) return "";
    return `<div class="section" id="nav-reviews">
      <div class="section-title">${t("reviews")}</div>
      <div class="card">${state.reviewFiles.map((f) => `<div>${esc(f)}</div>`).join("")}</div>
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

  function esc(s) {
    if (!s) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function render() {
    document.getElementById("lang-toggle").textContent = lang === "zh" ? "EN" : "中文";
    const projectName = state?.project?.name || "";
    document.getElementById("project-name").textContent = projectName ? `${t("project")}: ${projectName}` : "";
    document.getElementById("project-name").title = projectName;
    document.getElementById("current-act").textContent = state?.currentAct ? `${t("currentAct")}: ${state.currentAct}` : "";
    renderSidebar();
    const ws = document.getElementById("workspace");
    ws.innerHTML = [
      renderStartForm(),
      renderGmOkr(),
      renderRoleTree(),
      renderHierarchicalOkr(),
      renderDeliveryAct(),
      renderStatusTable(),
      renderEvents(),
      renderReviews(),
    ].join("");
    renderDrawer();
  }

  window.setMode = function (m) { inputMode = m; render(); };
  window.selectKr = function (kr) { selectedKr = selectedKr === kr ? null : kr; render(); };

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
