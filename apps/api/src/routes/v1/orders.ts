import { prisma } from "@nxinmall/database";
import { Hono } from "hono";
import { z } from "zod";
import { fail, ok } from "../../lib/envelope.js";

const app = new Hono();

const statusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "DISPUTED",
  ]),
});

/** Lists orders where the authenticated user is buyer or seller. */
app.get("/orders", async (c) => {
  const auth = c.req.header("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return c.json(fail("UNAUTHORIZED", "Missing bearer token"), 401);
  }
  const userId = auth.replace("Bearer ", "").trim();
  const rows = await prisma.order.findMany({
    where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { variant: { include: { product: { select: { name: true, id: true } } } } } },
    },
    take: 100,
  });
  return c.json(ok(rows));
});

app.get("/orders/:id", async (c) => {
  const auth = c.req.header("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return c.json(fail("UNAUTHORIZED", "Missing bearer token"), 401);
  }
  const userId = auth.replace("Bearer ", "").trim();
  const id = c.req.param("id");
  const order = await prisma.order.findFirst({
    where: { id, OR: [{ buyerId: userId }, { sellerId: userId }] },
    include: {
      items: { include: { variant: { include: { product: true } } } },
      documents: true,
      payments: true,
      shipments: true,
    },
  });
  if (!order) {
    return c.json(fail("NOT_FOUND", "Order not found"), 404);
  }
  return c.json(ok(order));
});

app.patch("/orders/:id/status", async (c) => {
  const auth = c.req.header("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return c.json(fail("UNAUTHORIZED", "Missing bearer token"), 401);
  }
  const userId = auth.replace("Bearer ", "").trim();
  const id = c.req.param("id");
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json(fail("BAD_REQUEST", "Invalid JSON body"), 400);
  }
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(fail("VALIDATION_ERROR", parsed.error.flatten().formErrors.join("; ")), 400);
  }
  const order = await prisma.order.findFirst({
    where: { id, OR: [{ buyerId: userId }, { sellerId: userId }] },
  });
  if (!order) {
    return c.json(fail("NOT_FOUND", "Order not found"), 404);
  }
  const updated = await prisma.order.update({
    where: { id },
    data: { status: parsed.data.status },
  });
  return c.json(ok(updated));
});

export { app as orderRoutes };
