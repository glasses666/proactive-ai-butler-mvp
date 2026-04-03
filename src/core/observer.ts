import type { ObserverFeed, PlannerPlan, World } from "./types.js";

export function buildObserverFeed(world: World, plan: PlannerPlan | null): ObserverFeed {
  return {
    currentTime: world.currentTime,
    rooms: world.rooms,
    residents: world.residents,
    devices: world.devices,
    events: world.events.slice(-10),
    timeline: world.timeline.slice(-20),
    plan
  };
}
