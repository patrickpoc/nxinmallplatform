"use server";

import { FAIR_NEW_CATEGORY_ID } from "@nxinmall/constants";
import { prisma, Prisma } from "@nxinmall/database";
import { fairProductCreateSchema, fairProductPersistSchema } from "@nxinmall/validators";
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

function normalizeFairDescription(
  desc?: { en?: string; pt?: string; zh?: string } | null,
): ReturnType<typeof normalizeName> | typeof Prisma.JsonNull {
  if (!desc) return Prisma.JsonNull;
  const pt = desc.pt?.trim() ?? "";
  const en = desc.en?.trim() ?? "";
  const zh = desc.zh?.trim() ?? "";
  if (!pt && !en && !zh) return Prisma.JsonNull;
  return normalizeName({ pt, en, zh });
}

function mapVariantForPersist(variant: FairProductFormInput["variants"][number]) {
  const { variantLabel, variantImageUrl, variantImageUrls, isStorefrontVariant, attributes, ...rest } =
    variant;
  const attrs: Record<string, unknown> = { ...((attributes as Record<string, unknown> | undefined) ?? {}) };
  const label = variantLabel?.trim();
  const imageUrl = variantImageUrl?.trim();
  if (label) attrs.label = label;
  else delete attrs.label;
  if (imageUrl) attrs.imageUrl = imageUrl;
  else delete attrs.imageUrl;
  const extras = (variantImageUrls ?? [])
    .map((url) => url.trim())
    .filter(Boolean)
    .filter((url) => url !== imageUrl);
  const uniqueExtras = [...new Set(extras)];
  if (uniqueExtras.length > 0) attrs.imageUrls = uniqueExtras;
  else delete attrs.imageUrls;
  if (isStorefrontVariant) attrs.isStorefront = true;
  else delete attrs.isStorefront;
  return {
    ...rest,
    attributes: Object.keys(attrs).length > 0 ? attrs : undefined,
  };
}

function slugifyCategoryName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

async function resolveFairCategoryId(
  sellerId: string,
  categoryId: string,
  newCategoryName?: string,
): Promise<string> {
  if (categoryId !== FAIR_NEW_CATEGORY_ID) {
    const exists = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!exists) throw new Error("Categoria inválida");
    return categoryId;
  }

  const trimmed = newCategoryName?.trim();
  if (!trimmed) throw new Error("Nome da nova categoria é obrigatório");

  const booth = await prisma.fairBooth.findUnique({ where: { userId: sellerId } });
  if (!booth) throw new Error("Perfil do estande não encontrado");

  const baseSlug = `feira-${booth.slug}-${slugifyCategoryName(trimmed)}`.slice(0, 64);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`.slice(0, 64);
    suffix += 1;
  }

  const category = await prisma.category.create({
    data: {
      slug,
      name: { pt: trimmed, en: trimmed, zh: trimmed },
    },
  });
  return category.id;
}

function preparePersistPayload(input: FairProductFormInput, resolvedCategoryId: string) {
  const images = input.images
    .filter((img) => img.url.trim())
    .map((img) => ({
      url: img.url.trim(),
      isPrimary: img.isPrimary,
      kind: img.kind,
    }));
  const payload = {
    ...input,
    categoryId: resolvedCategoryId,
    images,
    variants: input.variants.map(mapVariantForPersist),
  };

  const parsed = fairProductPersistSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const messages = Object.entries(fieldErrors)
      .flatMap(([key, msgs]) => (msgs ?? []).map((m) => `${key}: ${m}`))
      .join("; ");
    throw new Error(messages || "Validation failed");
  }
  return parsed.data;
}

function revalidateFairProductPaths(boothSlug?: string) {
  revalidatePath("/feira-vendor/produtos");
  if (boothSlug) {
    revalidatePath(`/feira/${boothSlug}`);
  }
}

export async function createFairProduct(input: FairProductFormInput) {
  const sellerId = assertFairVendor(await auth());
  const parsed = formSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const messages = Object.entries(fieldErrors)
      .flatMap(([key, msgs]) => (msgs ?? []).map((m) => `${key}: ${m}`))
      .join("; ");
    throw new Error(messages || "Validation failed");
  }

  const resolvedCategoryId = await resolveFairCategoryId(
    sellerId,
    parsed.data.categoryId,
    parsed.data.newCategoryName,
  );
  const d = preparePersistPayload(parsed.data, resolvedCategoryId);

  const booth = await prisma.fairBooth.findUnique({
    where: { userId: sellerId },
    select: { slug: true },
  });

  await prisma.product.create({
    data: {
      sellerId,
      categoryId: d.categoryId,
      name: normalizeName(d.name),
      description: normalizeFairDescription(d.description),
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

  revalidateFairProductPaths(booth?.slug);
}

export async function updateFairProduct(productId: string, input: FairProductFormInput) {
  const sellerId = assertFairVendor(await auth());
  const parsed = formSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const messages = Object.entries(fieldErrors)
      .flatMap(([key, msgs]) => (msgs ?? []).map((m) => `${key}: ${m}`))
      .join("; ");
    throw new Error(messages || "Validation failed");
  }

  const existing = await prisma.product.findFirst({
    where: { id: productId, sellerId, salesChannel: "FAIR" },
  });
  if (!existing) throw new Error("Product not found");

  const resolvedCategoryId = await resolveFairCategoryId(
    sellerId,
    parsed.data.categoryId,
    parsed.data.newCategoryName,
  );
  const d = preparePersistPayload(parsed.data, resolvedCategoryId);

  const booth = await prisma.fairBooth.findUnique({
    where: { userId: sellerId },
    select: { slug: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        categoryId: d.categoryId,
        name: normalizeName(d.name),
        description: normalizeFairDescription(d.description),
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

  revalidateFairProductPaths(booth?.slug);
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
