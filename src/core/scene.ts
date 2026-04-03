import type { ObserverFeed } from "./types.js";

export interface SceneOccupant {
  id: string;
  label: string;
  focusMode: string;
}

export interface SceneRoom {
  id: string;
  label: string;
  ambience: string;
  occupants: SceneOccupant[];
  devices: SceneDevice[];
}

export interface SceneDevice {
  id: string;
  label: string;
  kind: string;
  state: string;
  allowedStates?: string[];
}

export interface SceneModel {
  currentTime: string;
  rooms: SceneRoom[];
  timeline: ObserverFeed["timeline"];
}

export function buildSceneModel(feed: ObserverFeed): SceneModel {
  return {
    currentTime: feed.currentTime,
    rooms: feed.rooms.map((room) => ({
      id: room.id,
      label: room.label,
      ambience: room.ambience,
      occupants: feed.residents
        .filter((resident) => resident.roomId === room.id)
        .map((resident) => ({
          id: resident.id,
          label: resident.label,
          focusMode: resident.focusMode
        })),
      devices: feed.devices
        .filter((device) => device.roomId === room.id)
        .map((device) => ({
          id: device.id,
          label: device.label,
          kind: device.kind,
          state: device.state,
          allowedStates: device.allowedStates
        }))
    })),
    timeline: feed.timeline
  };
}
