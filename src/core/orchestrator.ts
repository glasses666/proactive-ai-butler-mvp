import { buildPlannerInput } from "./context.js";
import { generateDirectorEvents } from "./director.js";
import { createDemoWorld } from "./demo-world.js";
import { applyDirectDeviceCommand, applyPlanActions } from "./execution.js";
import { buildObserverFeed } from "./observer.js";
import { evaluatePlanAction } from "./policy.js";
import { executePlanner, getPlannerStatus } from "./planner.js";
import {
  buildRuntimeDevices,
  buildRuntimeSummary,
  createExecutionRecord,
  getSceneDefinition,
  suggestScenes
} from "./runtime.js";
import type { PlannerStatus } from "./planner.js";
import type {
  ObserverFeed,
  PlannerPlan,
  RuntimeExecutionRecord,
  RuntimeSummary,
  SceneApplyResult,
  SceneSuggestion,
  World
} from "./types.js";

export class Orchestrator {
  private readonly world: World;
  private currentPlan: PlannerPlan | null = null;
  private lastPlannerStatus: PlannerStatus | null = null;
  private readonly executionHistory: RuntimeExecutionRecord[] = [];

  constructor(world: World = createDemoWorld()) {
    this.world = world;
  }

  getWorld(): World {
    return this.world;
  }

  getObserverFeed(): ObserverFeed {
    return buildObserverFeed(this.world, this.currentPlan);
  }

  getPlannerStatus(): PlannerStatus {
    return getPlannerStatus(process.env, this.lastPlannerStatus);
  }

  getRuntimeSummary(): RuntimeSummary {
    return buildRuntimeSummary(this.world, this.getPlannerStatus(), this.currentPlan);
  }

  listRuntimeDevices() {
    return buildRuntimeDevices(this.world);
  }

  listExecutions() {
    return [...this.executionHistory].reverse();
  }

  applyExternalDeviceCommand(
    targetId: string,
    desiredState: string,
    meta: { source: "ha_mqtt"; requestedBy?: string; reason?: string }
  ): { status: "success" | "error"; reason?: string } {
    const result = applyDirectDeviceCommand(this.world, targetId, desiredState);
    this.executionHistory.push(
      createExecutionRecord(this.world, {
        kind: "device_command",
        status: result.status === "success" ? "success" : "error",
        targetId,
        desiredState,
        requestedBy: meta.requestedBy ?? meta.source,
        reason: meta.reason
      })
    );
    return result;
  }

  suggestRuntimeScenes(input: { utterance: string }): SceneSuggestion[] {
    return suggestScenes(this.world, input.utterance);
  }

  applyRuntimeScene(input: { sceneId: string }): SceneApplyResult {
    const scene = getSceneDefinition(this.world, input.sceneId);
    if (!scene) {
      return {
        sceneId: input.sceneId,
        status: "partial_failure",
        plannedActions: [],
        executedActions: [],
        blockedActions: [
          {
            targetId: input.sceneId,
            desiredState: "n/a",
            reason: "unknown_scene"
          }
        ],
        summary: this.getRuntimeSummary()
      };
    }

    const allowedActions = [];
    const blockedActions: SceneApplyResult["blockedActions"] = [];

    for (const action of scene.actions) {
      const decision = evaluatePlanAction(this.world, action);
      if (decision.status === "allowed") {
        allowedActions.push(action);
        continue;
      }

      if (decision.status === "needs_confirmation") {
        this.world.taskState.pendingConfirmations += 1;
      }

      blockedActions.push({
        targetId: action.targetId,
        desiredState: action.desiredState,
        reason: decision.reason
      });
      this.world.timeline.push({
        id: `timeline-scene-policy-${Math.random().toString(36).slice(2, 8)}`,
        type: "action_failed",
        time: this.world.currentTime,
        message: `${action.targetId}: ${decision.reason}`,
        targetId: action.targetId
      });
    }

    const execution = applyPlanActions(this.world, allowedActions);
    const status =
      blockedActions.length > 0 || execution.failed.length > 0 ? "partial_failure" : "success";

    this.executionHistory.push(
      createExecutionRecord(this.world, {
        kind: "scene_apply",
        status,
        sceneId: scene.sceneId,
        reason: scene.reason
      })
    );

    return {
      sceneId: scene.sceneId,
      status,
      plannedActions: scene.actions,
      executedActions: execution.executed,
      blockedActions,
      summary: this.getRuntimeSummary()
    };
  }

  async runCycle(scenario: "travel_preparation" | "work_coordination" | "replanning"): Promise<{
    plan: PlannerPlan;
    observerFeed: ObserverFeed;
    timeline: World["timeline"];
  }> {
    const newEvents = generateDirectorEvents(this.world, {
      seed: Date.now(),
      scenario
    });
    this.world.events.push(...newEvents);
    for (const event of newEvents) {
      this.world.timeline.push({
        id: `timeline-event-${event.id}`,
        type: "event_injected",
        time: event.time,
        message: event.title,
        actorIds: event.actorIds
      });
    }

    const plannerInput = buildPlannerInput(this.world);
    const plannerRun = await executePlanner(plannerInput);
    this.lastPlannerStatus = {
      ...plannerRun.meta,
      hasRun: true
    };
    const rawPlan = plannerRun.plan;

    const allowedActions = rawPlan.actions.filter((action) => {
      const decision = evaluatePlanAction(this.world, action);
      if (decision.status === "allowed") {
        return true;
      }

      if (decision.status === "needs_confirmation") {
        this.world.taskState.pendingConfirmations += 1;
      }

      this.world.timeline.push({
        id: `timeline-policy-${Math.random().toString(36).slice(2, 8)}`,
        type: "action_failed",
        time: this.world.currentTime,
        message: `${action.targetId}: ${decision.reason}`,
        targetId: action.targetId
      });
      return false;
    });

    const plan: PlannerPlan = {
      ...rawPlan,
      actions: allowedActions
    };
    this.currentPlan = plan;
    this.world.timeline.push({
      id: `timeline-plan-${Math.random().toString(36).slice(2, 8)}`,
      type: "plan_created",
      time: this.world.currentTime,
      message: plan.goal
    });

    applyPlanActions(this.world, plan.actions);

    return {
      plan,
      observerFeed: this.getObserverFeed(),
      timeline: this.world.timeline
    };
  }
}
