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
