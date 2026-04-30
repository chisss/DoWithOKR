# DoWithOKR

[简体中文](README.md)

> Drive value delivery through OKR-powered AI teams. A multi-skill workflow plugin for Claude Code and Codex.

## Design Philosophy

DoWithOKR is not a task management tool — it is a **value alignment engine**.

The daily work of engineering teams is fundamentally about "executing actions" — writing code, fixing bugs, running integrations. But the OKR framework asks a different question: not "what did you do?" but **what value did you deliver, and to what standard?** DoWithOKR is built around this core insight.

**The user is the client, GM is the requirement proxy, and AI plays a full product-engineering team.** Requirements flow through OKR translation, role decomposition, delivery acts, and converge into verifiable deliverables with scores.

### Five Design Tenets

1. **Objectives align to value, never to tasks** — O is a direction ("deliver high-quality Agent core module"), not an action ("develop Agent tools")
2. **KRs are delivery standards, must be quantifiable** — Formula: `deadline + deliverable + quality metric`
3. **Roles decide how to execute** — The system verifies results against standards, it does not dictate implementation paths
4. **Capability accumulates across cycles** — Roles are not stateless executors but experienced professionals who grow
5. **Value is traceable** — From requirement to delivery to scoring, forming a complete value chain

### Layered Alignment: Top Talks Value, Bottom Talks Delivery

```
┌───────────────────────────────────────────────┐
│  Strategic Layer (GM)                           │
│  O: Business value, tech strategy               │
│  KR: Milestones, performance metrics            │
├───────────────────────────────────────────────┤
│  Management Layer (PD / ArchD)                  │
│  O: Delivery efficiency, team capability        │
│  KR: Quality standards, progress milestones     │
├───────────────────────────────────────────────┤
│  Execution Layer (BE / FE / QA / DevOps / ...)  │
│  O: High-quality module delivery                │
│  KR: Deadline + deliverable + quality metric    │
└───────────────────────────────────────────────┘
```

Each layer's KRs are a concretization of the layer above. Every lower-level O must answer: "which upper-level KR am I supporting?"

### KR Paradigm: From "Writing Actions" to "Writing Delivery Standards"

| Daily Action | ❌ Wrong KR | ✅ Right KR |
|-------------|------------|------------|
| Build feature | Build user management module | Complete user module by 5/10, unit test coverage ≥ 90% |
| Fix bugs | Fix production bugs | Production bugs responded within 24h, fix rate ≥ 95% |
| Write docs | Write API docs | Complete API docs by 5/15, zero integration blockers |
| Optimize perf | Optimize search speed | Complete search optimization by 6/1, response time reduced 30% |

### Capability Accumulation: Roles Grow Over Time

After each OKR cycle, the system distills lessons from scoring and reviews into each role's `wisdom` memory. When the next cycle starts, roles read their historical experience as prior knowledge — avoiding past mistakes and continuously improving professional judgment.

```
Requirement → OKR → Delivery → Scoring → Value Summary → Capability Distillation → Wisdom
 ↑                                                                                    │
 └────────────────────────────────────────────────────────────────────────────────────┘
                              (next cycle is more precise)
```

---

## How It Works

```mermaid
graph LR
    A[Client Need] --> B[GM OKR]
    B --> C[Role Tree]
    C --> D[Hierarchical OKR]
    D --> E[Delivery Act Plan]
    E --> F[Role Execution]
    F --> G[Status Board]
    G --> H[Score Review]
    H --> I[Final R]
    I --> J[Capability Accumulation]
    J -.-> B
```

## Role Architecture

```text
GM General Manager (Client Proxy)
├── PD Product Director
│   ├── PM Product Manager
│   ├── UI Designer
│   └── TW Technical Writer / DX
└── ArchD Technical Director
    ├── BE Backend Engineer
    ├── FE Frontend Engineer
    ├── QA QA Engineer
    ├── DevOps Release Engineer
    └── SEC Security Engineer
```

