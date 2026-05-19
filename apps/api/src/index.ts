import "dotenv/config";
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";

const port = Number(process.env.PORT) || 4000;
const app = createApp();

serve({
  fetch: app.fetch,
  port,
});

console.log(`NxinMall API listening on http://localhost:${port}`);
