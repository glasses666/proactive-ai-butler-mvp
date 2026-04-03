import Fastify from "fastify";

import { Orchestrator } from "./core/orchestrator.js";
import { buildSceneModel } from "./core/scene.js";

interface AppHooks {
  onFeedUpdate?: () => Promise<void> | void;
}

export function createApp(orchestrator: Orchestrator = new Orchestrator(), hooks: AppHooks = {}) {
  const app = Fastify({
    logger: false
  });

  app.get("/api/health", async () => ({ status: "ok" }));

  app.get("/api/world", async () => orchestrator.getWorld());

  app.get("/api/planner/status", async () => orchestrator.getPlannerStatus());

  app.get("/api/runtime/summary", async () => orchestrator.getRuntimeSummary());

  app.get("/api/runtime/devices", async () => ({
    devices: orchestrator.listRuntimeDevices()
  }));

  app.get("/api/runtime/executions", async () => ({
    executions: orchestrator.listExecutions()
  }));

  app.get("/api/feed", async () => {
    const observerFeed = orchestrator.getObserverFeed();
    return {
      observerFeed,
      scene: buildSceneModel(observerFeed)
    };
  });

  app.post<{
    Body: {
      scenario?: "travel_preparation" | "work_coordination" | "replanning";
    };
  }>("/api/cycle", async (request) => {
    const scenario = request.body?.scenario ?? "travel_preparation";
    const result = await orchestrator.runCycle(scenario);
    await hooks.onFeedUpdate?.();
    return {
      ...result,
      scene: buildSceneModel(result.observerFeed)
    };
  });

  app.post<{
    Body: {
      targetId: string;
      desiredState: string;
    };
  }>("/api/device/control", async (request, reply) => {
    const targetId = request.body?.targetId;
    const desiredState = request.body?.desiredState;

    if (!targetId || !desiredState) {
      reply.code(400);
      return {
        error: "invalid_request"
      };
    }

    const result = orchestrator.applyExternalDeviceCommand(targetId, desiredState, {
      source: "ha_mqtt"
    });
    await hooks.onFeedUpdate?.();
    const observerFeed = orchestrator.getObserverFeed();

    return {
      result,
      observerFeed,
      scene: buildSceneModel(observerFeed)
    };
  });

  app.post<{
    Body: {
      targetId: string;
      desiredState: string;
      reason?: string;
      requestedBy?: string;
    };
  }>("/api/runtime/device-commands", async (request, reply) => {
    const targetId = request.body?.targetId;
    const desiredState = request.body?.desiredState;

    if (!targetId || !desiredState) {
      reply.code(400);
      return {
        error: "invalid_request"
      };
    }

    const result = orchestrator.applyExternalDeviceCommand(targetId, desiredState, {
      source: "ha_mqtt",
      requestedBy: request.body?.requestedBy,
      reason: request.body?.reason
    });
    await hooks.onFeedUpdate?.();

    return {
      result,
      device: orchestrator.listRuntimeDevices().find((device) => device.id === targetId) ?? null,
      execution: orchestrator.listExecutions()[0] ?? null,
      summary: orchestrator.getRuntimeSummary()
    };
  });

  app.post<{
    Body: {
      utterance?: string;
      channel?: string;
      focusMode?: string;
    };
  }>("/api/runtime/scene-suggestions", async (request, reply) => {
    const utterance = request.body?.utterance?.trim();

    if (!utterance) {
      reply.code(400);
      return {
        error: "invalid_request"
      };
    }

    return {
      suggestions: orchestrator.suggestRuntimeScenes({
        utterance
      })
    };
  });

  app.post<{
    Body: {
      sceneId?: string;
      overrides?: Record<string, string>;
      confirmationToken?: string;
    };
  }>("/api/runtime/scenes/apply", async (request, reply) => {
    const sceneId = request.body?.sceneId?.trim();

    if (!sceneId) {
      reply.code(400);
      return {
        error: "invalid_request"
      };
    }

    const result = orchestrator.applyRuntimeScene({
      sceneId
    });
    await hooks.onFeedUpdate?.();
    return result;
  });

  return app;
}
