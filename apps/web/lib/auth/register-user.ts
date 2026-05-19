import { prisma } from "@nxinmall/database";
import { registerSchema } from "@nxinmall/validators";
import bcrypt from "bcryptjs";
import type { ApiEnvelope } from "@nxinmall/types";

type RegisterResult =
  | { ok: true; envelope: ApiEnvelope<{ id: string; email: string; role: string; status: string; createdAt: Date }> }
  | { ok: false; status: number; envelope: ApiEnvelope<null> };

function fail(code: string, message: string): ApiEnvelope<null> {
  return { success: false, data: null, error: { code, message }, meta: null };
}

function ok<T>(data: T): ApiEnvelope<T> {
  return { success: true, data, error: null, meta: null };
}

/** Shared registration logic for the web Route Handler (Vercel) and optional API proxy. */
export async function registerUser(body: unknown): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      envelope: fail("VALIDATION_ERROR", parsed.error.flatten().formErrors.join("; ")),
    };
  }

  const { email, password, role } = parsed.data;
  const normalized = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) {
    return { ok: false, status: 409, envelope: fail("EMAIL_IN_USE", "An account with this email already exists") };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email: normalized,
      passwordHash,
      role,
      status: "PENDING_VERIFICATION",
    },
    select: { id: true, email: true, role: true, status: true, createdAt: true },
  });

  return { ok: true, envelope: ok(user) };
}
