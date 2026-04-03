import type { DirectorEvent, World } from "./types.js";

export function generateDirectorEvents(
  world: World,
  input: { seed: number; scenario: "travel_preparation" | "work_coordination" | "replanning" }
): DirectorEvent[] {
  const events: DirectorEvent[] = [];

  if (input.scenario === "travel_preparation" && world.schedule.tomorrow.some((item) => item.kind === "travel")) {
    events.push({
      id: `event-${input.seed}-shift`,
      type: "calendar_shift",
      title: "Airport departure moved earlier",
      time: world.currentTime,
      priority: "high",
      durationMinutes: 15,
      reversible: true,
      actorIds: ["resident.main"]
    });
  }

  if (input.scenario === "work_coordination") {
    events.push({
      id: `event-${input.seed}-visitor`,
      type: "visitor_inserted",
      title: "Unexpected visitor slot",
      time: world.currentTime,
      priority: "medium",
      durationMinutes: 30,
      reversible: true,
      actorIds: ["visitor.source"]
    });
  }

  if (input.scenario === "replanning") {
    events.push({
      id: `event-${input.seed}-failure`,
      type: "plan_failure",
      title: "Preparation step failed",
      time: world.currentTime,
      priority: "high",
      durationMinutes: 10,
      reversible: false,
      actorIds: ["director"]
    });
  }

  return events;
}
