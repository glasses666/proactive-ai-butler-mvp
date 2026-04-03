# Butler API Extraction Architecture

Date: 2026-04-03

## Goal

Define how to extract a stable control layer from the current project so that:

1. virtual smart-home devices can be controlled directly through HTTP APIs
2. the same household runtime can be exposed through MCP
3. OpenClaw can be connected later without rewriting the household logic

This note is based on:

- the current project runtime in this repository
- official Home Assistant MCP documentation
- direct source audit of Home Assistant `mcp_server`
- official OpenClaw documentation

Primary sources:

- https://www.home-assistant.io/integrations/mcp_server
- https://www.home-assistant.io/integrations/mcp
- https://github.com/home-assistant/core/blob/dev/homeassistant/components/mcp_server/http.py
- https://github.com/home-assistant/core/blob/dev/homeassistant/components/mcp_server/server.py
- https://github.com/home-assistant/core/blob/dev/homeassistant/helpers/llm.py
- https://docs.openclaw.ai/cli/mcp
- https://docs.openclaw.ai/tools
- https://docs.openclaw.ai/plugins/sdk-runtime

## Current State

The current project already has the seed of the right separation:

- `Home Assistant`
  - runtime substrate for entities and automation semantics
- `Mosquitto`
  - discovery and state bridge
- `butler-app`
  - in-memory world
  - planner loop
  - execution and policy
  - observer API
- `pseudo-3D UI`
  - human-facing interaction layer

The current HTTP seams are:

- `GET /api/world`
- `GET /api/feed`
- `GET /api/planner/status`
- `POST /api/cycle`
- `POST /api/device/control`

These are enough for the demo, but they are not yet a clean long-term agent API.

## Design Principle

Do not let agent runtimes depend directly on:

- the in-memory world shape
- Home Assistant internal entity naming
- low-level MQTT topics
- UI-specific feed shapes

Instead, introduce a stable `Household Runtime API` above Home Assistant and below future agent runtimes.

That runtime should become the source of truth for:

- household summary
- scene recommendation
- confirmation flow
- execution status
- high-level household actions

Home Assistant should stay responsible for device substrate, not butler semantics.

## Recommended Layering

### Layer 1: Home Assistant device substrate

Responsibilities:

- entity registry
- device state
- exposed entities
- low-level control surface
- future real-device integration

Interfaces:

- Home Assistant native APIs
- Home Assistant MCP Server
- MQTT discovery and command topics

This layer is dynamic and device-shaped.

### Layer 2: Butler Runtime

This should become the project's stable integration boundary.

Responsibilities:

- maintain household context
- translate raw device state into household semantics
- accept user intent
- generate candidate scenes
- apply confirmation and policy rules
- translate high-level scene actions into specific device commands
- record recent failures and execution history

This layer should be the one we own and evolve.

### Layer 3: Agent Runtime

Initially:

- one butler agent

Later:

- resident agents
- director agents
- OpenClaw multi-agent orchestration

This layer should talk to Butler Runtime, not directly to Home Assistant internals.

## The Main Recommendation

The right long-term target is:

- `HA MCP` for dynamic low-level device access
- `Butler HTTP API` for stable project integration
- `Butler MCP` for agent-native high-level household tools
- `OpenClaw` as the outer agent runtime later

In other words:

- do not try to make Home Assistant itself become the full butler runtime
- do not make OpenClaw talk directly to every HA entity first
- do not fork `mcp_server` as the primary architecture move

## Why API Extraction Should Happen Outside HA Core

The Home Assistant source audit shows that `mcp_server` is primarily a wrapper around Home Assistant `llm` APIs. That means transport is not the main bottleneck.

The real problem is semantic shape:

- Home Assistant gives device and Assist-oriented tools
- our project needs butler-oriented tools

If we try to overload Home Assistant with all butler semantics, we create tight coupling to HA internals and make experimentation slower.

So the recommended extraction target is:

- keep Home Assistant stable
- move project-specific semantics into `butler-app`
- expose those semantics via a stable HTTP API and later MCP

## Recommended API Split

### A. Keep these HTTP APIs as internal or developer endpoints

- `GET /api/world`
- `GET /api/feed`
- `POST /api/cycle`

These are useful for debugging but too implementation-specific for long-term agent integration.

### B. Introduce a stable `runtime` namespace

Recommended future API shape:

#### `GET /api/runtime/summary`

Return a compact household summary for agents and UIs.

Example fields:

- current time
- resident summary
- key schedule items
- room ambience summary
- current house mode
- active reminders
- recent disruptions
- pending confirmations
- top-level planner status

#### `GET /api/runtime/devices`

Return normalized device inventory.

Example fields:

- id
- label
- kind
- room
- allowed states
- current state
- risk level
- controllable

This avoids forcing clients to parse raw HA state or current UI scene models.

#### `POST /api/runtime/device-commands`

