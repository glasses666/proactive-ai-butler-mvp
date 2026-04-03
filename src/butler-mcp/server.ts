import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";

import type {
  RuntimeExecutionRecord,
  RuntimeSummary,
  RuntimeDevice,
  SceneApplyResult,
  SceneSuggestion
} from "../core/types.js";

export interface ButlerRuntimeClient {
  getSummary(): Promise<RuntimeSummary>;
  listDevices(): Promise<{ devices: RuntimeDevice[] }>;
  sendDeviceCommand(input: {
    targetId: string;
    desiredState: string;
    reason?: string;
    requestedBy?: string;
  }): Promise<unknown>;
  suggestScenes(input: { utterance: string }): Promise<{ suggestions: SceneSuggestion[] }>;
  applyScene(input: { sceneId: string }): Promise<SceneApplyResult>;
  listExecutions(): Promise<{ executions: RuntimeExecutionRecord[] }>;
}

export function createButlerMcpServer(runtimeClient: ButlerRuntimeClient): McpServer {
  const server = new McpServer({
    name: "butler-mcp",
    version: "0.1.0"
  });

  server.registerTool(
    "household_summary_get",
    {
      description: "Return a compact household runtime summary for butler planning."
    },
    async () => toMcpResult(await runtimeClient.getSummary())
  );

  server.registerTool(
    "devices_list",
    {
      description: "List normalized virtual household devices and their allowed states."
    },
    async () => toMcpResult(await runtimeClient.listDevices())
  );

  server.registerTool(
    "device_command_send",
    {
      description: "Send a normalized low-level device command through the butler runtime.",
      inputSchema: {
        targetId: z.string(),
        desiredState: z.string(),
        reason: z.string().optional(),
        requestedBy: z.string().optional()
      }
    },
    async (input) => toMcpResult(await runtimeClient.sendDeviceCommand(input))
  );

  server.registerTool(
    "scene_suggestions_generate",
    {
      description: "Generate high-level household scene suggestions from a user utterance.",
      inputSchema: {
        utterance: z.string()
      }
    },
    async ({ utterance }) => toMcpResult(await runtimeClient.suggestScenes({ utterance }))
  );

  server.registerTool(
    "scene_apply",
    {
      description: "Apply a high-level household scene through the butler runtime.",
      inputSchema: {
        sceneId: z.string()
      }
    },
    async ({ sceneId }) => toMcpResult(await runtimeClient.applyScene({ sceneId }))
  );

  server.registerTool(
    "executions_list_recent",
    {
      description: "Read recent device-command and scene-apply execution history."
    },
    async () => toMcpResult(await runtimeClient.listExecutions())
  );

  return server;
}

function toMcpResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2)
      }
    ],
    structuredContent: data as Record<string, unknown>
  };
}
