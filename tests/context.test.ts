import { describe, expect, it } from "vitest";

import { buildPlannerInput } from "../src/core/context.js";
import { createDemoWorld } from "../src/core/demo-world.js";

describe("buildPlannerInput", () => {
  it("selects only the required household context fields and trims recent events", () => {
    const world = createDemoWorld();
    world.events.push(
      {
        id: "e-extra-1",
        type: "calendar_shift",
        title: "Meeting moved",
        time: "2026-04-03T08:00:00.000Z",
        priority: "high",
        durationMinutes: 30,
        reversible: true,
        actorIds: ["resident.main"]
      },
      {
        id: "e-extra-2",
        type: "visitor_inserted",
        title: "Visitor arriving early",
        time: "2026-04-03T08:05:00.000Z",
        priority: "medium",
        durationMinutes: 20,
        reversible: true,
        actorIds: ["visitor.source"]
      }
    );

    const context = buildPlannerInput(world);

    expect(Object.keys(context).sort()).toEqual(
      [
        "conflictSignals",
        "currentTime",
        "keySchedule",
        "recentEvents",
        "residentStates",
        "roomStates",
        "taskState"
      ].sort()
    );
    expect(context.recentEvents).toHaveLength(3);
    expect(context.recentEvents.map((event) => event.id)).toEqual([
      "e-2",
      "e-extra-1",
      "e-extra-2"
    ]);
    expect(context.residentStates[0]?.focusMode).toBe("deep_work");
  });
});
