"use server";

import { prisma } from "@nxinmall/database";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

type OnboardingPayload = {
  locale: string;
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

/**
 * Persists the 5-step onboarding wizard: company, default address, optional documents, and saved interests.
 * Buyers/sellers both get a `Company` row plus `SavedSearch` entries for selected categories.
 */
export async function completeOnboarding(data: OnboardingPayload) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  const userId = session.user.id;

  await prisma.$transaction(async (tx) => {
    const company = await tx.company.upsert({
      where: { userId },
      create: {
        userId,
        name: data.name,
        legalName: data.legalName,
        country: data.country,
        type: data.type,
        verificationStatus: "PENDING",
        verificationTier: "BASIC",
      },
      update: {
        name: data.name,
        legalName: data.legalName,
        country: data.country,
        type: data.type,
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

    if (data.tradeLicenseUrl) {
      await tx.document.create({
        data: {
          companyId: company.id,
          type: "TRADE_LICENSE",
          url: data.tradeLicenseUrl,
          status: "PENDING",
        },
      });
    }
    if (data.taxIdUrl) {
      await tx.document.create({
        data: {
          companyId: company.id,
          type: "TAX_ID",
          url: data.taxIdUrl,
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
      data: { status: "PENDING_VERIFICATION" },
    });
  });

  revalidatePath(`/${data.locale}/dashboard`);
  revalidatePath(`/${data.locale}/admin/verification`);
}
