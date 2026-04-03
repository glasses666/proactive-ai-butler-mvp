import path from "node:path";
import { fileURLToPath } from "node:url";

import fastifyStatic from "@fastify/static";
import dotenv from "dotenv";

import { Orchestrator } from "./core/orchestrator.js";
import { createApp } from "./app.js";
import { MqttBridge } from "./integrations/mqtt-bridge.js";

dotenv.config();

const orchestrator = new Orchestrator();
let mqttBridge: MqttBridge | null = null;
if (process.env.MQTT_URL) {
  mqttBridge = new MqttBridge(process.env.MQTT_URL, process.env.MQTT_ROOT_TOPIC, {
    onDeviceCommand: async (targetId, desiredState, meta) => {
      orchestrator.applyExternalDeviceCommand(targetId, desiredState, meta);
      if (mqttBridge) {
        await mqttBridge.sync(orchestrator.getWorld(), orchestrator.getObserverFeed());
      }
    }
  });
}
const app = createApp(orchestrator, {
  onFeedUpdate: async () => {
    if (!mqttBridge) return;
    await mqttBridge.sync(orchestrator.getWorld(), orchestrator.getObserverFeed());
  }
});
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");

await app.register(fastifyStatic, {
  root: publicDir,
  prefix: "/"
});

app.setNotFoundHandler((request, reply) => {
  if (request.raw.url?.startsWith("/api/")) {
    reply.code(404).send({ error: "not_found" });
    return;
  }

  reply.sendFile("index.html");
});

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "0.0.0.0";

if (mqttBridge) {
  await mqttBridge.sync(orchestrator.getWorld(), orchestrator.getObserverFeed());
}

app.listen({ port, host }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
