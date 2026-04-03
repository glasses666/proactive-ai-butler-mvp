import type { ButlerRuntimeClient } from "./server.js";

export function createRuntimeHttpClient(baseUrl: string): ButlerRuntimeClient {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  return {
    async getSummary() {
      return requestJson(`${normalizedBaseUrl}/api/runtime/summary`);
    },
    async listDevices() {
      return requestJson(`${normalizedBaseUrl}/api/runtime/devices`);
    },
    async sendDeviceCommand(input) {
      return requestJson(`${normalizedBaseUrl}/api/runtime/device-commands`, {
        method: "POST",
        body: JSON.stringify(input)
      });
    },
    async suggestScenes(input) {
      return requestJson(`${normalizedBaseUrl}/api/runtime/scene-suggestions`, {
        method: "POST",
        body: JSON.stringify(input)
      });
    },
    async applyScene(input) {
      return requestJson(`${normalizedBaseUrl}/api/runtime/scenes/apply`, {
        method: "POST",
        body: JSON.stringify(input)
      });
    },
    async listExecutions() {
      return requestJson(`${normalizedBaseUrl}/api/runtime/executions`);
    }
  };
}

async function requestJson(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`Runtime request failed (${response.status}): ${url}`);
  }

  return response.json();
}
