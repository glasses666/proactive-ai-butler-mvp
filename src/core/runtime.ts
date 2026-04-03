import type {
  Device,
  PlanAction,
  PlannerPlan,
  PlannerStatusLike,
  RuntimeDevice,
  RuntimeExecutionRecord,
  RuntimeRiskLevel,
  RuntimeSummary,
  SceneSuggestion,
  World
} from "./types.js";

interface SceneDefinition {
  sceneId: string;
  title: string;
  reason: string;
  requiresConfirmation: boolean;
  actions: PlanAction[];
}

export function buildRuntimeSummary(
  world: World,
  plannerStatus: PlannerStatusLike,
  _currentPlan: PlannerPlan | null
): RuntimeSummary {
  const houseMode = world.devices.find((device) => device.kind === "mode") ?? null;
  const activeReminders = world.devices
    .filter((device) => device.kind === "reminder" && device.state !== "sent")
    .map((device) => ({
      id: device.id,
      label: device.label,
      state: device.state
    }));

  return {
    currentTime: world.currentTime,
    plannerStatus,
    residents: world.residents.map((resident) => ({
      id: resident.id,
      label: resident.label,
      roomId: resident.roomId,
      focusMode: resident.focusMode,
      quietNeeded: resident.quietNeeded
    })),
    rooms: world.rooms.map((room) => ({
      id: room.id,
      label: room.label,
      ambience: room.ambience,
      occupied: room.occupantIds.length > 0
    })),
    houseMode: houseMode
      ? {
          id: houseMode.id,
          label: houseMode.label,
          state: houseMode.state
        }
      : null,
    activeReminders,
    keySchedule: world.schedule,
    recentDisruptions: world.events.slice(-3),
    pendingConfirmations: world.taskState.pendingConfirmations
  };
}

export function buildRuntimeDevices(world: World): RuntimeDevice[] {
  return world.devices.map((device) => ({
    id: device.id,
    label: device.label,
    kind: device.kind,
    room: roomInfo(world, device),
    state: device.state,
    allowedStates: device.allowedStates ?? [device.state],
    controllable: isControllableDevice(device),
    isVirtual: device.isVirtual,
    riskLevel: riskForDevice(device.kind)
  }));
}

export function suggestScenes(world: World, utterance: string): SceneSuggestion[] {
  const normalized = utterance.trim().toLowerCase();
  const suggestions: SceneDefinition[] = [];
  const hour = new Date(world.currentTime).getUTCHours();

  if (containsAny(normalized, ["累", "tired", "exhausted", "回家", "home"])) {
    suggestions.push(sceneDefinitions(world).rest_recovery_mode);
    suggestions.push(sceneDefinitions(world).prepare_sleep_transition);
    if (hour >= 14) {
      suggestions.push(sceneDefinitions(world).late_arrival_quiet_return);
    }
  }

  if (containsAny(normalized, ["专注", "focus", "meeting", "不要打扰", "deep work"])) {
    suggestions.push(sceneDefinitions(world).protect_focus_mode);
  }

  if (suggestions.length === 0) {
    suggestions.push(sceneDefinitions(world).rest_recovery_mode);
    suggestions.push(sceneDefinitions(world).protect_focus_mode);
  }

  return uniqueScenes(suggestions).slice(0, 3).map((scene) => ({
    sceneId: scene.sceneId,
    title: scene.title,
    reason: scene.reason,
    requiresConfirmation: scene.requiresConfirmation,
    expectedDeviceChanges: scene.actions.map((action) => ({
      targetId: action.targetId,
      desiredState: action.desiredState
    }))
  }));
}

export function getSceneDefinition(world: World, sceneId: string): SceneDefinition | null {
  return sceneDefinitions(world)[sceneId as keyof ReturnType<typeof sceneDefinitions>] ?? null;
}

