import { describe, expect, it } from "vitest";

import { createDemoWorld } from "../src/core/demo-world.js";
import { buildObserverFeed } from "../src/core/observer.js";
import { buildSceneModel } from "../src/core/scene.js";

describe("buildSceneModel", () => {
  it("maps residents into room scene slots for the observer UI", () => {
    const world = createDemoWorld();
    const feed = buildObserverFeed(world, null);

    const scene = buildSceneModel(feed);

    const study = scene.rooms.find((room) => room.id === "room.study");
    expect(study?.occupants[0]?.id).toBe("resident.main");
    const entry = scene.rooms.find((room) => room.id === "room.entry");
    expect(entry?.devices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "light.entry", kind: "light" }),
        expect.objectContaining({ id: "door.lock_state", kind: "lock" })
      ])
    );
    const bedroom = scene.rooms.find((room) => room.id === "room.bedroom");
    expect(bedroom?.devices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "climate.bedroom", kind: "climate" }),
        expect.objectContaining({ id: "reminder.airport", kind: "reminder" })
      ])
    );
    expect(study?.devices).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "mode.house", kind: "mode" })])
    );
    expect(scene.timeline.length).toBe(feed.timeline.length);
  });
});
