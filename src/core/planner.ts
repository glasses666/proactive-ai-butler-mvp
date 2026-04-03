import type { PlannerInput, PlannerPlan } from "./types.js";

export interface PlannerRunMeta {
  configuredMode: "mock" | "external";
  source: "mock" | "external";
  ready: boolean;
  baseUrl: string | null;
  model: string | null;
  fallbackReason: string | null;
  error: string | null;
}

export interface PlannerRunResult {
  plan: PlannerPlan;
  meta: PlannerRunMeta;
}

export interface PlannerStatus extends PlannerRunMeta {
  hasRun: boolean;
}

interface PlannerEnvironment {
  PLANNER_MODE?: string;
  OPENAI_BASE_URL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
}

interface ExecutePlannerOptions {
  env?: PlannerEnvironment;
  fetchImpl?: typeof fetch;
}

export function planWithMockPlanner(input: PlannerInput): PlannerPlan {
  const hasTravelTomorrow = input.keySchedule.tomorrow.some((item) => item.kind === "travel");
  const quietHours = input.conflictSignals.includes("quiet_hours_required");

  if (hasTravelTomorrow) {
    return {
      goal: "prepare_for_tomorrow_departure",
      reason:
        "Tomorrow has a travel departure, so the butler should protect sleep, reduce disruption, and stage a gentle morning transition.",
      actions: [
        {
          kind: "comfort_adjustment",
          targetId: "curtain.bedroom",
          desiredState: quietHours ? "closed" : "half_closed",
          impact: "low",
          reason: "Reduce visual disruption before sleep."
        },
        {
          kind: "reminder",
          targetId: "light.entry",
          desiredState: "soft_glow",
          impact: "low",
          reason: "Prepare a low-noise departure path for the early morning routine."
        }
      ],
      needsConfirmation: false,
      confidence: 0.82,
      nextReviewTime: "2026-04-02T20:45:00.000Z"
    };
  }

  return {
    goal: "reduce_disruption_and_monitor",
    reason: "No travel prep detected, so the system should minimize disruption and keep monitoring household signals.",
    actions: [
      {
        kind: "reduce_disruption",
        targetId: "light.entry",
        desiredState: "off",
        impact: "low",
        reason: "Avoid extra ambient disturbance."
      }
    ],
    needsConfirmation: false,
    confidence: 0.64,
    nextReviewTime: "2026-04-02T21:00:00.000Z"
  };
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function isPlannerPlan(value: unknown): value is PlannerPlan {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PlannerPlan>;
  return (
    typeof candidate.goal === "string" &&
    typeof candidate.reason === "string" &&
    Array.isArray(candidate.actions) &&
    typeof candidate.needsConfirmation === "boolean" &&
    typeof candidate.confidence === "number" &&
    typeof candidate.nextReviewTime === "string"
  );
}

async function requestExternalPlan(
  input: PlannerInput,
  env: PlannerEnvironment,
  fetchImpl: typeof fetch
): Promise<PlannerPlan> {
  const baseUrl = normalizeBaseUrl(env.OPENAI_BASE_URL ?? "");
  const response = await fetchImpl(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(env.OPENAI_API_KEY ? { authorization: `Bearer ${env.OPENAI_API_KEY}` } : {})
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      temperature: 0.2,
      response_format: {
        type: "json_object"
      },
      messages: [
        {
          role: "system",
          content:
            "You are a proactive household planner. Return JSON only with keys goal, reason, actions, needsConfirmation, confidence, nextReviewTime."
        },
        {
          role: "user",
          content: JSON.stringify(input)
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`planner HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | Array<{ type?: string; text?: string }>;
      };
    }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  const raw =
    typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content
            .map((item) => (typeof item?.text === "string" ? item.text : ""))
            .join("")
            .trim()
        : "";

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("external planner returned invalid JSON");
  }

  if (!isPlannerPlan(parsed)) {
    throw new Error("external planner returned an invalid plan shape");
  }

  return parsed;
}

export async function executePlanner(
  input: PlannerInput,
  options: ExecutePlannerOptions = {}
): Promise<PlannerRunResult> {
  const env = options.env ?? process.env;
  const fetchImpl = options.fetchImpl ?? fetch;
  const configuredMode = env.PLANNER_MODE === "external" ? "external" : "mock";
  const ready = Boolean(env.OPENAI_BASE_URL && env.OPENAI_MODEL);
  const baseUrl = env.OPENAI_BASE_URL ? normalizeBaseUrl(env.OPENAI_BASE_URL) : null;
  const model = env.OPENAI_MODEL ?? null;

  if (configuredMode !== "external") {
    return {
      plan: planWithMockPlanner(input),
      meta: {
        configuredMode,
        source: "mock",
        ready: true,
        baseUrl,
        model,
        fallbackReason: null,
        error: null
      }
    };
  }

  if (!ready) {
    return {
      plan: planWithMockPlanner(input),
      meta: {
        configuredMode,
        source: "mock",
        ready: false,
        baseUrl,
        model,
        fallbackReason: "external planner is not fully configured",
        error: null
      }
    };
  }

  try {
    const plan = await requestExternalPlan(input, env, fetchImpl);
    return {
      plan,
      meta: {
        configuredMode,
        source: "external",
        ready,
        baseUrl,
        model,
        fallbackReason: null,
        error: null
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "external planner failed";
    return {
      plan: planWithMockPlanner(input),
      meta: {
        configuredMode,
        source: "mock",
        ready,
        baseUrl,
        model,
        fallbackReason: message,
        error: message
      }
    };
  }
}

export function getPlannerStatus(
  env: PlannerEnvironment = process.env,
  lastRun: PlannerRunMeta | null = null
): PlannerStatus {
  if (lastRun) {
    return {
      ...lastRun,
      hasRun: true
    };
  }

  const configuredMode = env.PLANNER_MODE === "external" ? "external" : "mock";
  const ready = configuredMode === "mock" ? true : Boolean(env.OPENAI_BASE_URL && env.OPENAI_MODEL);
  const baseUrl = env.OPENAI_BASE_URL ? normalizeBaseUrl(env.OPENAI_BASE_URL) : null;
  const model = env.OPENAI_MODEL ?? null;

  return {
    configuredMode,
    source: configuredMode === "external" && ready ? "external" : "mock",
    ready,
    baseUrl,
    model,
    fallbackReason: configuredMode === "external" && !ready ? "external planner is not fully configured" : null,
    error: null,
    hasRun: false
  };
}

export async function planWithExternalModel(input: PlannerInput): Promise<PlannerPlan> {
  const result = await executePlanner(input);
  return result.plan;
}
