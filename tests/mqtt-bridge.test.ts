import { EventEmitter } from "node:events";

import { describe, expect, it, vi } from "vitest";

import { createDemoWorld } from "../src/core/demo-world.js";
import { buildObserverFeed } from "../src/core/observer.js";
import { MqttBridge } from "../src/integrations/mqtt-bridge.js";

class FakeMqttClient extends EventEmitter {
  connected = true;
  published: Array<{ topic: string; payload: string; options?: { retain?: boolean } }> = [];
  subscriptions: string[] = [];

  publish(topic: string, payload: string, options?: { retain?: boolean }): void {
    this.published.push({ topic, payload, options });
  }

  subscribe(topic: string): void {
    this.subscriptions.push(topic);
  }

  end(): void {}
}

describe("MqttBridge", () => {
  it("publishes controllable HA discovery for virtual light, cover, and lock devices", async () => {
    const client = new FakeMqttClient();
    const bridge = new MqttBridge("mqtt://unused", "butler", {
      client: client as never
    });
    const world = createDemoWorld();

    await bridge.sync(world, buildObserverFeed(world, null));

    const lightDiscovery = client.published.find(
      (entry) => entry.topic === "homeassistant/light/butler/light_entry/config"
    );
    const coverDiscovery = client.published.find(
      (entry) => entry.topic === "homeassistant/cover/butler/curtain_bedroom/config"
    );
    const lockDiscovery = client.published.find(
      (entry) => entry.topic === "homeassistant/lock/butler/door_lock_state/config"
    );

    expect(lightDiscovery).toBeDefined();
    expect(coverDiscovery).toBeDefined();
    expect(lockDiscovery).toBeDefined();

    expect(JSON.parse(lightDiscovery!.payload)).toMatchObject({
      command_topic: "butler/device/light_entry/command",
      state_topic: "butler/device/light_entry/state",
      payload_on: "on",
      payload_off: "off",
      suggested_area: "Entry",
      device: {
        identifiers: ["butler_light_entry"],
        name: "Entry Light"
      }
    });
    expect(JSON.parse(coverDiscovery!.payload)).toMatchObject({
      command_topic: "butler/device/curtain_bedroom/command",
      state_topic: "butler/device/curtain_bedroom/state",
      payload_open: "open",
      payload_close: "closed"
    });
    expect(JSON.parse(lockDiscovery!.payload)).toMatchObject({
      command_topic: "butler/device/door_lock_state/command",
      state_topic: "butler/device/door_lock_state/state",
      payload_lock: "locked",
      payload_unlock: "unlocked"
    });

    expect(client.published).toContainEqual({
      topic: "homeassistant/sensor/butler/light_entry/config",
      payload: "",
      options: { retain: true }
    });
  });

  it("subscribes to command topics and forwards HA commands to the device callback", async () => {
    const client = new FakeMqttClient();
    const onDeviceCommand = vi.fn();
    const bridge = new MqttBridge("mqtt://unused", "butler", {
      client: client as never,
      onDeviceCommand
    });
    const world = createDemoWorld();

    await bridge.sync(world, buildObserverFeed(world, null));

    expect(client.subscriptions).toContain("butler/device/light_entry/command");

    client.emit("message", "butler/device/light_entry/command", Buffer.from("on"));

    expect(onDeviceCommand).toHaveBeenCalledWith("light.entry", "on", {
      source: "ha_mqtt"
    });
  });

  it("publishes controllable discovery for select-style virtual devices", async () => {
    const client = new FakeMqttClient();
    const bridge = new MqttBridge("mqtt://unused", "butler", {
      client: client as never
    });
    const world = createDemoWorld();

    await bridge.sync(world, buildObserverFeed(world, null));

    const climateDiscovery = client.published.find(
      (entry) => entry.topic === "homeassistant/select/butler/climate_bedroom/config"
    );
    const modeDiscovery = client.published.find(
      (entry) => entry.topic === "homeassistant/select/butler/mode_house/config"
    );
    const reminderDiscovery = client.published.find(
      (entry) => entry.topic === "homeassistant/select/butler/reminder_airport/config"
    );

    expect(climateDiscovery).toBeDefined();
    expect(modeDiscovery).toBeDefined();
    expect(reminderDiscovery).toBeDefined();
    expect(JSON.parse(climateDiscovery.payload)).toMatchObject({
      command_topic: "butler/device/climate_bedroom/command",
      state_topic: "butler/device/climate_bedroom/state",
      suggested_area: "Bedroom",
      device: {
        identifiers: ["butler_climate_bedroom"],
        name: "Bedroom Climate"
      }
    });
  });
});
