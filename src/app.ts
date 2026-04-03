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

  return app;
}
