# Current Research Brief

## Topic
From reactive smart-home assistant to proactive AI butler

## 1. Official Home Assistant Boundaries

### 1.1 Home Assistant officially supports LLM control, but within a tool-calling frame
- Official conversation integrations such as OpenAI, Google Gemini, and Ollama can control Home Assistant by exposing Assist-accessible entities to the model.
- This means the default model of operation is still "model + exposed tools", not a native planner with household memory and long-horizon policy.

Key sources:
- [OpenAI integration](https://www.home-assistant.io/integrations/openai_conversation)
- [Google Gemini integration](https://www.home-assistant.io/integrations/google_generative_ai_conversation)
- [Ollama integration](https://www.home-assistant.io/integrations/ollama)

### 1.2 Entity exposure remains a practical bottleneck
- Home Assistant officially recommends exposing only the minimum needed entities to Assist because more exposed entities hurt parsing performance and increase LLM context cost.
- As of the 2024-08-07 release notes, Home Assistant explicitly recommended exposing fewer than 25 entities when experimenting with local LLMs.
- The Ollama integration still repeats this guidance in current docs.

Key sources:
- [Best practices with Assist](https://www.home-assistant.io/voice_control/best_practices/)
- [2024.8 release note](https://www.home-assistant.io/blog/2024/08/07/release-20248/)
- [Ollama integration](https://www.home-assistant.io/integrations/ollama)

### 1.3 External conversation agents are not fully native to local sentence-trigger flows
- OpenAI and Gemini conversation integrations explicitly state that they do not integrate with sentence triggers.
- Home Assistant automation docs say sentence triggers do not work with external conversation agents unless "Prefer handling commands locally" is enabled.
- This suggests that external LLM integrations are attached to Assist rather than deeply merged into every local intent path.

Key sources:
- [OpenAI integration](https://www.home-assistant.io/integrations/openai_conversation)
- [Google Gemini integration](https://www.home-assistant.io/integrations/google_generative_ai_conversation)
- [Automation trigger docs](https://www.home-assistant.io/docs/automation/trigger/)

### 1.4 MCP support in Home Assistant is partial
- Home Assistant's official MCP integration currently supports Tools and OAuth-based authorization.
- The same documentation states that Prompts, Resources, Sampling, and Notifications are not supported.
- This is important because butler-like systems often need richer context transport, memory retrieval, and push-style updates beyond simple tool calls.

Key source:
- [MCP integration](https://www.home-assistant.io/integrations/mcp)

### 1.5 Calendar and to-do can drive proactive workflows, but they are not a full planning layer
- Home Assistant supports calendar triggers, including offsets before or after event start/end.
- CalDAV entities update roughly every 15 minutes.
- Todoist tasks update roughly every minute and are exposed as both `todo` and `calendar` entities.
- These are useful for planning inputs and automation triggers, but they do not amount to a built-in household planner or policy engine.

Key sources:
- [Automation trigger docs](https://www.home-assistant.io/docs/automation/trigger/)
- [CalDAV integration](https://www.home-assistant.io/integrations/caldav)
- [Todoist integration](https://www.home-assistant.io/integrations/todoist)

### 1.6 Home Assistant automations are capable, but mostly deterministic
- Home Assistant automations and scripts support triggers, offsets, conditions, waits, branching, and service execution.
- This is strong enough for proactive automations, but the platform does not document a native long-term household memory system or a built-in long-horizon planner for LLM agents.

Inference:
- Home Assistant is strong as a runtime and automation substrate, but the butler-like layers still appear to sit outside the core platform: memory, plan state, policy, and tool-selection strategy.

### 1.7 Raw state injection is not a full virtual device mechanism
- The official REST API states that `POST /api/states/<entity_id>` can create or update arbitrary states.
- The same docs explicitly say this only sets Home Assistant's representation and does not communicate with the actual device.
- This is useful for simulation state and synthetic observations, but not equivalent to creating a fully controllable integration-backed actuator.

Key source:
- [REST API docs](https://developers.home-assistant.io/docs/api/rest/)

## 2. Ecosystem Pain Signals

These are not official platform statements. They are signals from the ecosystem and should be treated as anecdotal evidence of recurring friction.

### 2.1 Users are actively building their own memory layers
- Community projects exist specifically to add persistent or dynamic memory to Home Assistant voice assistants.
- The fact that these are external blueprints and custom setups is itself a signal that native long-term memory remains a gap.

Signals:
- [Voice Assistant Long-term Memory](https://community.home-assistant.io/t/voice-assistant-long-term-memory/935090)
- [Voice Assistant Memory](https://community.home-assistant.io/t/voice-assistant-memory/856199)
- [Dynamic Memory for Voice Assistant](https://community.home-assistant.io/t/dynamic-memory-for-voice-assistant/945256)

### 2.2 Large entity sets remain a real concern
- Community projects such as MCP Assist explicitly pitch themselves as solving "massive entity dumps", token overhead, and poor performance in homes with 200+ devices.
- This lines up with official Home Assistant guidance to minimize exposed entities.

Signal:
- [MCP Assist - 95% Token Reduction](https://community.home-assistant.io/t/mcp-assist-95-token-reduction-for-voice-assistants-with-local-cloud-llms/977977)

### 2.3 Calendar and planning behavior still require workarounds
- Community discussions around calendar often reveal a gap between "event exists in Home Assistant" and "agent can reason over the broader schedule."
- This suggests that schedule-aware butler behavior likely needs additional orchestration logic beyond native entity exposure.

Signals:
- [Assist and GoogleCalendar](https://community.home-assistant.io/t/assist-and-googlecalendar/885912)
- [Ha and Calendar](https://community.home-assistant.io/t/ha-and-calendar/562934)

### 2.4 Specialized agent roles are already emerging
- Community projects are already framing smart-home agents in specialist roles such as "Safety Officer".
- This is early evidence that planner-plus-specialists may be more natural than one single model with every tool exposed.

Signal:
- [MCP Server for Home Assistant + Local LLM “Safety Officer”](https://community.home-assistant.io/t/mcp-server-for-home-assistant-local-llm-safety-officer-sse-automations-api-n8n/973127)

## 3. Working Interpretation
- The current Home Assistant ecosystem is already strong enough for context-aware control and some proactive automations.
- The main missing layers for a true AI butler are not raw tool access but unified context, durable memory, policy, and long-horizon planning.
- Subagents are worth investigating because the ecosystem is already drifting toward specialist roles, and because a single planner with hundreds of entities and mixed responsibilities will likely struggle with relevance, latency, and trust.

## 4. What to Compare Against Gemini Later
- Does Gemini also conclude that the main gap is memory and policy rather than device control?
- Does Gemini find stronger evidence for or against Home Assistant as the right runtime core?
- Does Gemini recommend a single-agent planner, or planner plus specialist subagents?
- Does Gemini identify better benchmark families for proactive household behavior?
