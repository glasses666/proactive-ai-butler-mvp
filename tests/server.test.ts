import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";

describe("createApp", () => {
  it("exposes the current world state", async () => {
    const app = createApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/world"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().rooms.length).toBeGreaterThan(0);

    await app.close();
  });

  it("runs a planning cycle and appends plan + timeline data", async () => {
    const app = createApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/cycle",
      payload: {
        scenario: "travel_preparation"
      }
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.plan.goal).toBe("prepare_for_tomorrow_departure");
    expect(body.timeline.length).toBeGreaterThan(0);
    expect(body.observerFeed.plan.goal).toBe("prepare_for_tomorrow_departure");

    await app.close();
  });

  it("exposes planner status so remote debugging can tell whether external mode is active", async () => {
    const originalMode = process.env.PLANNER_MODE;
    delete process.env.PLANNER_MODE;
    const app = createApp();

    const response = await app.inject({
      method: "GET",
      url: "/api/planner/status"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      configuredMode: "mock",
      source: "mock",
      ready: true
    });

    await app.close();

    if (originalMode === undefined) {
      delete process.env.PLANNER_MODE;
    } else {
      process.env.PLANNER_MODE = originalMode;
    }
  });
});
