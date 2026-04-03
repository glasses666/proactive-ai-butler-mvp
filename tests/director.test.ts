import { describe, expect, it } from "vitest";

import { generateDirectorEvents } from "../src/core/director.js";
import { createDemoWorld } from "../src/core/demo-world.js";

describe("generateDirectorEvents", () => {
  it("injects a schedule-disruption event when a trip timeline shifts", () => {
    const world = createDemoWorld({
      currentTime: "2026-04-02T20:00:00.000Z",
      schedule: {
        today: [],
        tomorrow: [
          {
            id: "trip-1",
            title: "Airport departure",
            start: "2026-04-03T05:30:00.000Z",
            kind: "travel"
          }
        ]
      }
    });

    const events = generateDirectorEvents(world, {
      seed: 7,
      scenario: "travel_preparation"
    });

    expect(events.some((event) => event.type === "calendar_shift")).toBe(true);
    expect(events.some((event) => event.priority === "high")).toBe(true);
  });
});
