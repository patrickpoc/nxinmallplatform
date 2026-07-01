import { prisma } from "@nxinmall/database";

export async function getFairBoothBySlug(slug: string) {
  return prisma.fairBooth.findFirst({
    where: { slug, isActive: true },
    include: { user: { select: { id: true } } },
  });
}

export async function getFairBoothBySlugAny(slug: string) {
  return prisma.fairBooth.findUnique({
    where: { slug },
    include: { user: { select: { id: true } } },
  });
}
