# Research Comparison Scaffold

## Topic
Proactive AI Butler for Smart Homes

## Sources to Compare
- This workspace research
- Gemini DeepResearch report

## 1. Core Thesis
### Workspace research
- Home Assistant is a strong AI substrate, but current official AI surfaces are still optimized for controllable, user-bounded, event-triggered interactions rather than a persistent household executive.
- The key gap to a butler-class system is not device control; it is unified context, durable memory, explicit planning state, and autonomy policy.

### Gemini report
- Current smart-home AI is still structurally reactive: the human remains the primary trigger, and most systems behave like sophisticated remote controls rather than autonomous household coordinators.
- MCP plus orchestration plus memory plus guardrails is presented as the most viable path toward a proactive butler architecture.

### Convergence / divergence
- Strong agreement on the main diagnosis: current systems are reactive and the real gap is architectural rather than basic tool access.
- Gemini leans harder toward MCP as the central enabling layer; workspace research treats MCP as useful but still incomplete.

## 2. Capability Ladder
### Workspace research
- Reactive controller
- Context-aware assistant
- Proactive coordinator
- Butler-class orchestrator

### Gemini report
- Reactive controller
- Context-aware assistant
- Proactive household coordinator
- Butler-class orchestrator

### Convergence / divergence
- Strong agreement. Gemini's ladder matches the workspace framing closely.
- Gemini adds stronger assumptions about memory architecture at the top tiers; those should be treated as design choices, not established requirements.

## 3. Official Home Assistant Boundaries
### Workspace research
- Official Home Assistant LLM integrations are centered on Assist exposure and conversation handling.
- Official docs and release notes recommend limiting exposed entities, especially for local models.
- Official Home Assistant MCP support is real, but current support is partial and does not by itself solve planning, memory, or proactive monitoring.
- Calendar and todo can be integrated, but they are building blocks rather than a complete planning layer.

### Gemini report
- Native Assist patterns are framed as fundamentally reactive and limited by context-window bloat.
- MCP is described as a major architectural improvement because it allows on-demand state queries instead of full state dumps.
- External planner agents are described as a necessary step toward autonomy.

### Convergence / divergence
- Agreement: native Assist is not enough for butler-class behavior.
- Needed correction: Gemini conflates official Home Assistant MCP support with community servers such as `ha-mcp` and `mcp-assist`, and overstates SSE-driven real-time capability as if it were a settled official stack.

## 4. Pain Points
### Workspace research
- Context fragmentation
- Weak memory
- Planning and replanning limits
- Policy / permissions
- Entity and token scaling
- Trust / explainability
- Multi-agent coordination cost

### Gemini report
- Context fragmentation and entity scaling
- Hybrid memory gaps
- Planning, replanning, and temporal reasoning limits
- Policy and permission boundaries
- Multi-agent coordination cost and trust

### Convergence / divergence
- Strong agreement on all major pain points.
- Gemini's memory section is directionally good, but the specific claim that vector plus knowledge graph is the necessary solution is still inference, not settled evidence.

## 5. Architecture Options
### Workspace research
- Native Assist / conversation
- External planner agent
- Planner plus specialist subagents

### Gemini report
- Native conversation / Assist integrations
- Home Assistant plus external planner agents
- Home Assistant plus MCP-style interfaces
- Planner plus specialist subagents

### Convergence / divergence
- Strong agreement on the option set.
- Gemini's architecture scorecard is useful as a discussion tool, but the ratings are mostly reasoned judgment rather than directly measured evidence.

## 6. Benchmark / Simulation Design
### Workspace research
- 

### Gemini report
- Uses SimuHome as the strongest current reference point and proposes a proactive benchmark layered on top.
- Emphasizes anticipation, selective confirmation, conflict resolution, replanning, and long-horizon memory.

### Convergence / divergence
- Strong agreement on what should be measured.
- Follow-up needed on how much of SimuHome's Matter-centered design transfers cleanly to a Home Assistant-centered runtime.

## 7. MVP Recommendation
### Workspace research
- 

### Gemini report
- Home Assistant Core
- MCP-facing protocol layer
- External orchestration engine such as n8n or LangGraph
- Local LLM runtime
- Hybrid memory layer
- Policy enforcement middleware

### Convergence / divergence
- Strong agreement on Home Assistant plus external orchestration.
- Needed downgrade: Gemini's MVP is closer to a serious research platform than a true minimum viable prototype.
- Needed correction: `official ha-mcp (or mcp-assist) server` is not accurate wording; those are not the official Home Assistant server story.

## 8. Open Questions
### Workspace research
- 

### Gemini report
- Integration of vector memory and knowledge graphs
- Synchronization stability across orchestrator and Home Assistant
- Temporal reasoning weaknesses in current LLMs
- Lack of shared safety taxonomies and cross-ecosystem interoperability

### Convergence / divergence
- Strong agreement that model temporal reasoning and safety policy remain open problems.
- Gemini's ecosystem-level ideas like universal autonomy certificates are interesting but speculative and should be labeled as such.
