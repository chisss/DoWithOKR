# DoWithOKR

[简体中文](README.md)

DoWithOKR is a multi-skill OKR workflow plugin for Claude Code and Codex. Its core metaphor is "a small technical company that works through OKR": the user is the client, Boss is the delivery lead and user-need proxy, Boss turns natural language needs into Boss OKR, and specialist roles decompose that into role OKR, delivery acts, status boards, upper-level scoring, and the final result.

## Core Concept

DoWithOKR is not just an OKR document generator. It defines an executable AI work model:

```text
Client Need -> Boss OKR -> Role Tree -> Role OKR -> Delivery Act Plan -> Status Board -> Upper-Level Scoring -> Final Result
```

- **Client Need**: the user's natural language request.
- **Boss OKR**: the Boss translates the need into measurable, acceptable outcomes.
- **Role OKR**: product, architecture, backend, frontend, QA, and other roles decompose objectives from upper-level KRs.
- **Delivery Acts**: virtual progress stages controlled by evidence gates, not calendar time.
- **Final Result**: deliverables, evidence, score, and review conclusion.

## Plugin Structure

```text
DoWithOKR/
  .claude-plugin/plugin.json
  .codex-plugin/plugin.json
  skills/
  references/
  examples/
  docs/
  scripts/validate-plugin.mjs
```

- `.codex-plugin/plugin.json`: Codex plugin manifest.
- `.claude-plugin/plugin.json`: Claude Code plugin manifest.
- `skills/`: DoWithOKR skill entry points.
- `references/`: shared output templates.
- `examples/`: sample OKR workflows.
- `docs/`: product docs, output format spec, and implementation plan.

## Roles

| Role | Positioning | Main Output |
| --- | --- | --- |
| Boss | Delivery lead / user-need proxy | Boss OKR, boundaries, acceptance criteria, final result |
| Product Manager | Converts Boss OKR into product scope | User flows, permission matrix, acceptance criteria |
| Architect | Owns technical plan and technical roles | Technical plan, API/data model, technical decomposition |
| Backend Developer | Implements service capabilities | APIs, data model, business logic, test evidence |
| Frontend Developer | Implements user experience | Pages, states, error messages, interaction evidence |
| QA Engineer | Verifies delivery quality | Test cases, regression records, defect feedback |
| DevOps / Release Engineer | Supports delivery and release | Environment, CI, deployment, rollback notes |
| Security Engineer | Identifies security risks | Permission, data, dependency, and prompt-injection checks |
| Technical Writer / DX | Reduces adoption friction | README, examples, setup, troubleshooting |

Default role tree:

```text
Boss
├─ Product Manager
│  └─ Technical Writer / DX
└─ Architect
   ├─ Backend Developer
   ├─ Frontend Developer
   ├─ QA Engineer
   ├─ DevOps / Release Engineer
   └─ Security Engineer
```

## Skills

| Skill | Purpose | Typical Trigger |
| --- | --- | --- |
| `okr-run` | Runs the full loop automatically | "Use DoWithOKR to run this requirement" |
| `okr-boss` | Converts client need into Boss OKR | "Prepare the Boss OKR first" |
| `okr-role-splitter` | Builds the role tree and hierarchy | "Split the required roles" |
| `okr-planner` | Creates hierarchical OKR and delivery acts | "Create the full OKR plan" |
| `okr-execution-plan` | Produces mapped execution tasks | "Generate the execution plan" |
| `okr-role-run` | Executes a specific role or role KR | "Run backend developer KR2" |
| `okr-status-tracker` | Shows the KR status board | "Show current OKR progress" |
| `okr-alignment-check` | Checks alignment with upper-level OKR | "Check whether this task has drifted" |
| `okr-review-score` | Scores and reviews final result | "Run OKR score review" |
| `okr-next-cycle` | Suggests the next delivery act or Boss OKR | "Move to the next cycle" |

## Delivery Acts

DoWithOKR uses "delivery acts" instead of real-world periods such as biweekly, monthly, or quarterly OKR:

| Act | Name | Goal |
| --- | --- | --- |
| M0 | Need Translation Act | Turn client need into Boss OKR |
| M1 | Organization Decomposition Act | Split Boss OKR into role tree and role OKR |
| M2 | Solution Formation Act | Product and architecture form an executable solution |
| M3 | Build Verification Act | Engineering, QA, and delivery roles produce evidence |
| M4 | Review Convergence Act | Upper levels score and summarize the final result |

## Usage Examples

Run the full workflow:

```text
Use DoWithOKR to run this requirement: build a user login and access-control module.
```

Create OKR step by step:

```text
DoWithOKR, first turn this requirement into Boss OKR.
DoWithOKR, split the role tree based on Boss OKR.
DoWithOKR, generate hierarchical OKR and a delivery act plan.
```

Run by role:

```text
DoWithOKR, run the Product Manager OKR first.
DoWithOKR, run Backend Developer KR2 under Architect.
DoWithOKR, ask QA Engineer to verify the current delivery.
```

Track and review:

```text
DoWithOKR, show the current OKR status board.
DoWithOKR, check whether the current task aligns with Boss OKR.
DoWithOKR, run OKR score review.
```

See the full example in [examples/login-access-okr.md](examples/login-access-okr.md).

## Example Output

### OKR Status Board

| KR | Upper KR | Role | Act | Status | Progress | Evidence | Next Step |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PM-KR1 | B-KR1 | Product Manager | M2 | Done | 1.0 | docs/flows.md | Wait for architecture review |
| ARCH-KR1 | B-KR1 | Architect | M2 | In Progress | 0.6 | docs/api.md | Add permission data model |
| QA-KR1 | ARCH-KR2 | QA Engineer | M3 | Blocked | 0.2 | tests/cases.md | Wait for stable API |

### OKR Score Review

| Reviewer | Reviewee | KR | Score | Evidence | Note |
| --- | --- | --- | --- | --- | --- |
| Boss | Product Manager | PM-KR1 | 1.0 | docs/flows.md | Flow is complete and acceptable |
| Architect | Backend Developer | BE-KR1 | 0.6 | tests/login.spec.ts | Login loop is done; permissions are incomplete |

**Boss Final Result: 0.72**

## Validation

Run from the `DoWithOKR` directory:

```bash
node scripts/validate-plugin.mjs
```

Expected output:

```text
DoWithOKR plugin validation passed
```

## Notes

- The current implementation is content-first and has no runtime service.
- `MEMORY.md` is a local working memory file and is excluded by `.gitignore`.
- The next step is real installation validation in Claude Code and Codex.
