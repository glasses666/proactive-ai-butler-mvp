import { describe, expect, it } from "vitest";

import { evaluatePlanAction } from "../src/core/policy.js";
import { createDemoWorld } from "../src/core/demo-world.js";

describe("evaluatePlanAction", () => {
  it("requires confirmation for high-impact actions", () => {
    const world = createDemoWorld();

    const decision = evaluatePlanAction(world, {
      kind: "prepare_departure",
      targetId: "door.lock_state",
      reason: "Lock the house before departure",
      impact: "high",
      desiredState: "locked"
    });

    expect(decision.status).toBe("needs_confirmation");
    expect(decision.reason).toContain("high-impact");
  });

  it("blocks any attempt to control non-virtual entities in the MVP", () => {
    const world = createDemoWorld({
      devices: [
        {
          id: "light.real_hall",
          label: "Hall Light",
          kind: "light",
          roomId: "room.entry",
          state: "off",
          isVirtual: false
        }
      ]
    });

    const decision = evaluatePlanAction(world, {
      kind: "comfort_adjustment",
      targetId: "light.real_hall",
      reason: "Turn on the hall light",
      impact: "low",
      desiredState: "on"
    });

    expect(decision.status).toBe("blocked");
    expect(decision.reason).toContain("virtual");
  });
});
