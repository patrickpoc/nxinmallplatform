import { Hono } from "hono";
import { z } from "zod";
import { lakalaGateway } from "../../gateways/lakala.js";
import { pagseguroGateway } from "../../gateways/pagseguro.js";
import { stripeGateway } from "../../gateways/stripe.js";
import { wireGateway } from "../../gateways/wire.js";
import { getUserFromBearer } from "../../lib/auth.js";
import { fail, ok } from "../../lib/envelope.js";

const app = new Hono();

const initiateSchema = z.object({
  orderId: z.string(),
  gateway: z.enum(["STRIPE", "PAGSEGURO", "WIRE", "LAKALA"]),
  country: z.string().length(2),
});

/**
 * Initiates a payment for an order using the gateway abstraction (Brazil routes to BRL-capable gateways).
 */
app.post("/payments/initiate", async (c) => {
  const user = await getUserFromBearer(c.req.header("authorization"));
  if (!user) {
    return c.json(fail("UNAUTHORIZED", "Missing session"), 401);
  }
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json(fail("BAD_REQUEST", "Invalid JSON body"), 400);
  }
  const parsed = initiateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(fail("VALIDATION_ERROR", parsed.error.flatten().formErrors.join("; ")), 400);
  }
  const { gateway, country } = parsed.data;
  if (country === "BR" && gateway === "LAKALA") {
    return c.json(fail("GATEWAY_NOT_ALLOWED", "Brazilian buyers cannot use Lakala"), 400);
  }
  const impl =
    gateway === "STRIPE"
      ? stripeGateway
      : gateway === "PAGSEGURO"
        ? pagseguroGateway
        : gateway === "WIRE"
          ? wireGateway
          : lakalaGateway;
  const result = await impl.processPayment({ amount: "0", currency: country === "BR" ? "BRL" : "USD", orderId: parsed.data.orderId });
  return c.json(ok(result));
});

export { app as paymentRoutes };
