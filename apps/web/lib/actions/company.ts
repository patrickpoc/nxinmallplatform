"use server";

import { prisma } from "@nxinmall/database";
import { auth } from "@/auth";

export async function getUserCompany() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.company.findUnique({
    where: { userId: session.user.id },
  });
}

export type OnboardingCategoryOption = {
  id: string;
  slug: string;
  name: unknown;
  parentSlug: string | null;
};

export async function listOnboardingCategories(): Promise<OnboardingCategoryOption[]> {
  const rows = await prisma.category.findMany({
    orderBy: { slug: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      parent: { select: { slug: true } },
    },
  });
  return rows.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    parentSlug: c.parent?.slug ?? null,
  }));
}
