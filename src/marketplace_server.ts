import { createServer, type ServerResponse } from "node:http";
import { ZodError } from "zod";
import {
  createInfraiGenerator,
  handoffOrder,
  orderRequestSchema
} from "./order_handoff.js";
import { sellerCatalog } from "./seller_catalog.js";

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) {
  throw new Error("Set INFRAI_API_KEY before starting the marketplace service");
}

const generate = createInfraiGenerator(apiKey);
const port = Number(process.env.PORT ?? 3000);

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/orders/handoff") {
    sendJson(response, 404, { error: "Route not found" });
    return;
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const body = orderRequestSchema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    const receipt = await handoffOrder(body, sellerCatalog, generate);
    sendJson(response, 201, receipt);
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      sendJson(response, 400, { error: "Invalid order body" });
      return;
    }
    const message = error instanceof Error ? error.message : "Order handoff failed";
    sendJson(response, 502, { error: message });
  }
});

server.listen(port, () => {
  console.log(`Marketplace handoff listening on http://localhost:${port}`);
});
