import type { Device, World, WorldSchedule } from "./types.js";

interface DemoOverrides {
  currentTime?: string;
  schedule?: WorldSchedule;
  devices?: Device[];
}

export function createDemoWorld(overrides: DemoOverrides = {}): World {
  const currentTime = overrides.currentTime ?? "2026-04-02T20:30:00.000Z";

  return {
    currentTime,
    schedule: overrides.schedule ?? {
      today: [
        {
          id: "focus-1",
          title: "Deep work block",
          start: "2026-04-02T13:00:00.000Z",
          kind: "focus"
        }
      ],
      tomorrow: [
        {
          id: "trip-1",
          title: "Airport departure",
          start: "2026-04-03T05:45:00.000Z",
          kind: "travel"
        }
      ]
    },
    residents: [
      {
        id: "resident.main",
        label: "Main Resident",
        roomId: "room.study",
        atHome: true,
        focusMode: "deep_work",
        quietNeeded: true
      }
    ],
    rooms: [
      { id: "room.bedroom", label: "Bedroom", occupantIds: [], ambience: "sleep_prep" },
      { id: "room.living", label: "Living Room", occupantIds: [], ambience: "quiet" },
      { id: "room.kitchen", label: "Kitchen", occupantIds: [], ambience: "quiet" },
      { id: "room.entry", label: "Entry", occupantIds: [], ambience: "quiet" },
      {
        id: "room.study",
        label: "Work Zone",
        occupantIds: ["resident.main"],
        ambience: "quiet"
      }
    ],
    devices: overrides.devices ?? [
      {
        id: "curtain.bedroom",
        label: "Bedroom Curtain",
        kind: "curtain",
        roomId: "room.bedroom",
        state: "open",
        allowedStates: ["open", "closed"],
        isVirtual: true
      },
      {
        id: "light.entry",
        label: "Entry Light",
        kind: "light",
        roomId: "room.entry",
        state: "off",
        allowedStates: ["off", "on"],
        isVirtual: true
      },
      {
        id: "light.bedroom",
        label: "Bedroom Light",
        kind: "light",
        roomId: "room.bedroom",
        state: "off",
        allowedStates: ["off", "on"],
        isVirtual: true
      },
      {
        id: "climate.bedroom",
        label: "Bedroom Climate",
        kind: "climate",
        roomId: "room.bedroom",
        state: "off",
        allowedStates: ["off", "cool_22c", "sleep_20c"],
        isVirtual: true
      },
      {
        id: "reminder.airport",
        label: "Airport Reminder",
        kind: "reminder",
        roomId: "room.bedroom",
        state: "armed",
        allowedStates: ["armed", "paused", "sent"],
        isVirtual: true
      },
      {
        id: "light.study",
        label: "Study Lamp",
        kind: "light",
        roomId: "room.study",
        state: "on",
        allowedStates: ["off", "on"],
        isVirtual: true
      },
      {
        id: "mode.house",
        label: "House Mode",
        kind: "mode",
        roomId: "room.study",
        state: "focus_guard",
        allowedStates: ["focus_guard", "sleep_guard", "travel_guard"],
        isVirtual: true
      },
      {
        id: "light.kitchen",
        label: "Kitchen Light",
        kind: "light",
        roomId: "room.kitchen",
        state: "off",
        allowedStates: ["off", "on"],
        isVirtual: true
      },
      {
        id: "door.lock_state",
        label: "Door Lock State",
        kind: "lock",
        roomId: "room.entry",
        state: "unlocked",
        allowedStates: ["unlocked", "locked"],
        isVirtual: true
      }
    ],
    taskState: {
      travelPrepNeeded: true,
      sleepProtection: true,
      pendingConfirmations: 0
    },
    conflictSignals: ["quiet_hours_required"],
    events: [
      {
        id: "e-1",
        type: "rest_conflict",
        title: "Quiet hours begin",
        time: "2026-04-02T19:00:00.000Z",
        priority: "medium",
        durationMinutes: 180,
        reversible: false,
        actorIds: ["resident.main"]
      },
      {
        id: "e-2",
        type: "preference_shift",
        title: "Resident prefers softer wake-up routine",
        time: "2026-04-02T19:30:00.000Z",
        priority: "low",
        durationMinutes: 60,
        reversible: true,
        actorIds: ["resident.main"]
      }
    ],
    timeline: [],
    failureMap: {}
  };
}