export function createExecutionRecord(
  world: World,
  payload: Omit<RuntimeExecutionRecord, "id" | "time">
): RuntimeExecutionRecord {
  return {
    id: `execution-${Math.random().toString(36).slice(2, 8)}`,
    time: world.currentTime,
    ...payload
  };
}

function uniqueScenes(scenes: SceneDefinition[]): SceneDefinition[] {
  const byId = new Map<string, SceneDefinition>();
  for (const scene of scenes) {
    if (!byId.has(scene.sceneId)) {
      byId.set(scene.sceneId, scene);
    }
  }
  return [...byId.values()];
}

function containsAny(input: string, needles: string[]): boolean {
  return needles.some((needle) => input.includes(needle));
}

function sceneDefinitions(world: World) {
  const modeDevice = world.devices.find((device) => device.id === "mode.house");
  const reminderDevice = world.devices.find((device) => device.id === "reminder.airport");

  return {
    rest_recovery_mode: {
      sceneId: "rest_recovery_mode",
      title: "Rest Recovery Mode",
      reason: "Ease the return-home transition and reduce stimulation after a tiring day.",
      requiresConfirmation: false,
      actions: [
        planAction("mode.house", "sleep_guard", "Shift the house into recovery mode", "low"),
        planAction("climate.bedroom", "sleep_20c", "Cool the bedroom for recovery", "medium"),
        planAction("light.entry", "on", "Provide a soft arrival light cue", "low"),
        planAction(
          reminderDevice?.id ?? "reminder.airport",
          "paused",
          "Pause non-urgent reminders while the resident settles in",
          "low"
        )
      ]
    },
    prepare_sleep_transition: {
      sceneId: "prepare_sleep_transition",
      title: "Prepare Sleep Transition",
      reason: "Wind down the household for a smooth move toward bedtime.",
      requiresConfirmation: false,
      actions: [
        planAction("curtain.bedroom", "closed", "Close the bedroom curtain for privacy", "low"),
        planAction("light.bedroom", "off", "Dim the bedroom for sleep preparation", "low"),
        planAction("climate.bedroom", "sleep_20c", "Set a sleep-friendly temperature", "medium")
      ]
    },
    protect_focus_mode: {
      sceneId: "protect_focus_mode",
      title: "Protect Focus Mode",
      reason: "Reduce interruptions and stabilize the work environment.",
      requiresConfirmation: false,
      actions: [
        planAction(modeDevice?.id ?? "mode.house", "focus_guard", "Enable focus protections", "low"),
        planAction("light.study", "on", "Keep the study task light on", "low"),
        planAction("reminder.airport", "paused", "Pause non-essential reminders during focus time", "low")
      ]
    },
    late_arrival_quiet_return: {
      sceneId: "late_arrival_quiet_return",
      title: "Late Arrival Quiet Return",
      reason: "Support a quiet return without waking the rest of the household.",
      requiresConfirmation: false,
      actions: [
        planAction("mode.house", "sleep_guard", "Reduce household activity after a late arrival", "low"),
        planAction("light.entry", "on", "Guide the resident through the entry quietly", "low"),
        planAction("light.kitchen", "off", "Keep unnecessary lighting off", "low")
      ]
    }
  };
}

function planAction(
  targetId: string,
  desiredState: string,
  reason: string,
  impact: PlanAction["impact"]
): PlanAction {
  return {
    kind: "comfort_adjustment",
    targetId,
    desiredState,
    reason,
    impact
  };
}

function riskForDevice(kind: Device["kind"]): RuntimeRiskLevel {
  switch (kind) {
    case "lock":
      return "high";
    case "climate":
      return "medium";
    default:
      return "low";
  }
}

function isControllableDevice(device: Device): boolean {
  return device.isVirtual && Boolean(device.allowedStates?.length);
}

function roomInfo(world: World, device: Device): { id: string; label: string } {
  const room = world.rooms.find((candidate) => candidate.id === device.roomId);
  return {
    id: device.roomId,
    label: room?.label ?? device.roomId
  };
}
