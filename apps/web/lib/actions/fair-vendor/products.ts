"use server";

import { prisma, Prisma } from "@nxinmall/database";
import { fairProductCreateSchema } from "@nxinmall/validators";
import { revalidatePath } from "next/cache";
import type { Session } from "next-auth";
import { z } from "zod";
import { auth } from "@/auth";

const formSchema = fairProductCreateSchema;

export type FairProductFormInput = z.infer<typeof formSchema>;

function assertFairVendor(session: Session | null) {
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "FAIR_VENDOR") throw new Error("Forbidden");
  return session.user.id;
}

function normalizeName(name: { en?: string; pt?: string; zh?: string }) {
  return {
    en: name.en || name.pt || "",
    pt: name.pt || name.en || "",
    zh: name.zh || name.en || name.pt || "",
  };
}

export async function createFairProduct(input: FairProductFormInput) {
  const sellerId = assertFairVendor(await auth());
  const parsed = formSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.flatten().formErrors.join("; ") || "Validation failed");
  }
  const d = parsed.data;

  await prisma.product.create({
    data: {
      sellerId,
      categoryId: d.categoryId,
      name: normalizeName(d.name),
      description: d.description ? normalizeName(d.description) : undefined,
      status: d.status,
      salesChannel: "FAIR",
      variants: {
        create: d.variants.map((v) => ({
          sku: v.sku,
          priceUsd: new Prisma.Decimal(v.priceAmount),
          priceAmount: new Prisma.Decimal(v.priceAmount),
          priceCurrency: "BRL",
          minOrderQty: v.minOrderQty,
          unit: v.unit,
          stockQty: v.stockQty,
          attributes: v.attributes !== undefined ? (v.attributes as Prisma.InputJsonValue) : undefined,
        })),
      },
      images: {
        create: d.images.map((img, i) => ({
          url: img.url,
          isPrimary: img.isPrimary,
          kind: img.kind,
          sortOrder: i,
        })),
      },
    },
  });

  revalidatePath("/feira-vendor/produtos");
}

export async function updateFairProduct(productId: string, input: FairProductFormInput) {
  const sellerId = assertFairVendor(await auth());
  const parsed = formSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.flatten().formErrors.join("; ") || "Validation failed");
  }
  const d = parsed.data;

  const existing = await prisma.product.findFirst({
    where: { id: productId, sellerId, salesChannel: "FAIR" },
  });
  if (!existing) throw new Error("Product not found");

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        categoryId: d.categoryId,
        name: normalizeName(d.name),
        description: d.description ? normalizeName(d.description) : undefined,
        status: d.status,
      },
    });
    await tx.productVariant.deleteMany({ where: { productId } });
    await tx.productVariant.createMany({
      data: d.variants.map((v) => ({
        productId,
        sku: v.sku,
        priceUsd: new Prisma.Decimal(v.priceAmount),
        priceAmount: new Prisma.Decimal(v.priceAmount),
        priceCurrency: "BRL",
        minOrderQty: v.minOrderQty,
        unit: v.unit,
        stockQty: v.stockQty,
        attributes: v.attributes !== undefined ? (v.attributes as Prisma.InputJsonValue) : undefined,
      })),
    });
    await tx.productImage.deleteMany({ where: { productId } });
    if (d.images.length > 0) {
      await tx.productImage.createMany({
        data: d.images.map((img, i) => ({
          productId,
          url: img.url,
          isPrimary: img.isPrimary,
          kind: img.kind,
          sortOrder: i,
        })),
      });
    }
  });

  revalidatePath("/feira-vendor/produtos");
  revalidatePath(`/feira-vendor/produtos/${productId}/editar`);
}

export async function deleteFairProduct(productId: string) {
  const sellerId = assertFairVendor(await auth());
  const existing = await prisma.product.findFirst({
    where: { id: productId, sellerId, salesChannel: "FAIR" },
  });
  if (!existing) throw new Error("Product not found");
  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/feira-vendor/produtos");
}
