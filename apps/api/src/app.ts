import { Hono } from "hono";
import { cors } from "hono/cors";
import { onError } from "./middleware/error-handler.js";
import { authRoutes } from "./routes/v1/auth.js";
import { healthRoutes } from "./routes/v1/health.js";
import { intelligenceRoutes } from "./routes/v1/intelligence.js";
import { messageRoutes } from "./routes/v1/messages.js";
import { orderRoutes } from "./routes/v1/orders.js";
import { paymentRoutes } from "./routes/v1/payments.js";
import { productRoutes } from "./routes/v1/products.js";
import { rfqRoutes } from "./routes/v1/rfqs.js";
import { leadRoutes } from "./routes/v1/leads.js";
import { webhookRoutes } from "./routes/v1/webhooks.js";

/**
 * Composes versioned REST API under `/api/v1` with CORS for the Next.js web origin.
 */
export function createApp() {
  const app = new Hono();
  app.onError(onError);
  app.use(
    "*",
    cors({
      origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:3000"],
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
    }),
  );

  const v1 = new Hono();
  v1.route("/", healthRoutes);
  v1.route("/", productRoutes);
  v1.route("/", authRoutes);
  v1.route("/", rfqRoutes);
  v1.route("/", leadRoutes);
  v1.route("/", orderRoutes);
  v1.route("/", messageRoutes);
  v1.route("/", intelligenceRoutes);
  v1.route("/", paymentRoutes);
  v1.route("/", webhookRoutes);

  app.route("/api/v1", v1);
  return app;
}
