# Task Plan: Proactive AI Butler MVP

## Goal
Build a runnable R6C-targeted MVP for a proactive AI butler stack: Home Assistant substrate, orchestrator, scripted scenario director, and lightweight 2D observer UI, with only virtual entities and an external planner model.

## Current Phase
Phase 2

## Phases

### Phase 1: Requirements & Discovery
- [x] Understand user intent
- [x] Identify constraints and requirements
- [x] Document findings in findings.md
- **Status:** complete

### Phase 2: Planning & Structure
- [x] Define technical approach
- [x] Create project structure if needed
- [x] Document decisions with rationale
- **Status:** in_progress

### Phase 3: Implementation
- [ ] Execute the plan step by step
- [ ] Build backend orchestration and planner adapter
- [ ] Build observer UI and deployment assets
- **Status:** pending

### Phase 4: Testing & Verification
- [ ] Verify core scenarios and API behavior
- [ ] Document test results in progress.md
- [ ] Fix any issues found
- **Status:** pending

### Phase 5: Delivery
- [ ] Review generated files and docs
- [ ] Summarize deployment and verification status
- [ ] Deliver runnable MVP to user
- **Status:** pending

## Key Questions
1. What is the lightest stack that still supports R6C deployment plus a visible observer UI?
2. How should virtual entities flow between the orchestrator and Home Assistant for the MVP?
3. Which scenario behaviors must be hardcoded in v1 so the external planner can be optional but the system still runs?

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Use a single TypeScript project with Fastify backend and static frontend | Minimal moving parts, easy Docker deployment on ARM64, enough for API plus observer UI |
| Default planner adapter supports mock mode plus OpenAI-compatible external mode | Keeps MVP runnable without credentials while preserving the external planner path |
| Use Home Assistant + Mosquitto deployment assets, but keep orchestrator authoritative for v1 world logic | Simplifies implementation while still landing the planned runtime stack on R6C |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| None yet | 1 | N/A |

## Notes
- Re-read plan before major decisions.
- Keep scope on MVP only: single planner, scripted roles, virtual entities, lightweight observer UI.
- Do not overbuild memory, true multi-agent roles, or real-device control in this pass.
