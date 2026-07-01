import { prismaWrite } from "@nxinmall/database";
import { fairVendorRegisterSchema } from "@nxinmall/validators";
import bcrypt from "bcryptjs";
import type { ApiEnvelope } from "@nxinmall/types";

type RegisterResult =
  | { ok: true; envelope: ApiEnvelope<{ id: string; email: string; role: string; slug: string }> }
  | { ok: false; status: number; envelope: ApiEnvelope<null> };

function fail(code: string, message: string): ApiEnvelope<null> {
  return { success: false, data: null, error: { code, message }, meta: null };
}

function ok<T>(data: T): ApiEnvelope<T> {
  return { success: true, data, error: null, meta: null };
}

export async function registerFairVendor(body: unknown): Promise<RegisterResult> {
  const parsed = fairVendorRegisterSchema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      envelope: fail("VALIDATION_ERROR", parsed.error.flatten().formErrors.join("; ")),
    };
  }

  const { email, password, companyName, slug } = parsed.data;
  const normalized = email.toLowerCase();

  const [existingEmail, existingSlug] = await Promise.all([
    prismaWrite.user.findUnique({ where: { email: normalized } }),
    prismaWrite.fairBooth.findUnique({ where: { slug } }),
  ]);

  if (existingEmail) {
    return { ok: false, status: 409, envelope: fail("EMAIL_IN_USE", "An account with this email already exists") };
  }
  if (existingSlug) {
    return { ok: false, status: 409, envelope: fail("SLUG_IN_USE", "This booth URL is already taken") };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prismaWrite.user.create({
    data: {
      email: normalized,
      name: companyName,
      passwordHash,
      role: "FAIR_VENDOR",
      status: "ACTIVE",
      fairBooth: {
        create: {
          slug,
          companyName,
          country: "BR",
          type: "supplier",
          isActive: false,
        },
      },
    },
    select: { id: true, email: true, role: true, fairBooth: { select: { slug: true } } },
  });

  return {
    ok: true,
    envelope: ok({
      id: user.id,
      email: user.email,
      role: user.role,
      slug: user.fairBooth!.slug,
    }),
  };
}