Low-level but normalized control endpoint.

Request:

- `targetId`
- `desiredState`
- optional `reason`
- optional `requestedBy`

This is the HTTP equivalent of current direct device control.

#### `POST /api/runtime/scene-suggestions`

This is the key butler-facing endpoint.

Input:

- user utterance or high-level intent
- optional channel metadata
- optional current focus mode

Output:

- 2-3 candidate scenes
- explanation for each
- expected device changes
- whether confirmation is required

Example scene ids:

- `rest_recovery_mode`
- `prepare_sleep_transition`
- `protect_focus_mode`
- `late_arrival_quiet_return`

#### `POST /api/runtime/scenes/apply`

Apply one high-level scene rather than raw device commands.

Input:

- `sceneId`
- optional overrides
- optional confirmation token

Output:

- planned actions
- executed actions
- blocked actions
- resulting summary

#### `GET /api/runtime/executions`

Return recent scene applications and failures.

This is useful both for humans and later agent memory.

### C. Add streaming/event APIs later

Not required for first bring-up, but useful after OpenClaw joins:

- `GET /api/runtime/events`
- `GET /api/runtime/confirmations`

Transport can be SSE later if needed.

## Recommended MCP Split

### Use official HA MCP for low-level device surface

Use Home Assistant `mcp_server` to expose:

- virtual entities
- low-risk device control
- future real devices

This keeps device discovery dynamic as new entities appear.

### Build a project-specific Butler MCP for high-level semantics

This should be separate from HA MCP.

Recommended future tools:

- `household_summary_get`
- `devices_list`
- `scene_suggestions_generate`
- `scene_apply`
- `confirmation_list_open`
- `confirmation_resolve`
- `execution_history_read`
- `memory_recent_read`

This tool set matches how an actual butler should reason: over household situations and candidate responses, not over every raw switch and lock call.

## How This Fits OpenClaw

Official OpenClaw docs show:

- it has a saved MCP server registry in config
- it can expose its own MCP bridge
- it has its own tool and plugin runtime

That means OpenClaw can later consume MCP servers we define, rather than forcing us to collapse everything into OpenClaw-native plugin code on day one.

So the future-compatible path is:

1. expose Home Assistant MCP
2. expose Butler MCP
3. let OpenClaw consume both

Then use policy to decide what each OpenClaw agent sees:

- Butler agent:
  - household summary
  - scene suggestion
  - scene apply
  - maybe limited HA MCP
- Resident agent:
  - preferences
  - confirmations
  - selected context only
- Director agent:
  - scenario injection
  - disruption authoring
  - world event tools

## Two Extraction Options

### Option 1: HTTP first, MCP second

Build a strong Butler HTTP API first, then wrap it in MCP later.

Pros:

- fastest to implement
- easiest to test
- easiest to introspect
- works before OpenClaw

Cons:

- agents need an extra wrapper before they can use it natively through MCP

### Option 2: HTTP and MCP side by side from the start

Define the stable domain model once, then expose it both over REST and MCP.

Pros:

- cleanest long-term contract
- closest to eventual OpenClaw integration

Cons:

- slightly more upfront design work

### Recommendation

Pick `Option 2`, but implement only a small slice first.

That means:

- define the stable runtime schema once
- expose a minimal HTTP API
- expose a minimal Butler MCP using the same domain objects

Do not expose every feature immediately.

## Minimal First Slice

The first extracted API slice should only cover:

1. `summary`
2. `devices`
3. `scene suggestions`
4. `scene apply`
5. `direct device command`

Everything else can wait.

## Suggested First Scene Flow

User says:

- `I am tired and just got home`

The flow should be:

1. agent asks Butler Runtime for scene suggestions
2. runtime returns 2-3 options based on time, mode, room state, reminders, and recent events
3. user selects one
4. runtime applies the scene
5. runtime logs what happened

That is a much better first butler loop than direct raw device control.

## What To Avoid

- Do not make OpenClaw depend on current `/api/feed`.
- Do not expose raw in-memory world objects as the long-term public contract.
- Do not make the agent choose individual device states as its main interaction style.
- Do not fork Home Assistant `mcp_server` first.
- Do not tie Butler semantics to MQTT topic names.

## Final Recommendation

The target architecture should be:

- `Home Assistant`: device substrate
- `HA MCP Server`: dynamic device-facing MCP layer
- `butler-app HTTP API`: stable household runtime
- `butler-app MCP`: high-level butler tools
- `OpenClaw`: later orchestration runtime

The next implementation milestone should therefore be:

1. extract a `runtime` API namespace from `butler-app`
2. stabilize the domain model around `summary`, `devices`, `scene suggestions`, and `scene apply`
3. only after that, add a minimal Butler MCP on top of the same functions

That gives us the cleanest path to OpenClaw later without over-coupling ourselves to either Home Assistant internals or a single agent runtime.
