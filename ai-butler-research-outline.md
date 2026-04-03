# Research Outline: Proactive AI Butler for Smart Homes

## 1. Research Goal
Evaluate why current smart-home agents still behave mostly like reactive tool-callers and what is missing to reach a true "AI butler" model: an agent that understands household context, anticipates needs, plans ahead, coordinates multiple capabilities, and acts with minimal but appropriate user intervention.

This research is not about whether an agent can turn on a light after being told. It is about whether the system can infer that the light should already be on, decide when that inference is safe, and coordinate the right actions across devices, services, schedules, and household members.

## 2. Core Question
What prevents current Home Assistant plus LLM plus MCP-style systems from becoming proactive, planner-like, multi-step household agents?

## 3. Scope

### In scope
- Home Assistant as the household runtime and context layer
- MCP-style tool access for real-time observation and control
- Calendar, to-do, presence, and household state as planning inputs
- Proactive planning and anticipation
- Multi-step execution and recovery
- Multi-agent or subagent orchestration where useful
- Safety, permissions, trust, and confirmation design

### Out of scope
- Pure voice assistant UX
- Simple one-shot automations like "turn on the lamp"
- Fully embodied robotics
- General AGI speculation disconnected from actual smart-home stacks

## 4. Target Capability Model
The research should distinguish four system levels:

1. Reactive controller
Executes direct user commands against exposed tools.

2. Context-aware assistant
Uses state, entities, and recent context to answer better and choose more appropriate actions.

3. Proactive household coordinator
Looks at schedules, routines, constraints, and household state to act before being told.

4. Butler-class orchestrator
Maintains ongoing situational models, plans over time, delegates subtasks, resolves conflicts, and selectively asks for confirmation.

The main goal of the research is to understand the gap between level 2 and levels 3-4.

## 5. Primary Research Questions

### 5.1 Product and user-value questions
- What do users actually expect from a "smart home butler"?
- Which proactive behaviors feel helpful versus creepy, annoying, or unsafe?
- What tasks are high value enough to justify autonomy?

### 5.2 Systems questions
- How should a household agent combine real-time device state, schedules, to-dos, presence, weather, energy pricing, and family preferences?
- What memory model is required: short-term context, episodic memory, long-term preference memory, household rules, or all of them?
- How should the agent represent uncertainty and ask for confirmation?

### 5.3 Architecture questions
- What should Home Assistant own versus what should an external orchestrator own?
- What should be handled by a single planner agent versus specialized subagents?
- How should tools be exposed so the planner sees enough context without drowning in entities?

### 5.4 Evaluation questions
- How do we measure anticipation, appropriateness, and non-annoyance?
- How do we benchmark multi-step planning rather than command completion?
- How do we simulate long-running household situations instead of one-shot requests?

## 6. Pain Point Investigation Areas

### 6.1 Context fragmentation
The information needed for butler behavior is spread across entities, calendars, messaging, shopping lists, occupancy, alarms, weather, and external services. Research should examine whether current stacks can unify these into a single working model.

### 6.2 Weak memory
Most current systems can read current state but do not maintain reliable long-term memory of preferences, exceptions, commitments, or temporary household rules. Research should separate:
- stable preferences
- temporary instructions
- recurring routines
- event-specific commitments

### 6.3 Planning limitations
Current smart-home LLM integrations are often optimized for single-turn tool use, not multi-step plan creation, plan tracking, or delayed execution. Research should identify whether the bottleneck is model capability, integration design, or missing planning infrastructure.

### 6.4 Safety and permissions
A butler agent needs graded autonomy. Some actions should be automatic, some should require confirmation, and some should be prohibited. Research should map action classes such as:
- harmless comfort actions
- mildly disruptive actions
- privacy-sensitive actions
- safety-critical actions
- financially consequential actions

### 6.5 Attention and scaling
A real home can expose hundreds of entities and many concurrent signals. Research should study how current systems fail when context becomes too broad:
- entity overload
- token cost
- stale context
- poor relevance selection

