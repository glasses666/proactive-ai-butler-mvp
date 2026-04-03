# Findings & Decisions

## Requirements
- R6C hosts runtime, orchestration substrate, virtual household state, and observer UI.
- Planner uses an external model path, but the MVP should remain runnable without real credentials.
- Only virtual entities are controlled in v1.
- Scenario pack focuses on schedule-driven coordination.
- Runtime uses one real planner plus scripted roles and a scenario director.
- Observer experience should feel like a lightweight 2D household simulation rather than a plain dashboard.

## Research Findings
- R6C has enough RAM/storage and open Docker Compose support for a light multi-container stack.
- Existing research in this workspace converges on Home Assistant being a good runtime substrate but not the full butler planner layer.
- The MVP needs a visible, replayable world model more than deep smart-home correctness.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Backend in TypeScript/Fastify | Fast to implement, easy SSE/API support, simple deployment |
| Static browser UI with a pixel/retro 2D map | Matches requested feel while keeping frontend complexity manageable |
| Scripted scenario director instead of true roleplay agents | Preserves Truman's World flavor without exploding complexity |
| MQTT included in deployment | Gives a path to HA integration and future virtual entities without requiring complex custom integrations now |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| Need to balance planned HA-centric design with minimal runnable MVP | Orchestrator will own the world model in v1 and sync outward, while deployment assets still include HA/MQTT |

## Resources
- Workspace research docs in current directory
- Remote R6C Docker environment at `root@192.168.100.1`
- Home Assistant and planner research already summarized in `current-research-brief.md`

## Visual/Browser Findings
- No additional browser findings yet.
