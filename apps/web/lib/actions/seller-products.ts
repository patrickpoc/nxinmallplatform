"use server";

import { prisma, Prisma } from "@nxinmall/database";
import { productCreateSchema, productVariantSchema } from "@nxinmall/validators";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Session } from "next-auth";
import { auth } from "@/auth";

const sellerProductFormSchema = productCreateSchema.extend({
  variants: z.array(productVariantSchema).min(1).max(20),
});

export type SellerProductFormInput = z.infer<typeof sellerProductFormSchema>;

function assertSeller(session: Session | null) {
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "SELLER") throw new Error("Only sellers can manage products");
  return session.user.id;
}

export async function createSellerProduct(input: SellerProductFormInput) {
  const sellerId = assertSeller(await auth());
  const parsed = sellerProductFormSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.flatten().formErrors.join("; ") || "Validation failed");
  }
  const d = parsed.data;

  await prisma.product.create({
    data: {
      sellerId,
      categoryId: d.categoryId,
      name: d.name,
      description: d.description ?? undefined,
      status: d.status,
      variants: {
        create: d.variants.map((v) => ({
          sku: v.sku,
          priceUsd: new Prisma.Decimal(v.priceUsd),
          minOrderQty: v.minOrderQty,
          unit: v.unit,
          stockQty: v.stockQty,
          attributes: v.attributes !== undefined ? (v.attributes as Prisma.InputJsonValue) : undefined,
        })),
      },
    },
  });

  revalidatePath("/seller/products");
}

export async function updateSellerProduct(productId: string, input: SellerProductFormInput) {
  const sellerId = assertSeller(await auth());
  const parsed = sellerProductFormSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.flatten().formErrors.join("; ") || "Validation failed");
  }
  const d = parsed.data;

  const existing = await prisma.product.findFirst({
    where: { id: productId, sellerId },
    include: { variants: true },
  });
  if (!existing) throw new Error("Product not found");

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        categoryId: d.categoryId,
        name: d.name,
        description: d.description ?? undefined,
        status: d.status,
      },
    });
    await tx.productVariant.deleteMany({ where: { productId } });
    await tx.productVariant.createMany({
      data: d.variants.map((v) => ({
        productId,
        sku: v.sku,
        priceUsd: new Prisma.Decimal(v.priceUsd),
        minOrderQty: v.minOrderQty,
        unit: v.unit,
        stockQty: v.stockQty,
        attributes: v.attributes !== undefined ? (v.attributes as Prisma.InputJsonValue) : undefined,
      })),
    });
  });

  revalidatePath("/seller/products");
  revalidatePath(`/seller/products/${productId}/edit`);
}

export async function listSellerCategories() {
  const rows = await prisma.category.findMany({
    where: { parentId: { not: null } },
    orderBy: { slug: "asc" },
    take: 200,
    select: { id: true, slug: true, name: true },
  });
  return rows;
}
