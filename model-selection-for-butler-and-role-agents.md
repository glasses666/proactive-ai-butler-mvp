# Model Selection for Butler and Role Agents

_Updated: 2026-04-03_

## Short answer

Do not choose one model for the whole household stack.

This project wants at least four different jobs:

1. `butler/orchestrator`
   The main planning agent that reads schedule, home state, preferences, and disturbances, then decides what to do next.
2. `role/resident agents`
   Simulated household members, visitors, or recurring roles with narrower goals and less tool access.
3. `director/disturbance agent`
   Injects changes, conflicts, delays, and missing information into the world.
4. `utility agents`
   Cheap summarizers, extractors, classifiers, and low-risk validators.

The right move is a mixed stack:

- a strong flagship model for the butler
- a cheaper but still coherent model for role agents
- the smallest model only for low-risk utility work

## What matters for a butler agent

The butler is not a chatbot. It is closer to a planner with tool access and long-lived context.

The most important traits are:

- reliable structured output
- strong tool use / function calling
- long-context handling
- good replanning under changing information
- strong instruction following under partial observability
- stable behavior when asked to avoid unnecessary interruptions

This is different from role agents. Resident agents need:

- low latency
- lower cost
- natural multi-turn interaction
- stable persona and preferences
- narrower but consistent behavior

## Recommended default stack

### Option A: Best practical default

- `Main butler`: `OpenAI GPT-5.4`
- `Premium butler upgrade`: `OpenAI GPT-5.4 Pro`
- `Resident / role agents`: `Qwen3-8B/14B Instruct-2507`
- `Director`: `Qwen3-30B-A3B Thinking-2507` or `GPT-5.4`
- `Cheap utility agents`: `GPT-5.4-nano` or equivalent smallest tier

Why this is the strongest default:

- `GPT-5.4` looks like the best balance of reasoning, tool use, long context, and structured output support for the main butler.
- `Qwen3` is a strong fit for roleplay-style residents because it is cheap, broadly deployable, and explicitly positioned for instruction following, roleplay, and tool usage.
- `Qwen3-30B-A3B Thinking-2507` gives you a strong local-ish or cheaper external option for director work without spending premium-planner money on every simulated character.

### Option B: Anthropic-oriented stack

- `Main butler`: `Claude Opus 4.5`
- `Balanced butler`: `Claude Sonnet 4.5`
- `Role agents`: `Claude Sonnet 4.5` or a cheaper open model such as `Qwen3-8B/14B`
- `Utility agents`: `Claude Haiku` tier

This is attractive if you care more about long-running agent behavior and natural reasoning style than strict schema enforcement. The main downside is that the structured-output story is less explicit than the strongest OpenAI path.

### Option C: Open-weight-heavy stack

- `Fallback planner`: `gpt-oss-20b`
- `Open-weight director`: `gpt-oss-120b` or `Qwen3-30B-A3B Thinking-2507`
- `Role agents`: `Qwen3-8B/14B Instruct-2507`
- `High-capability but expensive self-host route`: `DeepSeek-V3.2`

This is better for experiments, privacy-sensitive modes, or later self-hosting. It is not the best first choice for the butler if you want the shortest path to a stable MVP.

## Recommended role split for this project

### Phase 1: Current next step

Keep a single flagship butler and no fully autonomous residents yet.

- `Butler runtime`: OpenClaw or Nanobot
- `Butler model`: `GPT-5.4`
- `World runtime`: current HA + orchestrator stack on the R6C
- `Resident behavior`: scripted or lightweight role simulators

This keeps the main challenge focused on anticipation, planning, and selective confirmation.

### Phase 2: Add role agents

Introduce residents and disturbance agents, but do not give them broad permissions.

- `Butler`: `GPT-5.4`
- `Residents`: `Qwen3-8B/14B`
- `Director`: `Qwen3-30B-A3B Thinking-2507` or `GPT-5.4-mini`
- `Utility extraction`: cheapest safe tier

