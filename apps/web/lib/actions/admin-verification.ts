"use server";

import { prisma } from "@nxinmall/database";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

/**
 * Approves a company registration after admin review; upgrades tier for sellers to enable listings.
 */
export async function approveCompany(companyId: string, locale: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    throw new Error("Company not found");
  }
  await prisma.company.update({
    where: { id: companyId },
    data: {
      verificationStatus: "APPROVED",
      verificationTier: "VERIFIED",
    },
  });
  await prisma.notification.create({
    data: {
      userId: company.userId,
      type: "VERIFICATION",
      title: "Company approved",
      body: "Your company profile has been approved on NxinMall.",
    },
  });
  revalidatePath(`/${locale}/admin/verification`);
}

/** Rejects a company with optional reviewer context stored on related documents (v1: status only). */
export async function rejectCompany(companyId: string, locale: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  await prisma.company.update({
    where: { id: companyId },
    data: { verificationStatus: "REJECTED" },
  });
  revalidatePath(`/${locale}/admin/verification`);
}
