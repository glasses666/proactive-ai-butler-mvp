import { describe, expect, it } from "vitest";

import { Orchestrator } from "../src/core/orchestrator.js";
import { createDemoWorld } from "../src/core/demo-world.js";

describe("Orchestrator device control", () => {
  it("applies external device commands into the world state and timeline", () => {
    const orchestrator = new Orchestrator(createDemoWorld());

    const result = orchestrator.applyExternalDeviceCommand("light.entry", "on", {
      source: "ha_mqtt"
    });

    expect(result).toMatchObject({
      status: "success"
    });
    expect(orchestrator.getWorld().devices.find((device) => device.id === "light.entry")?.state).toBe("on");
    expect(orchestrator.getWorld().timeline.at(-1)).toMatchObject({
      type: "action_executed",
      targetId: "light.entry",
      message: "light.entry -> on"
    });
  });
});
