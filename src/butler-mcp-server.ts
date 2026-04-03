import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import dotenv from "dotenv";
import type { Request, Response } from "express";

import { createButlerMcpServer } from "./butler-mcp/server.js";
import { createRuntimeHttpClient } from "./butler-mcp/runtime-client.js";

dotenv.config();

const port = Number(process.env.BUTLER_MCP_PORT ?? 8790);
const host = process.env.BUTLER_MCP_HOST ?? "0.0.0.0";
const runtimeBaseUrl = process.env.BUTLER_RUNTIME_BASE_URL ?? "http://127.0.0.1:8787";

const app = createMcpExpressApp({ host });

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    runtimeBaseUrl
  });
});

app.post("/mcp", async (req: Request, res: Response) => {
  const runtimeClient = createRuntimeHttpClient(runtimeBaseUrl);
  const server: McpServer = createButlerMcpServer(runtimeClient);

  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    res.on("close", () => {
      void transport.close();
      void server.close();
    });
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : "Internal server error"
        },
        id: null
      });
    }
  }
});

app.get("/mcp", (_req: Request, res: Response) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed."
    },
    id: null
  });
});

app.delete("/mcp", (_req: Request, res: Response) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed."
    },
    id: null
  });
});

app.listen(port, host, () => {
  // Keep startup output minimal and deterministic for edge deployment.
  console.log(`butler-mcp listening on ${host}:${port}`);
});
