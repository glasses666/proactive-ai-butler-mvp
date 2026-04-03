export type Priority = "low" | "medium" | "high";
export type Impact = "low" | "medium" | "high";

export interface ScheduleItem {
  id: string;
  title: string;
  start: string;
  kind: "travel" | "meeting" | "focus" | "rest" | "visitor";
}

export interface WorldSchedule {
  today: ScheduleItem[];
  tomorrow: ScheduleItem[];
}

export interface ResidentState {
  id: string;
  label: string;
  roomId: string;
  atHome: boolean;
  focusMode: "deep_work" | "rest" | "travel_prep" | "idle";
  quietNeeded: boolean;
}

export interface RoomState {
  id: string;
  label: string;
  occupantIds: string[];
  ambience: "quiet" | "active" | "sleep_prep";
}

export interface Device {
  id: string;
  label: string;
  kind: "light" | "curtain" | "climate" | "reminder" | "lock" | "mode";
  roomId: string;
  state: string;
  allowedStates?: string[];
  isVirtual: boolean;
}

export interface DirectorEvent {
  id: string;
  type:
    | "calendar_shift"
    | "visitor_inserted"
    | "rest_conflict"
    | "plan_failure"
    | "preference_shift";
  title: string;
  time: string;
  priority: Priority;
  durationMinutes: number;
  reversible: boolean;
  actorIds: string[];
}

export interface TimelineEntry {
  id: string;
  type: "event_injected" | "action_executed" | "action_failed" | "plan_created";
  time: string;
  message: string;
  actorIds?: string[];
  targetId?: string;
}

export interface PlanAction {
  kind:
    | "prepare_departure"
    | "comfort_adjustment"
    | "reduce_disruption"
    | "reminder"
    | "request_confirmation"
    | "drop_action";
  targetId: string;
  desiredState: string;
  reason: string;
  impact: Impact;
}

export interface PolicyDecision {
  status: "allowed" | "needs_confirmation" | "blocked";
  reason: string;
}

export interface ExecutionFailure {
  action: PlanAction;
  failure: string;
}

export interface ExecutionResult {
  status: "success" | "partial_failure";
  executed: PlanAction[];
  failed: ExecutionFailure[];
  requiresReplan: boolean;
}

export interface World {
  currentTime: string;
  schedule: WorldSchedule;
  residents: ResidentState[];
  rooms: RoomState[];
  devices: Device[];
  taskState: {
    travelPrepNeeded: boolean;
    sleepProtection: boolean;
    pendingConfirmations: number;
  };
  conflictSignals: string[];
  events: DirectorEvent[];
  timeline: TimelineEntry[];
  failureMap: Record<string, string>;
}

export interface PlannerInput {
  currentTime: string;
  keySchedule: WorldSchedule;
  residentStates: ResidentState[];
  roomStates: RoomState[];
  taskState: World["taskState"];
  conflictSignals: string[];
  recentEvents: DirectorEvent[];
}

export interface PlannerPlan {
  goal: string;
  reason: string;
  actions: PlanAction[];
  needsConfirmation: boolean;
  confidence: number;
  nextReviewTime: string;
}

export interface ObserverFeed {
  currentTime: string;
  rooms: RoomState[];
  residents: ResidentState[];
  devices: Device[];
  events: DirectorEvent[];
  timeline: TimelineEntry[];
  plan: PlannerPlan | null;
}

export type RuntimeRiskLevel = "low" | "medium" | "high";

export interface RuntimeDevice {
  id: string;
  label: string;
  kind: Device["kind"];
  room: {
    id: string;
    label: string;
  };
  state: string;
  allowedStates: string[];
  controllable: boolean;
  isVirtual: boolean;
  riskLevel: RuntimeRiskLevel;
}

export interface RuntimeSummary {
  currentTime: string;
  plannerStatus: PlannerStatusLike;
  residents: Array<{
    id: string;
    label: string;
    roomId: string;
    focusMode: ResidentState["focusMode"];
    quietNeeded: boolean;
  }>;
  rooms: Array<{
    id: string;
    label: string;
    ambience: RoomState["ambience"];
    occupied: boolean;
  }>;
  houseMode: {
    id: string;
    label: string;
    state: string;
  } | null;
  activeReminders: Array<{
    id: string;
    label: string;
    state: string;
  }>;
  keySchedule: WorldSchedule;
  recentDisruptions: DirectorEvent[];
  pendingConfirmations: number;
}

export interface SceneSuggestion {
  sceneId: string;
  title: string;
  reason: string;
  requiresConfirmation: boolean;
  expectedDeviceChanges: Array<{
    targetId: string;
    desiredState: string;
  }>;
}

export interface RuntimeExecutionRecord {
  id: string;
  time: string;
  kind: "device_command" | "scene_apply";
  status: "success" | "partial_failure" | "error";
  requestedBy?: string;
  reason?: string;
  targetId?: string;
  desiredState?: string;
  sceneId?: string;
}

export interface SceneApplyResult {
  sceneId: string;
  status: "success" | "partial_failure";
  plannedActions: PlanAction[];
  executedActions: PlanAction[];
  blockedActions: Array<{
    targetId: string;
    desiredState: string;
    reason: string;
  }>;
  summary: RuntimeSummary;
}

export interface PlannerStatusLike {
  configuredMode: string;
  source: string;
  ready: boolean;
  reason?: string;
  hasRun?: boolean;
  configuredBaseUrl?: string;
  configuredModel?: string;
}