| Role | Abbr | Positioning | Key Output |
| --- | --- | --- | --- |
| General Manager | GM | Client proxy, defines top-level OKR | GM OKR, boundaries, acceptance criteria |
| Product Director | PD | Product direction management | Product plan, coordinates PM/UI/TW |
| Product Manager | PM | Requirement analysis & acceptance | User flows, permission matrix, acceptance criteria |
| UI Designer | UI | Interaction & visual design | Design specs, interaction guidelines |
| Technical Writer / DX | TW | Reduces adoption friction | README, examples, setup guides |
| Technical Director | ArchD | Technical plan & engineering management | Tech plan, API contracts, module decomposition |
| Backend Engineer | BE | Service implementation | APIs, data models, business logic |
| Frontend Engineer | FE | User experience implementation | Pages, state management, interactions |
| QA Engineer | QA | Delivery quality verification | Test cases, regression records |
| Release Engineer | DevOps | Delivery & release support | CI/CD, deployment, environment config |
| Security Engineer | SEC | Security risk identification | Permission checks, vulnerability scanning |

Scoring chain: GM → PD + ArchD, PD → PM + UI + TW, ArchD → BE + FE + QA + DevOps + SEC

## Skills

| Skill | Purpose | Trigger |
| --- | --- | --- |
| `okr-run` | Full automated loop | "Use DoWithOKR to run this requirement" |
| `okr-gm` | Convert need to GM OKR | "Prepare the GM OKR first" |
| `okr-role-splitter` | Build role tree | "Split the required roles" |
| `okr-planner` | Hierarchical OKR + delivery acts | "Create the full OKR plan" |
| `okr-execution-plan` | Delivery verification plan | "Generate the delivery verification plan" |
| `okr-role-run` | Execute a specific role's KR | "Run backend engineer KR2" |
| `okr-status-tracker` | KR status board | "Show current OKR progress" |
| `okr-alignment-check` | Check delivery against KR standards | "Check whether this task has drifted" |
| `okr-review-score` | Score review + experience distillation | "Run OKR score review" |
| `okr-next-cycle` | Next cycle recommendation + capability report | "Move to the next cycle" |

## Delivery Act Model

DoWithOKR replaces real-world time periods with evidence-gated "delivery acts":

| Act | Name | Goal | Key Roles |
| --- | --- | --- | --- |
| M0 | Need Translation | Client need → GM OKR | GM |
| M1 | Organization Decomposition | Role tree + role OKR | GM |
| M2 | Solution Formation | Product plan + tech plan | PD, PM, UI, ArchD |
| M3 | Build Verification | Code, tests, docs | BE, FE, QA, DevOps, SEC, TW |
| M4 | Review Convergence | Scoring + value summary + capability accumulation | GM |

## Installation

### Prerequisites

