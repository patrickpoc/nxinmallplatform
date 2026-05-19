import { Hono } from "hono";
import { ok } from "../../lib/envelope.js";

const app = new Hono();

app.get("/health", (c) => c.json(ok({ status: "ok", service: "nxinmall-api" })));

export { app as healthRoutes };
