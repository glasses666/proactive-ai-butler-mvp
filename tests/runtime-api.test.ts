import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";

describe("runtime API", () => {
  it("returns a normalized household summary and device inventory", async () => {
    const app = createApp();

    const summaryResponse = await app.inject({
      method: "GET",
      url: "/api/runtime/summary"
    });
    const devicesResponse = await app.inject({
      method: "GET",
      url: "/api/runtime/devices"
    });

    expect(summaryResponse.statusCode).toBe(200);
    expect(summaryResponse.json()).toMatchObject({
      currentTime: "2026-04-02T20:30:00.000Z",
      pendingConfirmations: 0,
      houseMode: {
        id: "mode.house",
        state: "focus_guard"
      },
      plannerStatus: {
        configuredMode: "mock"
      }
    });

    expect(devicesResponse.statusCode).toBe(200);
    expect(devicesResponse.json().devices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "climate.bedroom",
          kind: "climate",
          controllable: true,
          riskLevel: "medium",
          room: {
            id: "room.bedroom",
            label: "Bedroom"
          }
        }),
        expect.objectContaining({
          id: "door.lock_state",
          kind: "lock",
          riskLevel: "high"
        })
      ])
    );

    await app.close();
  });

  it("accepts normalized device commands and records the execution", async () => {
    const app = createApp();

    const commandResponse = await app.inject({
      method: "POST",
      url: "/api/runtime/device-commands",
      payload: {
        targetId: "climate.bedroom",
        desiredState: "sleep_20c",
        reason: "manual comfort tweak",
        requestedBy: "test"
      }
    });

    expect(commandResponse.statusCode).toBe(200);
    expect(commandResponse.json()).toMatchObject({
      result: {
        status: "success"
      },
      device: {
        id: "climate.bedroom",
        state: "sleep_20c"
      },
      execution: {
        kind: "device_command",
        status: "success",
        targetId: "climate.bedroom"
      }
    });

    const executionsResponse = await app.inject({
      method: "GET",
      url: "/api/runtime/executions"
    });

    expect(executionsResponse.statusCode).toBe(200);
    expect(executionsResponse.json().executions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "device_command",
          status: "success",
          targetId: "climate.bedroom",
          requestedBy: "test"
        })
      ])
    );

    await app.close();
  });

  it("suggests and applies high-level household scenes", async () => {
    const app = createApp();

    const suggestionsResponse = await app.inject({
      method: "POST",
      url: "/api/runtime/scene-suggestions",
      payload: {
        utterance: "我今天很累，回家了"
      }
    });

    expect(suggestionsResponse.statusCode).toBe(200);
    expect(suggestionsResponse.json().suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sceneId: "rest_recovery_mode",
          requiresConfirmation: false
        })
      ])
    );

    const applyResponse = await app.inject({
      method: "POST",
      url: "/api/runtime/scenes/apply",
      payload: {
        sceneId: "rest_recovery_mode"
      }
    });

    expect(applyResponse.statusCode).toBe(200);
    expect(applyResponse.json()).toMatchObject({
      sceneId: "rest_recovery_mode",
      status: "success",
      executedActions: expect.arrayContaining([
        expect.objectContaining({
          targetId: "mode.house",
          desiredState: "sleep_guard"
        }),
        expect.objectContaining({
          targetId: "climate.bedroom",
          desiredState: "sleep_20c"
        })
      ]),
      summary: {
        houseMode: {
          state: "sleep_guard"
        }
      }
    });

    await app.close();
  });
});