This is the first version that starts to resemble a household operating environment instead of a single benchmark.

### Phase 3: OpenClaw-style multi-agent world

Move to a tiered model policy:

- flagship model for the butler
- mid-tier models for role agents
- tiny models for low-risk classification or formatting
- explicit tool and permission boundaries per agent

OpenClaw especially fits this because its model strategy is runtime-aware: primary model, ordered fallbacks, per-agent overrides, and sub-agent-specific overrides.

## OpenClaw and Nanobot implications

`OpenClaw` does not force a single model vendor, but it does push you toward a model policy architecture:

- strongest model for the highest-autonomy agent
- cheaper models for narrow agents
- explicit fallbacks
- hard permissions around tools

`Nanobot` appears more model-agnostic. That makes it flexible, but it also means you need to define the model split and safety policy yourself.

Practical reading:

- if you want a more opinionated agent gateway, `OpenClaw` is the cleaner fit
- if you want lighter experimentation and custom control, `Nanobot` is workable

## What not to do

Do not do any of these first:

- run one small local model for every role and expect butler-quality planning
- give role agents the same tool permissions as the butler
- spend premium-planner tokens on every resident utterance
- force the R6C to host the main reasoning model
- confuse “roleplay quality” with “planning quality”

## Concrete recommendation

If we optimize for fastest credible progress:

1. `Use GPT-5.4 as the first real butler model.`
2. `Keep the R6C as runtime, not main inference host.`
3. `Introduce Qwen3-8B/14B residents before adding full role autonomy.`
4. `When director logic needs more realism, add Qwen3-30B-A3B Thinking-2507 or GPT-5.4-mini.`
5. `If we later migrate the butler runtime to OpenClaw, preserve the same tiered model split rather than collapsing to one model.`

## Sources

Official or primary sources reviewed on `2026-04-03`:

- OpenAI models overview: https://developers.openai.com/api/docs/models
- OpenAI GPT-5.4: https://developers.openai.com/api/docs/models/gpt-5.4
- OpenAI GPT-5.4 Pro: https://developers.openai.com/api/docs/models/gpt-5.4-pro
- OpenAI gpt-oss overview: https://help.openai.com/pt-pt/articles/11870455-openai-open-weight-models-gpt-oss
- OpenAI gpt-oss-120b: https://developers.openai.com/api/docs/models/gpt-oss-120b
- OpenAI structured outputs: https://developers.openai.com/api/docs/guides/structured-outputs
- Anthropic models docs: https://docs.anthropic.com/en/docs/about-claude/models
- Anthropic tool use docs: https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview
- Anthropic Claude Opus 4.5: https://www.anthropic.com/news/claude-opus-4-5
- Anthropic Claude Sonnet: https://www.anthropic.com/claude/sonnet
- Google Gemini models: https://ai.google.dev/gemini-api/docs/models
- Google Gemini 3 overview: https://ai.google.dev/gemini-api/docs/gemini-3
- Google Gemini function calling: https://ai.google.dev/gemini-api/docs/function-calling
- Qwen3 official repo: https://github.com/QwenLM/Qwen3
- DeepSeek pricing and model docs: https://api-docs.deepseek.com/quick_start/pricing/
- DeepSeek function calling: https://api-docs.deepseek.com/guides/function_calling
- DeepSeek thinking mode: https://api-docs.deepseek.com/guides/thinking_mode
- DeepSeek-V3.2 model card: https://huggingface.co/deepseek-ai/DeepSeek-V3.2
- DeepSeek-R1 official repo: https://github.com/deepseek-ai/DeepSeek-R1
- OpenClaw model docs: https://docs.openclaw.ai/models
- OpenClaw agent docs: https://docs.openclaw.ai/concepts/agent
- OpenClaw security docs: https://docs.openclaw.ai/security
- Nanobot docs: https://docs.nanobot.ai/
