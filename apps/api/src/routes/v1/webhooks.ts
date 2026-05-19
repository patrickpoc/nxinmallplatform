import { Hono } from "hono";
import { lakalaGateway } from "../../gateways/lakala.js";
import { pagseguroGateway } from "../../gateways/pagseguro.js";
import { stripeGateway } from "../../gateways/stripe.js";
import { ok } from "../../lib/envelope.js";

const app = new Hono();

app.post("/webhooks/lakala", async (c) => {
  const payload = await c.req.json().catch(() => ({}));
  await lakalaGateway.handleWebhook(payload);
  return c.json(ok({ received: true }));
});

app.post("/webhooks/stripe", async (c) => {
  const payload = await c.req.text();
  await stripeGateway.handleWebhook(payload);
  return c.json(ok({ received: true }));
});

app.post("/webhooks/pagseguro", async (c) => {
  const payload = await c.req.json().catch(() => ({}));
  await pagseguroGateway.handleWebhook(payload);
  return c.json(ok({ received: true }));
});

export { app as webhookRoutes };
