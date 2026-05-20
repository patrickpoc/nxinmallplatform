"use server";

import { prisma } from "@nxinmall/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";

const storeSchema = z.object({
  name: z.string().min(2).max(200),
  legalName: z.string().max(300).optional(),
  country: z.string().length(2),
  type: z.string().min(1).max(100),
});

export async function updateSellerStore(data: z.infer<typeof storeSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "SELLER") throw new Error("Forbidden");

  const parsed = storeSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid store data");

  await prisma.company.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      name: parsed.data.name,
      legalName: parsed.data.legalName,
      country: parsed.data.country,
      type: parsed.data.type,
      verificationStatus: "PENDING",
      verificationTier: "BASIC",
    },
    update: {
      name: parsed.data.name,
      legalName: parsed.data.legalName,
      country: parsed.data.country,
      type: parsed.data.type,
    },
  });

  revalidatePath("/seller/store");
  revalidatePath("/seller/profile");
}

/** @deprecated Use getUserCompany from @/lib/actions/company */
export async function getSellerCompany() {
  const { getUserCompany } = await import("@/lib/actions/company");
  return getUserCompany();
}
