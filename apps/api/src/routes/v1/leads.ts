import { prisma } from "@nxinmall/database";
import { Hono } from "hono";
import { z } from "zod";
import { fail, ok } from "../../lib/envelope.js";

const app = new Hono();

const leadSchema = z.object({
  productId: z.string().min(1),
  categoryId: z.string().uuid(),
  productName: z.string().min(1).max(300),
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  phone: z.string().max(40).nullable().optional(),
  quantity: z.number().positive(),
  unit: z.enum(["KG", "TON", "UNIT", "BOX", "PALLET"]),
  message: z.string().min(1).max(5000),
  locale: z.string().max(10).optional(),
});

/**
 * Lead capture for "Ask for quotation" quick modal.
 * Persists as a Notification for the seller (no migrations required).
 */
app.post("/leads", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json(fail("BAD_REQUEST", "Invalid JSON body"), 400);
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(fail("VALIDATION_ERROR", parsed.error.flatten().formErrors.join("; ")), 400);
  }

  const d = parsed.data;

  const product = await prisma.product.findUnique({
    where: { id: d.productId },
    select: { id: true, sellerId: true },
  });
  if (!product) {
    return c.json(fail("NOT_FOUND", "Product not found"), 404);
  }

  await prisma.notification.create({
    data: {
      userId: product.sellerId,
      type: "LEAD_RAQ",
      title: `New quotation request: ${d.productName}`,
      body: d.message,
      metadata: {
        productId: d.productId,
        categoryId: d.categoryId,
        productName: d.productName,
        contact: {
          name: d.name,
          email: d.email,
          phone: d.phone ?? null,
        },
        request: {
          quantity: d.quantity,
          unit: d.unit,
        },
        locale: d.locale ?? null,
        source: "web_product_modal",
      },
    },
  });

  return c.json(ok({ received: true }));
});

export { app as leadRoutes };

