import { describe, expect, it } from "vitest";

import { createDemoWorld } from "../src/core/demo-world.js";
import { buildPlannerInput } from "../src/core/context.js";
import { executePlanner, planWithMockPlanner } from "../src/core/planner.js";

describe("planWithMockPlanner", () => {
  it("returns a structured plan for travel preparation without using free-text commands", () => {
    const world = createDemoWorld();
    const input = buildPlannerInput(world);

    const plan = planWithMockPlanner(input);

    expect(plan.goal).toBe("prepare_for_tomorrow_departure");
    expect(plan.actions.length).toBeGreaterThan(0);
    expect(plan.needsConfirmation).toBe(false);
    expect(plan.confidence).toBeGreaterThan(0.5);
    expect(plan.nextReviewTime).toMatch(/2026-04-02T20:45:00.000Z/);
    expect(typeof plan.reason).toBe("string");
    expect(plan.reason.length).toBeGreaterThan(10);
  });

  it("falls back to the mock planner when the external planner returns invalid JSON", async () => {
    const world = createDemoWorld();
    const input = buildPlannerInput(world);

    const result = await executePlanner(input, {
      env: {
        PLANNER_MODE: "external",
        OPENAI_BASE_URL: "https://planner.example/v1",
        OPENAI_MODEL: "planner-model"
      },
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: "definitely-not-json"
                }
              }
            ]
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json"
            }
          }
        )
    });

    expect(result.meta.source).toBe("mock");
    expect(result.meta.fallbackReason).toMatch(/invalid/i);
    expect(result.plan.goal).toBe("prepare_for_tomorrow_departure");
  });
});
