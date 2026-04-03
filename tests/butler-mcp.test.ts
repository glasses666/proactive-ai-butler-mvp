import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it, vi } from "vitest";

import { createButlerMcpServer, type ButlerRuntimeClient } from "../src/butler-mcp/server.js";

function createRuntimeClient(): ButlerRuntimeClient {
  return {
    getSummary: vi.fn(async () => ({
      currentTime: "2026-04-02T20:30:00.000Z",
      pendingConfirmations: 0,
      plannerStatus: {
        configuredMode: "mock",
        source: "mock",
        ready: true
      },
      residents: [],
      rooms: [],
      houseMode: {
        id: "mode.house",
        label: "House Mode",
        state: "focus_guard"
      },
      activeReminders: [],
      keySchedule: {
        today: [],
        tomorrow: []
      },
      recentDisruptions: []
    })),
    listDevices: vi.fn(async () => ({
      devices: [
        {
          id: "climate.bedroom",
          label: "Bedroom Climate",
          kind: "climate",
          room: {
            id: "room.bedroom",
            label: "Bedroom"
          },
          state: "off",
          allowedStates: ["off", "cool_22c", "sleep_20c"],
          controllable: true,
          isVirtual: true,
          riskLevel: "medium"
        }
      ]
    })),
    sendDeviceCommand: vi.fn(async () => ({
      result: { status: "success" },
      device: {
        id: "climate.bedroom",
        state: "sleep_20c"
      },
      execution: {
        kind: "device_command",
        status: "success",
        targetId: "climate.bedroom"
      }
    })),
    suggestScenes: vi.fn(async () => ({
      suggestions: [
        {
          sceneId: "rest_recovery_mode",
          title: "Rest Recovery Mode",
          reason: "Ease the resident into a quieter recovery state.",
          requiresConfirmation: false,
          expectedDeviceChanges: [
            {
              targetId: "mode.house",
              desiredState: "sleep_guard"
            }
          ]
        }
      ]
    })),
    applyScene: vi.fn(async () => ({
      sceneId: "rest_recovery_mode",
      status: "success",
      plannedActions: [],
      executedActions: [
        {
          targetId: "mode.house",
          desiredState: "sleep_guard"
        }
      ],
      blockedActions: [],
      summary: {
        currentTime: "2026-04-02T20:30:00.000Z",
        pendingConfirmations: 0,
        plannerStatus: {
          configuredMode: "mock",
          source: "mock",
          ready: true
        },
        residents: [],
        rooms: [],
        houseMode: {
          id: "mode.house",
          label: "House Mode",
          state: "sleep_guard"
        },
        activeReminders: [],
        keySchedule: {
          today: [],
          tomorrow: []
        },
        recentDisruptions: []
      }
    })),
    listExecutions: vi.fn(async () => ({
      executions: [
        {
          id: "execution-1",
          time: "2026-04-02T20:30:00.000Z",
          kind: "scene_apply",
          status: "success",
          sceneId: "rest_recovery_mode"
        }
      ]
    }))
  };
}

describe("Butler MCP server", () => {
  it("lists high-level household tools", async () => {
    const runtimeClient = createRuntimeClient();
    const server = createButlerMcpServer(runtimeClient);
    const client = new Client({
      name: "butler-mcp-test-client",
      version: "1.0.0"
    });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const result = await client.listTools();

    expect(result.tools.map((tool) => tool.name)).toEqual(
      expect.arrayContaining([
        "household_summary_get",
        "devices_list",
        "device_command_send",
        "scene_suggestions_generate",
        "scene_apply",
        "executions_list_recent"
      ])
    );

    await client.close();
    await server.close();
  });

  it("delegates tool calls to the runtime client and returns structured content", async () => {
    const runtimeClient = createRuntimeClient();
    const server = createButlerMcpServer(runtimeClient);
    const client = new Client({
      name: "butler-mcp-test-client",
      version: "1.0.0"
    });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const suggestions = await client.callTool({
      name: "scene_suggestions_generate",
      arguments: {
        utterance: "我今天很累，回家了"
      }
    });

    expect(runtimeClient.suggestScenes).toHaveBeenCalledWith({
      utterance: "我今天很累，回家了"
    });
    expect(suggestions.structuredContent).toMatchObject({
      suggestions: [
        {
          sceneId: "rest_recovery_mode"
        }
      ]
    });

    const applyResult = await client.callTool({
      name: "scene_apply",
      arguments: {
        sceneId: "rest_recovery_mode"
      }
    });

    expect(runtimeClient.applyScene).toHaveBeenCalledWith({
      sceneId: "rest_recovery_mode"
    });
    expect(applyResult.structuredContent).toMatchObject({
      sceneId: "rest_recovery_mode",
      summary: {
        houseMode: {
          state: "sleep_guard"
        }
      }
    });

    await client.close();
    await server.close();
  });
});
