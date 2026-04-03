import { describe, expect, it } from "vitest";

import { applyPlanActions } from "../src/core/execution.js";
import { createDemoWorld } from "../src/core/demo-world.js";

describe("applyPlanActions", () => {
  it("records a failed action and requests replanning instead of looping", () => {
    const world = createDemoWorld();
    world.failureMap["curtain.bedroom"] = "jammed";

    const result = applyPlanActions(world, [
      {
        kind: "comfort_adjustment",
        targetId: "curtain.bedroom",
        reason: "Dim the room for sleep prep",
        impact: "low",
        desiredState: "closed"
      }
    ]);

    expect(result.status).toBe("partial_failure");
    expect(result.executed).toHaveLength(0);
    expect(result.failed[0]?.failure).toBe("jammed");
    expect(result.requiresReplan).toBe(true);
    expect(world.timeline.at(-1)?.type).toBe("action_failed");
  });
});
