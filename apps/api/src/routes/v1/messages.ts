import { prisma } from "@nxinmall/database";
import { Hono } from "hono";
import { z } from "zod";
import { getUserFromBearer } from "../../lib/auth.js";
import { fail, ok } from "../../lib/envelope.js";

const app = new Hono();

const createThreadSchema = z.object({
  participantIds: z.array(z.string()).min(2).max(20),
  subject: z.string().max(200).optional(),
  orderId: z.string().optional(),
  rfqId: z.string().optional(),
});

const postMessageSchema = z.object({
  body: z.string().min(1).max(10000),
  attachments: z.unknown().optional(),
});

/** Lists message threads for the authenticated user via the participant join table. */
app.get("/messages/threads", async (c) => {
  const user = await getUserFromBearer(c.req.header("authorization"));
  if (!user) {
    return c.json(fail("UNAUTHORIZED", "Missing session"), 401);
  }
  const threads = await prisma.messageThread.findMany({
    where: { participants: { some: { userId: user.id } } },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      participants: { include: { user: { select: { id: true, name: true, email: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  return c.json(ok(threads));
});

app.post("/messages/threads", async (c) => {
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
  const parsed = createThreadSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(fail("VALIDATION_ERROR", parsed.error.flatten().formErrors.join("; ")), 400);
  }
  if (!parsed.data.participantIds.includes(user.id)) {
    parsed.data.participantIds.push(user.id);
  }
  const thread = await prisma.messageThread.create({
    data: {
      subject: parsed.data.subject,
      orderId: parsed.data.orderId,
      rfqId: parsed.data.rfqId,
      participants: {
        create: [...new Set(parsed.data.participantIds)].map((userId) => ({ userId })),
      },
    },
  });
  return c.json(ok(thread), 201);
});

app.post("/messages/threads/:id/messages", async (c) => {
  const user = await getUserFromBearer(c.req.header("authorization"));
  if (!user) {
    return c.json(fail("UNAUTHORIZED", "Missing session"), 401);
  }
  const threadId = c.req.param("id");
  const participant = await prisma.messageThreadParticipant.findFirst({ where: { threadId, userId: user.id } });
  if (!participant) {
    return c.json(fail("FORBIDDEN", "Not a participant"), 403);
  }
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json(fail("BAD_REQUEST", "Invalid JSON body"), 400);
  }
  const parsed = postMessageSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(fail("VALIDATION_ERROR", parsed.error.flatten().formErrors.join("; ")), 400);
  }
  const msg = await prisma.message.create({
    data: {
      threadId,
      senderId: user.id,
      body: parsed.data.body,
      attachments: parsed.data.attachments ?? undefined,
    },
  });
  return c.json(ok(msg), 201);
});

export { app as messageRoutes };
