import { buildPlannerInput } from "./context.js";
import { generateDirectorEvents } from "./director.js";
import { createDemoWorld } from "./demo-world.js";
import { applyDirectDeviceCommand, applyPlanActions } from "./execution.js";
import { buildObserverFeed } from "./observer.js";
import { evaluatePlanAction } from "./policy.js";
import { executePlanner, getPlannerStatus } from "./planner.js";
import type { PlannerStatus } from "./planner.js";
import type { ObserverFeed, PlannerPlan, World } from "./types.js";

export class Orchestrator {
  private readonly world: World;
  private currentPlan: PlannerPlan | null = null;
  private lastPlannerStatus: PlannerStatus | null = null;

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

  applyExternalDeviceCommand(
    targetId: string,
    desiredState: string,
    _meta: { source: "ha_mqtt" }
  ): { status: "success" | "error"; reason?: string } {
    return applyDirectDeviceCommand(this.world, targetId, desiredState);
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
