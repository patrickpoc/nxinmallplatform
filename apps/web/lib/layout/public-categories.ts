import { prisma } from "@nxinmall/database";

export type PublicHeaderCategory = {
  id: string;
  slug: string;
  name: unknown;
  children?: { id: string; slug: string; name: unknown }[];
};

export async function getPublicHeaderCategories(): Promise<PublicHeaderCategory[]> {
  try {
    return await prisma.category.findMany({
      where: { parentId: null },
      orderBy: { slug: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        children: {
          select: { id: true, slug: true, name: true },
          orderBy: { slug: "asc" },
        },
      },
    });
  } catch {
    return [];
  }
}
