import type { ExecutionResult, PlanAction, TimelineEntry, World } from "./types.js";

export function applyPlanActions(world: World, actions: PlanAction[]): ExecutionResult {
  const executed: PlanAction[] = [];
  const failed: ExecutionResult["failed"] = [];

  for (const action of actions) {
    const failure = world.failureMap[action.targetId];
    if (failure) {
      failed.push({ action, failure });
      world.timeline.push(createTimeline(world.currentTime, "action_failed", {
        message: `${action.targetId} failed with ${failure}`,
        targetId: action.targetId
      }));
      continue;
    }

    const target = world.devices.find((device) => device.id === action.targetId);
    if (!target) {
      failed.push({ action, failure: "missing_target" });
      world.timeline.push(createTimeline(world.currentTime, "action_failed", {
        message: `${action.targetId} missing`,
        targetId: action.targetId
      }));
      continue;
    }

    target.state = action.desiredState;
    executed.push(action);
    world.timeline.push(createTimeline(world.currentTime, "action_executed", {
      message: `${action.targetId} -> ${action.desiredState}`,
      targetId: action.targetId
    }));
  }

  return {
    status: failed.length > 0 ? "partial_failure" : "success",
    executed,
    failed,
    requiresReplan: failed.length > 0
  };
}

export function applyDirectDeviceCommand(
  world: World,
  targetId: string,
  desiredState: string
): { status: "success" | "error"; reason?: string } {
  const failure = world.failureMap[targetId];
  if (failure) {
    world.timeline.push(
      createTimeline(world.currentTime, "action_failed", {
        message: `${targetId} failed with ${failure}`,
        targetId
      })
    );
    return { status: "error", reason: failure };
  }

  const target = world.devices.find((device) => device.id === targetId);
  if (!target) {
    world.timeline.push(
      createTimeline(world.currentTime, "action_failed", {
        message: `${targetId} missing`,
        targetId
      })
    );
    return { status: "error", reason: "missing_target" };
  }

  target.state = desiredState;
  world.timeline.push(
    createTimeline(world.currentTime, "action_executed", {
      message: `${targetId} -> ${desiredState}`,
      targetId
    })
  );
  return { status: "success" };
}

function createTimeline(
  time: string,
  type: TimelineEntry["type"],
  payload: Pick<TimelineEntry, "message" | "targetId">
): TimelineEntry {
  return {
    id: `timeline-${type}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    time,
    message: payload.message,
    targetId: payload.targetId
  };
}
