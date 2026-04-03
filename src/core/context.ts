import type { PlannerInput, World } from "./types.js";

export function buildPlannerInput(world: World): PlannerInput {
  return {
    currentTime: world.currentTime,
    keySchedule: world.schedule,
    residentStates: world.residents,
    roomStates: world.rooms,
    taskState: world.taskState,
    conflictSignals: world.conflictSignals,
    recentEvents: world.events.slice(-3)
  };
}
