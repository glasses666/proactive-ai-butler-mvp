# Proactive AI Butler MVP

Lightweight R6C-targeted MVP for a proactive household butler loop:

- Home Assistant as runtime substrate
- Mosquitto for optional virtual-state mirroring
- TypeScript orchestrator with scripted scenario director
- Pseudo-3D isometric observer UI
- External planner support via OpenAI-compatible API, with `mock` mode as the default
- Virtual controllable `light`, `cover`, `lock`, `climate`, `mode`, and `reminder` entities

## Quick start

```bash
cp .env.example .env
DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0 docker compose up --build
```

Open:

- Observer UI: `http://localhost:8787`
- Home Assistant: `http://localhost:8123`
- Butler MCP: `http://localhost:8790/mcp`

## Runtime shape

- `butler-app`
  - Serves the observer UI and JSON APIs
  - Runs the scripted planner loop
  - Mirrors current virtual state to MQTT when enabled
- `mosquitto`
  - Carries Home Assistant discovery and mirrored world state
- `homeassistant`
  - Discovers MQTT entities and acts as the smart-home substrate for future phases

## APIs

- `GET /api/runtime/summary`
  - Stable household summary for agents and external runtimes
- `GET /api/runtime/devices`
  - Normalized virtual-device inventory with room, kind, allowed states, and risk levels
- `GET /api/runtime/executions`
  - Recent execution history for scenes and direct device commands
- `POST /api/runtime/device-commands`
  - Normalized low-level device control path for virtual devices
- `POST /api/runtime/scene-suggestions`
  - Suggests 2-3 candidate scenes from a user-style utterance
- `POST /api/runtime/scenes/apply`
  - Applies a named high-level scene through the local policy and execution layer
- `GET /api/world`
  - Full in-memory virtual household state
- `GET /api/feed`
  - Observer feed plus scene model for the UI
- `GET /api/planner/status`
  - Shows whether the runtime is using `mock` or `external`, and whether the external planner is ready or falling back
- `POST /api/device/control`
  - Directly toggles a virtual device for UI or HA-driven control loops
- `POST /api/cycle`
  - Injects a scenario and runs one planner cycle

Example scene-suggestion request:

```json
{
  "utterance": "我今天很累，回家了"
}
```

Example device command request:

```json
{
  "targetId": "light.entry",
  "desiredState": "on",
  "reason": "manual_test",
  "requestedBy": "operator"
}
```

Request body:

```json
{
  "scenario": "travel_preparation"
}
```

Allowed scenarios:

- `travel_preparation`
- `work_coordination`
- `replanning`

## Planner modes

- `mock`
  - Default. Runs locally with deterministic rule-based planning.
- `external`
  - Uses `OPENAI_BASE_URL` and `OPENAI_MODEL` to call an OpenAI-compatible `chat/completions` planner.
  - `OPENAI_API_KEY` is optional for endpoints that do not require bearer auth.
  - If the external planner returns invalid JSON or is not configured, the runtime automatically falls back to `mock` and exposes that reason via `GET /api/planner/status`.

## Butler MCP

The repo now includes a standalone `butler-mcp` service that exposes the runtime layer as MCP tools.

It is intentionally separate from `butler-app`:

- `Home Assistant MCP Server`
  - Dynamic entity and tool surface from Home Assistant
- `Butler MCP`
  - Project-specific household semantics on top of the stable runtime API

Current Butler MCP tools:

- `household_summary_get`
- `devices_list`
- `device_command_send`
- `scene_suggestions_generate`
- `scene_apply`
- `executions_list_recent`

By default the service listens on `http://localhost:8790/mcp`.

## Home Assistant MCP Server

For the R6C stack, Home Assistant can also expose the official `mcp_server` endpoint at:

- `http://<ha-host>:8123/api/mcp`

This layer should stay limited to low-level Home Assistant entities. For first bring-up, expose only the virtual household entities you want the butler to touch.

Recommended first exposure set:

- `light.entry_light`
- `light.bedroom_light`
- `light.study_lamp`
- `light.kitchen_light`
- `cover.bedroom_curtain`
- `select.bedroom_climate`
- `select.house_mode`
- `select.airport_reminder`

Keep `lock.door_lock_state` out of the first Assist/MCP exposure set until you add a stronger confirmation policy.

## R6C deployment notes

- Keep the planner in `mock` mode for bring-up.
- Move to `external` mode after the stack is stable.
- The app uses port `8787` to avoid the R6C's existing `5000` conflict.
- This MVP controls only virtual state. It does not write to real HA devices.

## Bundle and install on R6C

Create a clean deployment tarball:

```bash
./scripts/package-r6c-bundle.sh
```

After uploading and extracting the bundle on the router:

```bash
cd ~/proactive-ai-butler-mvp
cp .env.example .env
./scripts/install-r6c.sh "$(pwd)"
./scripts/probe-stack.sh
```

The install script intentionally forces the classic Docker builder because some constrained environments have `buildx` state write issues.

If the router cannot pull images from external registries, preload them from a LAN URL first:

```bash
./scripts/load-images-from-url.sh http://<your-mac-ip>:8765/butler-images.tar
./scripts/install-r6c.sh "$(pwd)"
```

When the preloaded `proactive-ai-butler-mvp-butler-app:latest` image is present, the install script automatically skips the local image build.

The compose stack now starts four services:

- `butler-app`
- `butler-mcp`
- `butler-mosquitto`
- `butler-homeassistant`

## MVP scenarios

- `travel_preparation`
  - Plans ahead for the next-day departure, sleep hygiene, and morning setup.
- `work_coordination`
  - Reduces disruption during focus or rest windows.
- `replanning`
  - Rebuilds the plan after a schedule change, visitor insertion, or execution failure.