### 6.6 Trust and explainability
Users tolerate occasional mistakes in chat. They do not tolerate unexplained actions in their home. Research should examine what kinds of explanations, previews, confirmations, and activity traces are required for trust.

### 6.7 Multi-agent orchestration
If subagents are allowed, what should they do? Research should examine whether the main planner should delegate to specialists such as:
- schedule analyst
- home-state analyst
- safety checker
- execution agent
- notification composer

The goal is to determine whether subagents materially improve planning quality or simply add latency and coordination failure.

## 7. Representative Butler-Class Scenario Families

### 7.1 Schedule-aware preparation
The household has an early airport departure tomorrow. The agent should infer preparation actions across the prior evening and next morning:
- sleep timing suggestions
- wake-up routines
- climate preconditioning
- hallway and kitchen lighting
- traffic-aware departure reminders

### 7.2 Multi-person household coordination
One person is working from home, one is napping, one is expected to return soon, and a visitor window is scheduled. The agent must balance comfort, noise, privacy, and access control.

### 7.3 Adaptive energy management
The agent sees weather, dynamic tariffs, occupancy forecasts, and calendar commitments. It pre-cools or pre-heats spaces, shifts appliances, and manages comfort-energy tradeoffs with explicit guardrails.

### 7.4 Elder or dependent care monitoring
The agent tracks routine deviations, lack of movement, missed medication windows, and unusual night activity, escalating gradually rather than instantly alarming.

### 7.5 Household operations and resilience
Internet degrades during a planned meeting, a battery backup is discharging, and cameras go offline. The agent should prioritize communication, fallback actions, and minimal disruption.

### 7.6 Exception handling and replanning
A plan has already started when a late calendar change, weather event, or family message invalidates it. The agent must replan safely and explain what changed.

## 8. Architecture Comparison Section
The research should explicitly compare three architectures:

1. Home Assistant native assistant plus conversation integrations
2. Home Assistant plus external planner agent
3. Home Assistant plus planner and specialized subagents

For each, compare:
- observability
- latency
- planning quality
- memory support
- safety control
- implementation complexity
- suitability for proactive behavior

## 9. Benchmark and Simulation Design
The research should propose a benchmark that tests:
- anticipation
- timing
- conflict resolution
- selective confirmation
- replanning after interruptions
- long-horizon consistency

The benchmark should avoid overly simple success definitions. It should score:
- whether the action happened
- whether it happened at the right time
- whether it was the right action under constraints
- whether a better lower-risk alternative existed
- whether the user would likely perceive it as helpful

## 10. Deliverables
The final research output should include:

1. A capability map from reactive control to butler-class autonomy
2. A pain-point taxonomy for current smart-home agents
3. A comparison of existing Home Assistant and LLM integration patterns
4. A recommended reference architecture for a proactive household agent
5. A role design for optional subagents
6. A set of benchmark scenario families
7. An MVP proposal for a virtual-household testbed

## 11. Working Hypotheses
- The largest current gap is not device control but unified context and memory.
- Planning quality is constrained more by orchestration and state modeling than by raw tool access.
- Proactivity fails mainly because systems lack explicit policy layers for "when to act" and "when to ask."
- A butler-class system likely needs a planner plus specialists, not just a single LLM with all tools exposed.
- A useful benchmark must model long-horizon household situations, not single commands.

## 12. Recommended Output Format for the Full Research

### Section A
Define the butler problem and explain why current smart-home assistants are still reactive.

### Section B
Survey the current Home Assistant plus LLM ecosystem and identify architectural limits.

### Section C
Analyze the missing layers: memory, planning, policy, permissions, and subagent orchestration.

### Section D
Propose a benchmark and reference architecture for evaluating proactive household agents.

### Section E
Conclude with near-term opportunities, likely dead ends, and the smallest credible prototype.
