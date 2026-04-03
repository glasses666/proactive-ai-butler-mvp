import mqtt from "mqtt";

import type { Device, ObserverFeed, World } from "../core/types.js";

interface MqttClientLike {
  connected: boolean;
  publish(topic: string, payload: string, options?: { retain?: boolean }): void;
  subscribe(topic: string): void;
  end(force?: boolean): void;
  once(event: string, listener: (...args: unknown[]) => void): void;
  on(event: string, listener: (...args: unknown[]) => void): void;
}

interface MqttBridgeOptions {
  client?: MqttClientLike;
  onDeviceCommand?: (
    targetId: string,
    desiredState: string,
    meta: { source: "ha_mqtt" }
  ) => void | Promise<void>;
}

export class MqttBridge {
  private readonly client: MqttClientLike;
  private readonly rootTopic: string;
  private readonly onDeviceCommand?: MqttBridgeOptions["onDeviceCommand"];
  private discoveryPublished = false;
  private commandSubscriptionsReady = false;
  private readonly commandTopicToDeviceId = new Map<string, string>();

  constructor(url: string, rootTopic = "butler", options: MqttBridgeOptions = {}) {
    this.client = options.client ?? mqtt.connect(url);
    this.rootTopic = rootTopic;
    this.onDeviceCommand = options.onDeviceCommand;
    this.client.on("message", (topic, payload) => {
      void this.handleMessage(String(topic), String(payload));
    });
  }

  async sync(world: World, feed: ObserverFeed): Promise<void> {
    await this.waitForConnect();

    if (!this.discoveryPublished) {
      this.publishDiscovery(world);
      this.discoveryPublished = true;
    }

    if (!this.commandSubscriptionsReady) {
      this.subscribeCommandTopics(world);
      this.commandSubscriptionsReady = true;
    }

    this.client.publish(`${this.rootTopic}/world/current_time`, world.currentTime, { retain: true });
    this.client.publish(`${this.rootTopic}/world/current_goal`, feed.plan?.goal ?? "idle", { retain: true });
    this.client.publish(
      `${this.rootTopic}/world/pending_confirmations`,
      String(world.taskState.pendingConfirmations),
      { retain: true }
    );

    for (const device of world.devices) {
      this.client.publish(`${this.rootTopic}/device/${sanitize(device.id)}/state`, device.state, {
        retain: true
      });
    }

    for (const resident of world.residents) {
      this.client.publish(
        `${this.rootTopic}/resident/${sanitize(resident.id)}/state`,
        JSON.stringify({
          roomId: resident.roomId,
          focusMode: resident.focusMode,
          quietNeeded: resident.quietNeeded
        }),
        { retain: true }
      );
    }
  }

  close(): void {
    this.client.end(true);
  }

  private publishDiscovery(world: World): void {
    this.publishSensorDiscovery("current_goal", "Current Butler Goal");
    this.publishSensorDiscovery("current_time", "Current Household Time");
    this.publishSensorDiscovery("pending_confirmations", "Pending Confirmations", "number");

    for (const device of world.devices) {
      this.publishDeviceDiscovery(device);
    }
  }

  private publishSensorDiscovery(objectId: string, name: string, deviceClass?: string): void {
    this.client.publish(
      `homeassistant/sensor/${this.rootTopic}/${objectId}/config`,
      JSON.stringify({
        name,
        unique_id: `${this.rootTopic}_${objectId}`,
        state_topic: `${this.rootTopic}/world/${objectId}`,
        device_class: deviceClass,
        icon: "mdi:robot-happy-outline"
      }),
      { retain: true }
    );
  }

