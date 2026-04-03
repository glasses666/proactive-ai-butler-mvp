import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";

describe("device control API", () => {
  it("updates a virtual device and returns the refreshed scene/feed", async () => {
    const app = createApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/device/control",
      payload: {
        targetId: "light.entry",
        desiredState: "on"
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.result).toMatchObject({ status: "success" });
    expect(body.observerFeed.devices.find((device) => device.id === "light.entry")?.state).toBe("on");
    expect(body.scene.rooms.find((room) => room.id === "room.entry")?.devices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "light.entry",
          state: "on"
        })
      ])
    );

    await app.close();
  });

  it("updates non-light virtual control surfaces such as climate and mode", async () => {
    const app = createApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/device/control",
      payload: {
        targetId: "climate.bedroom",
        desiredState: "sleep_20c"
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.result).toMatchObject({ status: "success" });
    expect(body.observerFeed.devices.find((device) => device.id === "climate.bedroom")?.state).toBe("sleep_20c");

    const second = await app.inject({
      method: "POST",
      url: "/api/device/control",
      payload: {
        targetId: "mode.house",
        desiredState: "sleep_guard"
      }
    });

    expect(second.statusCode).toBe(200);
    expect(second.json().observerFeed.devices.find((device) => device.id === "mode.house")?.state).toBe("sleep_guard");

    await app.close();
  });
});
