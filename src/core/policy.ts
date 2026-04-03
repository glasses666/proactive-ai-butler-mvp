import type { PlanAction, PolicyDecision, World } from "./types.js";

export function evaluatePlanAction(world: World, action: PlanAction): PolicyDecision {
  const target = world.devices.find((device) => device.id === action.targetId);

  if (!target) {
    return {
      status: "blocked",
      reason: "target not found in the virtual household"
    };
  }

  if (!target.isVirtual) {
    return {
      status: "blocked",
      reason: "MVP only permits control of virtual entities"
    };
  }

  if (action.impact === "high") {
    return {
      status: "needs_confirmation",
      reason: "high-impact action requires confirmation in the MVP"
    };
  }

  return {
    status: "allowed",
    reason: "virtual low/medium-impact action allowed"
  };
}