  private publishDeviceDiscovery(device: Device): void {
    const objectId = sanitize(device.id);
    const stateTopic = `${this.rootTopic}/device/${objectId}/state`;
    const commandTopic = `${this.rootTopic}/device/${objectId}/command`;

    if (device.kind === "light") {
      this.clearLegacySensorDiscovery(objectId);
      this.client.publish(
        `homeassistant/light/${this.rootTopic}/${objectId}/config`,
        JSON.stringify({
          name: device.label,
          unique_id: `${this.rootTopic}_${objectId}`,
          state_topic: stateTopic,
          command_topic: commandTopic,
          payload_on: "on",
          payload_off: "off",
          icon: iconForDevice(device.kind)
        }),
        { retain: true }
      );
      return;
    }

    if (device.kind === "curtain") {
      this.clearLegacySensorDiscovery(objectId);
      this.client.publish(
        `homeassistant/cover/${this.rootTopic}/${objectId}/config`,
        JSON.stringify({
          name: device.label,
          unique_id: `${this.rootTopic}_${objectId}`,
          state_topic: stateTopic,
          command_topic: commandTopic,
          payload_open: "open",
          payload_close: "closed",
          state_open: "open",
          state_closed: "closed",
          icon: iconForDevice(device.kind)
        }),
        { retain: true }
      );
      return;
    }

    if (device.kind === "lock") {
      this.clearLegacySensorDiscovery(objectId);
      this.client.publish(
        `homeassistant/lock/${this.rootTopic}/${objectId}/config`,
        JSON.stringify({
          name: device.label,
          unique_id: `${this.rootTopic}_${objectId}`,
          state_topic: stateTopic,
          command_topic: commandTopic,
          payload_lock: "locked",
          payload_unlock: "unlocked",
          state_locked: "locked",
          state_unlocked: "unlocked",
          icon: iconForDevice(device.kind)
        }),
        { retain: true }
      );
      return;
    }

    if (
      (device.kind === "climate" || device.kind === "mode" || device.kind === "reminder") &&
      device.allowedStates?.length
    ) {
      this.clearLegacySensorDiscovery(objectId);
      this.client.publish(
        `homeassistant/select/${this.rootTopic}/${objectId}/config`,
        JSON.stringify({
          name: device.label,
          unique_id: `${this.rootTopic}_${objectId}`,
          state_topic: stateTopic,
          command_topic: commandTopic,
          options: device.allowedStates,
          icon: iconForDevice(device.kind)
        }),
        { retain: true }
      );
      return;
    }

    this.client.publish(
      `homeassistant/sensor/${this.rootTopic}/${objectId}/config`,
      JSON.stringify({
        name: device.label,
        unique_id: `${this.rootTopic}_${objectId}`,
        state_topic: stateTopic,
        icon: iconForDevice(device.kind)
      }),
      { retain: true }
    );
  }

  private clearLegacySensorDiscovery(objectId: string): void {
    this.client.publish(`homeassistant/sensor/${this.rootTopic}/${objectId}/config`, "", {
      retain: true
    });
  }

  private subscribeCommandTopics(world: World): void {
    for (const device of world.devices) {
      if (!isControllableDevice(device)) {
        continue;
      }

      const topic = `${this.rootTopic}/device/${sanitize(device.id)}/command`;
      this.commandTopicToDeviceId.set(topic, device.id);
      this.client.subscribe(topic);
    }
  }

  private async handleMessage(topic: string, payload: string): Promise<void> {
    const targetId = this.commandTopicToDeviceId.get(topic);
    if (!targetId || !this.onDeviceCommand) {
      return;
    }

    await this.onDeviceCommand(targetId, payload.trim(), { source: "ha_mqtt" });
  }

  private waitForConnect(): Promise<void> {
    if (this.client.connected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("MQTT connect timeout")), 5000);
      this.client.once("connect", () => {
        clearTimeout(timeout);
        resolve();
      });
      this.client.once("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }
}

function isControllableDevice(device: Device): boolean {
  return (
    device.kind === "light" ||
    device.kind === "curtain" ||
    device.kind === "lock" ||
    device.kind === "climate" ||
    device.kind === "mode" ||
    device.kind === "reminder"
  );
}

function sanitize(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, "_");
}

function iconForDevice(kind: Device["kind"]): string {
  switch (kind) {
    case "light":
      return "mdi:lightbulb";
    case "curtain":
      return "mdi:curtains";
    case "climate":
      return "mdi:thermostat";
    case "lock":
      return "mdi:lock";
    case "mode":
      return "mdi:tune";
    case "reminder":
    default:
      return "mdi:bell-outline";
  }
}