- [Git](https://git-scm.com/)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) or [Codex CLI](https://github.com/openai/codex)

### Claude Code (Recommended)

```bash
git clone https://github.com/<your-username>/DoWithOKR.git
cd DoWithOKR
./install.sh /path/to/your/project
```

`install.sh` copies skill files to `.claude/commands/` and appends routing rules to `CLAUDE.md`.

### Codex

Place the `DoWithOKR` directory in your project root. Codex auto-discovers it via `.codex-plugin/plugin.json`.

### Uninstall

```bash
./uninstall.sh /path/to/your/project
```

## Quick Start

**1. Install**

```bash
git clone https://github.com/<your-username>/DoWithOKR.git && cd DoWithOKR && ./install.sh /path/to/your/project
```

**2. Trigger full auto mode (in Claude Code):**

```text
Use DoWithOKR to run this requirement: build a user login and access-control module.
```

**3. Check output**

```bash
ls /path/to/your/project/.okr/
# active.md  status.md  evidence/  reviews/  wisdom/
```

### Step-by-Step Mode

```text
/okr-gm              → Convert need to GM OKR
/okr-role-splitter   → Decompose role tree
/okr-planner         → Hierarchical OKR + delivery acts
/okr-execution-plan  → Delivery verification plan
/okr-role-run        → Execute a specific role's KR
/okr-status-tracker  → View status board
/okr-review-score    → Score review
```

## State Files

All OKR state is persisted in the `.okr/` directory:

```text
.okr/
  active.md       # GM OKR, role tree, hierarchical OKR, delivery act plan
  status.md       # KR status board
  evidence/       # Per-KR evidence index
  reviews/        # Score review records
  wisdom/         # Role capability accumulation
  archive/        # Historical snapshots
```

Recommended: `echo '.okr/' >> .gitignore`

## Example Output

### Status Board

| KR | Upper KR | Role | Act | Status | Progress | Evidence | Next Step |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PD-KR1 | GM-KR1 | PD Product Director | M2 | Done | 1.0 | docs/product-plan.md | Await tech review |
| ARCHD-KR1 | GM-KR1 | ArchD Tech Director | M2 | In Progress | 0.6 | docs/api.md | Add permission data model |
| BE-KR1 | ARCHD-KR1 | BE Backend | M3 | In Progress | 0.4 | src/api/login.ts | Implement auth check |
| QA-KR1 | ARCHD-KR1 | QA Engineer | M3 | Blocked | 0.2 | tests/cases.md | Waiting for stable API |

### Score Review

| Reviewer | Reviewee | KR | Score | Evidence | Note |
| --- | --- | --- | --- | --- | --- |
| GM | PD Product Director | PD-KR1 | 1.0 | docs/product-plan.md | Plan is complete and acceptable |
| ArchD | BE Backend | BE-KR1 | 0.7 | tests/login.spec.ts | Login loop complete |

**GM Final R = Product Line R × 40% + Tech Line R × 60% = 0.72**

See the full example in [examples/login-access-okr.md](examples/login-access-okr.md).

## Plugin Structure

```text
DoWithOKR/
  .claude-plugin/plugin.json    # Claude Code manifest
  .codex-plugin/plugin.json     # Codex manifest
  skills/                       # 10 skill entry points
  references/                   # Shared templates & specs
  examples/                     # Sample OKR workflows
  docs/                         # Product docs & design philosophy
  scripts/validate-plugin.mjs   # Plugin validation script
```

## Validation

```bash
cd DoWithOKR && node scripts/validate-plugin.mjs
# DoWithOKR plugin validation passed
```

## Notes

- Content-first plugin with no runtime service dependency
- Skills communicate via `.okr/` state files for cross-invocation context
- Supports resume from checkpoint: re-trigger `okr-run` after interruption to auto-resume

## Roadmap

### v1.x — Value Alignment Refactor (Current)

Targeting engineering teams, landing the core design philosophy:

- **KR Paradigm Upgrade** — Templates and guidance fully switch to the "deadline + deliverable + quality metric" paradigm, with KR quality self-checks and anti-pattern detection
- **Role Autonomy** — `okr-execution-plan` repositioned from "execution plan" to "delivery verification plan", outputting acceptance criteria and verification methods instead of step-by-step tasks
- **Capability Accumulation System** — Implement `.okr/wisdom/` role memory; write experience at M4, read prior knowledge at M0
- **Value Measurement Loop** — Add value summary on top of scoring (value layer + capability layer + insight layer), forming a cross-cycle positive flywheel

### v2.0 — Multi-Team Types

Extend the OKR value alignment framework beyond engineering teams:

```text
DoWithOKR Team Types
├── Engineering Team (v1.0 ✅)
│   GM → PD + ArchD → BE / FE / QA / DevOps / SEC
│
├── Marketing Team (v2.0)
│   GM → CMO → Brand Manager / Growth Manager / Content Ops
│   KR example: "Increase Q2 brand exposure by 50%, reduce CAC by 20%"
│
└── Operations Team (v2.0)
    GM → COO → User Ops / Campaign Ops / Data Analytics
    KR example: "Increase MAU retention to 85%, NPS ≥ 60"
```

Key prerequisite: configurable role system — extract role definitions from skill files into configuration files that define team types and role trees.

### v3.0 — Cross-Functional Hybrid Teams

```text
GM → CTO + CMO + COO → Specialized Roles
```

Support cross-functional OKR alignment where multiple business lines' KRs converge at the GM layer, each line delivers independently, and scoring is unified.