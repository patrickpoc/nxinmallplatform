"use server";

import { prisma } from "@nxinmall/database";
import { fairBoothProfileSchema } from "@nxinmall/validators";
import { revalidatePath } from "next/cache";
import type { Session } from "next-auth";
import { auth } from "@/auth";

function assertFairVendor(session: Session | null) {
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "FAIR_VENDOR") throw new Error("Forbidden");
  return session.user.id;
}

export async function getFairBoothForVendor() {
  const session = await auth();
  const userId = assertFairVendor(session);
  return prisma.fairBooth.findUnique({ where: { userId } });
}

export async function updateFairBoothProfile(input: unknown) {
  const session = await auth();
  const userId = assertFairVendor(session);
  const parsed = fairBoothProfileSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.flatten().formErrors.join("; ") || "Validation failed");
  }
  const d = parsed.data;

  const existing = await prisma.fairBooth.findUnique({ where: { userId } });
  if (!existing) throw new Error("Booth not found");

  const slugTaken = await prisma.fairBooth.findFirst({
    where: { slug: d.slug, NOT: { userId } },
  });
  if (slugTaken) throw new Error("This booth URL is already taken");

  await prisma.fairBooth.update({
    where: { userId },
    data: {
      companyName: d.companyName,
      legalName: d.legalName || null,
      cnpj: d.cnpj || null,
      country: d.country,
      type: d.type,
      street: d.street || null,
      city: d.city || null,
      state: d.state || null,
      postalCode: d.postalCode || null,
      addressCountry: d.addressCountry || null,
      phone: d.phone || null,
      whatsappNumber: d.whatsappNumber || null,
      quotationUrl: d.quotationUrl || null,
      pixKey: d.pixKey || null,
      pixKeyType: d.pixKeyType || null,
      pixBeneficiaryName: d.pixBeneficiaryName || null,
      pixImageUrl: d.pixImageUrl || null,
      logoUrl: d.logoUrl || null,
      bannerUrl: d.bannerUrl || null,
      slug: d.slug,
      isActive: d.isActive,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { name: d.companyName },
  });

  revalidatePath("/feira-vendor");
  revalidatePath("/feira-vendor/perfil");
  revalidatePath(`/feira/${d.slug}`);
}
