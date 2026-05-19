import { prismaWrite } from "@nxinmall/database";
import { registerSchema } from "@nxinmall/validators";
import bcrypt from "bcryptjs";
import { Hono } from "hono";
import { fail, ok } from "../../lib/envelope.js";

const app = new Hono();

/**
 * Email/password registration used by the web app (and future clients).
 * Creates a user with hashed password; email verification is handled by NextAuth / web layer.
 */
app.post("/auth/register", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json(fail("BAD_REQUEST", "Invalid JSON body"), 400);
  }
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(fail("VALIDATION_ERROR", parsed.error.flatten().formErrors.join("; ")), 400);
  }
  const { email, password, role } = parsed.data;
  const existing = await prismaWrite.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return c.json(fail("EMAIL_IN_USE", "An account with this email already exists"), 409);
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prismaWrite.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      role,
      status: "ACTIVE",
    },
    select: { id: true, email: true, role: true, status: true, createdAt: true },
  });
  return c.json(ok(user), 201);
});

export { app as authRoutes };
