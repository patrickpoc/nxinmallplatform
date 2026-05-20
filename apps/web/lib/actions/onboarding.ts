"use server";

import { prisma } from "@nxinmall/database";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export type OnboardingPayload = {
  locale: string;
  /** When true, upgrades the user to SELLER after company setup */
  asSeller?: boolean;
  name: string;
  legalName?: string;
  country: string;
  type: string;
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  addressCountry: string;
  tradeLicenseUrl?: string;
  taxIdUrl?: string;
  categoryIds: string[];
};

export type CompleteOnboardingResult =
  | { ok: true; asSeller: boolean }
  | { ok: false; error: "UNAUTHORIZED" | "VALIDATION" | "SERVER"; message?: string };

/**
 * Persists the company onboarding wizard: company, address, optional documents, category interests.
 * Seller setup always passes asSeller: true.
 */
export async function completeOnboarding(data: OnboardingPayload): Promise<CompleteOnboardingResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "UNAUTHORIZED" };
  }

  const userId = session.user.id;

  if (!data.name?.trim() || data.country?.length !== 2) {
    return { ok: false, error: "VALIDATION", message: "Invalid company data" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const company = await tx.company.upsert({
        where: { userId },
        create: {
          userId,
          name: data.name.trim(),
          legalName: data.legalName?.trim() || undefined,
          country: data.country.toUpperCase(),
          type: data.type.trim(),
          verificationStatus: "PENDING",
          verificationTier: "BASIC",
        },
        update: {
          name: data.name.trim(),
          legalName: data.legalName?.trim() || undefined,
          country: data.country.toUpperCase(),
          type: data.type.trim(),
        },
      });

      await tx.address.deleteMany({ where: { companyId: company.id } });
      await tx.address.create({
        data: {
          companyId: company.id,
          street: data.street,
          city: data.city,
          state: data.state,
          country: data.addressCountry,
          postalCode: data.postalCode,
          isDefault: true,
        },
      });

      if (data.tradeLicenseUrl?.trim()) {
        await tx.document.create({
          data: {
            companyId: company.id,
            type: "TRADE_LICENSE",
            url: data.tradeLicenseUrl.trim(),
            status: "PENDING",
          },
        });
      }
      if (data.taxIdUrl?.trim()) {
        await tx.document.create({
          data: {
            companyId: company.id,
            type: "TAX_ID",
            url: data.taxIdUrl.trim(),
            status: "PENDING",
          },
        });
      }

      await tx.savedSearch.deleteMany({ where: { userId } });
      for (const categoryId of data.categoryIds ?? []) {
        await tx.savedSearch.create({
          data: {
            userId,
            filters: { categoryId },
            alertEnabled: false,
          },
        });
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          status: "PENDING_VERIFICATION",
          ...(data.asSeller ? { role: "SELLER" } : {}),
        },
      });
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return { ok: false, error: "SERVER", message };
  }

  revalidatePath(`/${data.locale}/account`);
  revalidatePath(`/${data.locale}/dashboard`);
  revalidatePath(`/${data.locale}/seller`);
  revalidatePath(`/${data.locale}/admin/verification`);

  return { ok: true, asSeller: !!data.asSeller };
}
