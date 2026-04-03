# Research Comparison Template

## Documents
- This session outline: [ai-butler-research-outline.md](/Users/dracoglasser/自定程式/codex_playground/home-assistant-research/ai-butler-research-outline.md)
- DeepResearch prompt: [proactive-ai-butler-home-assistant-2026-04-02.md](/Users/dracoglasser/自定程式/codex_playground/home-assistant-research/deepresearch-prompts/proactive-ai-butler-home-assistant-2026-04-02.md)
- Session assessment: [home-assistant-simulation-runtime-assessment.md](/Users/dracoglasser/自定程式/codex_playground/home-assistant-research/home-assistant-simulation-runtime-assessment.md)
- Gemini report: pending

## Comparison Axes

### 1. Problem framing
- What is the system being compared against:
  - reactive controller
  - context-aware assistant
  - proactive coordinator
  - butler-class orchestrator
- Does the source define the target problem clearly?

### 2. Home Assistant capability boundaries
- What is officially supported today?
- What is possible only with external orchestration?
- What is implied but not documented?

### 3. Memory and context
- Short-term context support
- Long-term preference memory
- Calendar and to-do integration
- Cross-source context fusion

### 4. Planning and proactivity
- Can the system anticipate?
- Can it plan over time?
- Can it replan after interruption?
- Can it coordinate multiple constraints?

### 5. Tooling and MCP
- Real-time control
- Tool exposure boundaries
- MCP limitations
- Entity scaling and context selection

### 6. Multi-agent design
- Single planner vs planner plus specialists
- Candidate specialist roles
- Coordination failure modes
- Safety and approval boundaries

### 7. Benchmark design
- Does the benchmark go beyond one-shot commands?
- Does it test anticipation?
- Does it test selective confirmation?
- Does it test conflict resolution?
- Does it test long-horizon consistency?

### 8. Pain points
- Fragmented context
- Weak memory
- Policy gaps
- Trust/explainability
- Latency and token pressure
- Ecosystem maturity gaps

### 9. Strong claims to verify
- Claims grounded in official docs
- Claims grounded only in ecosystem evidence
- Claims that remain speculative

## Synthesis Format

### Agreement
- Points both sources support

### Tension
- Points where sources disagree or emphasize different risks

### Missing pieces
- Important issues covered by neither source

### Working conclusion
- Best current hypothesis after combining all sources
