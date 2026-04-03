# Home Assistant MCP Integration Note

Date: 2026-04-03

## Purpose

Record the current direction for the project and clarify how Home Assistant MCP should be connected for the first butler-agent phase.

This note is based on official Home Assistant documentation as of 2026-04-03:

- https://www.home-assistant.io/integrations/mcp_server
- https://www.home-assistant.io/integrations/mcp

## Agreed Direction

For v1, the system should use a single butler agent rather than multiple resident or director agents.

The butler should not behave like a fully autonomous invisible concierge yet. A safer and more realistic interaction shape is:

1. The user gives a high-level intent such as "I am tired and just got home".
2. The system reads current context such as time, schedule, room state, device state, and existing house mode.
3. The butler proposes 2-3 candidate scenes or responses.
4. The user selects one option or confirms the recommendation.
5. The local execution layer applies the scene to the virtual household.

This keeps the system useful without pretending it already has strong long-term memory or human-level household judgment.

## Official Home Assistant MCP Fact Check

Home Assistant currently exposes two different MCP-related integrations, and they solve opposite problems.

### 1. `mcp_server`

This is the integration we need for agent connectivity.

- Home Assistant acts as an MCP server for external LLM clients.
- The endpoint is `/api/mcp`.
- Control is limited to entities exposed to Assist / the exposed entities page.
- Authentication can be done via OAuth or Long-Lived Access Token depending on the client.
- Official examples exist for Claude Desktop, Claude Code, Cursor, and gemini-cli.

Current official support status:

- Tools: supported
- Prompts: supported
- Resources: not supported
- Sampling: not supported
- Notifications: not supported

### 2. `mcp`

This is not the primary path we need for the first butler phase.

- Home Assistant acts as an MCP client to an external MCP server.
- It is used to add extra tools into HA conversation agents.
- It currently relies on SSE transport.
- It supports tools, but not prompts, resources, sampling, or notifications.

This integration is useful if Home Assistant itself needs to consume an external MCP server, for example memory or web-search tools. It is not the cleanest first step for connecting an external butler agent to Home Assistant.

## Recommendation For This Project

### Recommended V1 architecture

Use `Home Assistant MCP Server` as the raw device/tool surface for the butler agent.

Use the existing `butler-app` runtime as the policy and orchestration layer for:

- scene suggestion
- high-level household intent handling
- confirmation rules
- plan logging
- short-term execution memory

This creates a clean split:

- `HA MCP Server`: dynamic device discovery and low-level entity control
- `butler-app`: project-specific household logic
- `butler agent`: planning and scene recommendation

### Why this is better than putting everything into a skill

The user goal is that newly added HA devices should become available without rewriting a static skill.

That is a good reason to use MCP for device access.

However, the agent should not be left alone with a raw pile of entities and service calls. If we do that, it will become a tool-calling assistant, not a butler.

So the better pattern is:

- use MCP to avoid hardcoding every device
- use runtime logic to define high-level behaviors and constraints
- keep household semantics above the raw device layer

In practice:

- MCP should carry the dynamic device graph
- the butler runtime should carry the scene semantics
- the agent should mostly reason over household context and candidate actions, not manually operate every entity

## Recommended First Integration Shape

### Phase A: direct HA MCP connection

Connect the butler agent to Home Assistant through `mcp_server`.

Initial scope:

- expose only virtual devices
- allow read + low-risk control
- keep confirmation for impactful actions

### Phase B: butler runtime mediation

The agent should not directly jump from natural language to individual device commands whenever possible.

Instead:

- read current household summary from `butler-app`
- generate scene recommendations such as `rest_recovery_mode` or `prepare_sleep_transition`
- ask for confirmation when needed
- let local runtime translate scene actions into specific HA device changes

### Phase C: optional Butler MCP

If needed later, `butler-app` can expose its own MCP server with project-specific high-level tools, for example:

- `suggest_scenes_from_user_intent`
- `apply_scene`
- `summarize_household_state`
- `list_recent_failures`
- `request_confirmation`

That would allow an agent client to use both:

- official HA MCP for raw home context
- project Butler MCP for high-level household operations

This should come after the first direct HA MCP bring-up, not before it.

## Concrete Recommendation

For the next implementation phase:

1. Enable and configure `Model Context Protocol Server` in Home Assistant.
2. Authenticate with a Long-Lived Access Token for first bring-up, or OAuth if the client supports it cleanly.
3. Connect the chosen butler client to `https://<ha-url>/api/mcp`.
4. Expose only the current virtual devices first.
5. Keep the existing `butler-app` planner/execution API as the stable household runtime.
6. Add a butler prompt/skill layer that tells the agent to propose scenes before raw device control.

## Practical Connection Notes

### Home Assistant side

For first bring-up, the Home Assistant setup should be:

1. Open `Settings > Devices & services`.
2. Add `Model Context Protocol Server`.
3. Turn on Home Assistant control only for the entities we want the butler to touch.
4. Expose only the current virtual devices during first integration.

### Authentication choice

For early testing, a `Long-Lived Access Token` is the simplest path.

OAuth is cleaner for supported clients, but token-based setup is usually faster for first bring-up and debugging.

### Client examples from official docs

Official Home Assistant docs show these patterns:

- Claude Code can connect directly to `https://<ha-url>/api/mcp` using remote HTTP and OAuth.
- Cursor can connect through `mcp-proxy` and a bearer token.
- gemini-cli can connect to `/api/mcp` with an Authorization header carrying a Long-Lived Access Token.

This means we do not need to invent a custom transport just to reach Home Assistant MCP.

### Recommended bring-up order for this project

1. Connect one external client to Home Assistant MCP Server.
2. Verify it can list and read only the virtual household entities.
3. Verify it can safely control one low-risk virtual device.
4. Add project-specific butler instructions for scene recommendation.
5. Only after that, decide whether we need a second custom Butler MCP server.

### What not to do first

- Do not start by exposing every entity in Home Assistant.
- Do not make the agent directly operate raw device tools as its main planning interface.
- Do not try to replace the existing `butler-app` runtime with MCP alone.

## Risks And Limits

- Home Assistant MCP does not currently provide Resources, so it is not a complete memory/context substrate by itself.
- Home Assistant MCP does not currently provide Notifications, so push-style agent workflows should not rely on MCP alone.
- If the agent is connected only to raw HA tools, it may overfit to low-level device control instead of household planning.
- Prompt and policy quality still matter, even with MCP.

## Bottom Line

The right first move is:

- use `Home Assistant MCP Server` for dynamic, future-proof device access
- keep `butler-app` as the household runtime and policy layer
- build the first butler interaction loop around `intent -> recommended scenes -> confirmation -> execution`

This is the lowest-risk path that still leaves room for later resident agents and director agents.
