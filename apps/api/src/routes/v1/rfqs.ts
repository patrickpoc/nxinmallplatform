import { prisma, Prisma } from "@nxinmall/database";
import { rfqCreateSchema, rfqResponseSchema } from "@nxinmall/validators";
import { Hono } from "hono";
import { fail, ok } from "../../lib/envelope.js";

const app = new Hono();

/** Lists RFQs visible to the current principal (buyer: own; seller: matched — simplified to OPEN for demo). */
app.get("/rfqs", async (c) => {
  const auth = c.req.header("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return c.json(fail("UNAUTHORIZED", "Missing bearer token"), 401);
  }
  const userId = auth.replace("Bearer ", "").trim();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return c.json(fail("UNAUTHORIZED", "Invalid token"), 401);
  }
  if (user.role === "BUYER") {
    const rows = await prisma.rFQ.findMany({
      where: { buyerId: user.id },
      orderBy: { createdAt: "desc" },
      include: { category: { select: { slug: true, name: true } }, _count: { select: { responses: true } } },
    });
    return c.json(ok(rows));
  }
  if (user.role === "SELLER") {
    const rows = await prisma.rFQ.findMany({
      where: { status: { in: ["OPEN", "RECEIVING_QUOTES"] } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { category: { select: { slug: true, name: true } } },
    });
    return c.json(ok(rows));
  }
  return c.json(fail("FORBIDDEN", "Admin RFQ list not implemented here"), 403);
});

app.get("/rfqs/:id", async (c) => {
  const auth = c.req.header("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return c.json(fail("UNAUTHORIZED", "Missing bearer token"), 401);
  }
  const userId = auth.replace("Bearer ", "").trim();
  const id = c.req.param("id");
  const rfq = await prisma.rFQ.findFirst({
    where: { id, OR: [{ buyerId: userId }] },
    include: {
      responses: { include: { seller: { select: { id: true, name: true, company: true } } } },
      category: true,
    },
  });
  if (!rfq) {
    return c.json(fail("NOT_FOUND", "RFQ not found"), 404);
  }
  return c.json(ok(rfq));
});

app.post("/rfqs", async (c) => {
  const auth = c.req.header("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return c.json(fail("UNAUTHORIZED", "Missing bearer token"), 401);
  }
  const userId = auth.replace("Bearer ", "").trim();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "BUYER") {
    return c.json(fail("FORBIDDEN", "Only buyers can create RFQs"), 403);
  }
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json(fail("BAD_REQUEST", "Invalid JSON body"), 400);
  }
  const parsed = rfqCreateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(fail("VALIDATION_ERROR", parsed.error.flatten().formErrors.join("; ")), 400);
  }
  const d = parsed.data;
  const rfq = await prisma.rFQ.create({
    data: {
      buyerId: user.id,
      title: d.title,
      categoryId: d.categoryId,
      description: d.description,
      quantity: new Prisma.Decimal(d.quantity),
      unit: d.unit,
      targetPriceUsd: d.targetPriceUsd ? new Prisma.Decimal(d.targetPriceUsd) : undefined,
      deadline: d.deadline,
      status: "OPEN",
    },
  });
  return c.json(ok(rfq), 201);
});

app.post("/rfqs/:id/responses", async (c) => {
  const auth = c.req.header("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return c.json(fail("UNAUTHORIZED", "Missing bearer token"), 401);
  }
  const userId = auth.replace("Bearer ", "").trim();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "SELLER") {
    return c.json(fail("FORBIDDEN", "Only sellers can respond"), 403);
  }
  const rfqId = c.req.param("id");
  const rfq = await prisma.rFQ.findUnique({ where: { id: rfqId } });
  if (!rfq || rfq.status === "CLOSED" || rfq.status === "CONVERTED") {
    return c.json(fail("BAD_REQUEST", "RFQ is not accepting quotes"), 400);
  }
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json(fail("BAD_REQUEST", "Invalid JSON body"), 400);
  }
  const parsed = rfqResponseSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(fail("VALIDATION_ERROR", parsed.error.flatten().formErrors.join("; ")), 400);
  }
  const res = await prisma.rFQResponse.create({
    data: {
      rfqId,
      sellerId: user.id,
      priceUsd: new Prisma.Decimal(parsed.data.priceUsd),
      leadTimeDays: parsed.data.leadTimeDays,
      message: parsed.data.message,
    },
  });
  return c.json(ok(res), 201);
});

export { app as rfqRoutes };
