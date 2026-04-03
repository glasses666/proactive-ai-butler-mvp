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

## MVP scenarios

- `travel_preparation`
  - Plans ahead for the next-day departure, sleep hygiene, and morning setup.
- `work_coordination`
  - Reduces disruption during focus or rest windows.
- `replanning`
  - Rebuilds the plan after a schedule change, visitor insertion, or execution failure.
