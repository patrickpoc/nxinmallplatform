"use server";

import { DEMO_PLATFORM_SELLER_EMAIL } from "@nxinmall/constants";
import { Prisma, prisma } from "@nxinmall/database";
import { revalidatePath } from "next/cache";
import { revalidateCatalogCache } from "@/lib/marketplace/revalidate-catalog";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

const UNITS = ["KG", "TON", "UNIT", "BOX", "PALLET"] as const;
type Unit = (typeof UNITS)[number];

async function requireAdminLocale(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect(`/${locale}/auth/login`);
  }
  return { locale };
}

async function getDemoSellerId(): Promise<string> {
  const u = await prisma.user.findUnique({
    where: { email: DEMO_PLATFORM_SELLER_EMAIL },
    select: { id: true },
  });
  if (!u?.id) {
    throw new Error("Run `pnpm db:seed` to create the demo seller.");
  }
  return u.id;
}

function parseMultilingualName(formData: FormData) {
  const en = String(formData.get("nameEn") ?? "").trim();
  const pt = String(formData.get("namePt") ?? "").trim() || en;
  const zh = String(formData.get("nameZh") ?? "").trim() || en;
  return { en, pt, zh, valid: en.length > 0 };
}

function parseDescription(formData: FormData): Prisma.InputJsonValue | undefined {
  const en = String(formData.get("descEn") ?? "").trim();
  if (!en) return undefined;
  const pt = String(formData.get("descPt") ?? "").trim() || en;
  const zh = String(formData.get("descZh") ?? "").trim() || en;
  return { en, pt, zh };
}

function parseUnit(raw: string): Unit {
  return UNITS.includes(raw as Unit) ? (raw as Unit) : "UNIT";
}

function revalidateCatalog(locale: string) {
  revalidateCatalogCache();
  revalidatePath(`/${locale}`, "layout");
  revalidatePath(`/${locale}/products`, "page");
  revalidatePath(`/${locale}/admin/products`, "page");
}

export async function createDemoProduct(formData: FormData) {
  const { locale } = await requireAdminLocale(formData);
  const sellerId = await getDemoSellerId();
  const { en, pt, zh, valid } = parseMultilingualName(formData);
  if (!valid) {
    redirect(`/${locale}/admin/products/new?error=validation`);
  }
  const categoryId = String(formData.get("categoryId") ?? "");
  const status = String(formData.get("status") ?? "DRAFT") as "DRAFT" | "ACTIVE" | "PAUSED";
  const priceAmountRaw = String(formData.get("priceAmount") ?? "").trim();
  const priceCurrency = String(formData.get("priceCurrency") ?? "USD") as "USD" | "BRL";
  const stockQty = Number(formData.get("stockQty") ?? 0);
  const unit = parseUnit(String(formData.get("unit") ?? "UNIT"));
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const desc = parseDescription(formData);

  if (!/^[\d.]+$/.test(priceAmountRaw) || stockQty < 0 || !categoryId || (priceCurrency !== "USD" && priceCurrency !== "BRL")) {
    redirect(`/${locale}/admin/products/new?error=validation`);
  }

  const sku = `DEMO-${Date.now().toString(36)}`;

  try {
    await prisma.product.create({
      data: {
        sellerId,
        categoryId,
        name: { en, pt, zh },
        description: desc,
        status,
        images: imageUrl
          ? {
              create: [{ url: imageUrl, isPrimary: true, sortOrder: 0 }],
            }
          : undefined,
        variants: {
          create: [
            {
              sku,
              priceUsd: new Prisma.Decimal(priceCurrency === "USD" ? priceAmountRaw : "0"),
              priceAmount: new Prisma.Decimal(priceAmountRaw),
              priceCurrency,
              minOrderQty: 1,
              unit,
              stockQty,
            },
          ],
        },
      },
    });
  } catch {
    redirect(`/${locale}/admin/products/new?error=db`);
  }

  revalidateCatalog(locale);
  redirect(`/${locale}/admin/products`);
}

export async function updateDemoProduct(formData: FormData) {
  const { locale } = await requireAdminLocale(formData);
  const sellerId = await getDemoSellerId();
  const productId = String(formData.get("productId") ?? "");
  if (!productId) {
    redirect(`/${locale}/admin/products?error=validation`);
  }

  const existing = await prisma.product.findFirst({
    where: { id: productId, sellerId },
    select: { id: true },
  });
  if (!existing) {
    redirect(`/${locale}/admin/products?error=forbidden`);
  }

  const { en, pt, zh, valid } = parseMultilingualName(formData);
  if (!valid) {
    redirect(`/${locale}/admin/products/${productId}/edit?error=validation`);
  }
  const categoryId = String(formData.get("categoryId") ?? "");
  const status = String(formData.get("status") ?? "DRAFT") as "DRAFT" | "ACTIVE" | "PAUSED";
  const priceAmountRaw = String(formData.get("priceAmount") ?? "").trim();
  const priceCurrency = String(formData.get("priceCurrency") ?? "USD") as "USD" | "BRL";
  const stockQty = Number(formData.get("stockQty") ?? 0);
  const unit = parseUnit(String(formData.get("unit") ?? "UNIT"));
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const desc = parseDescription(formData);

  if (!/^[\d.]+$/.test(priceAmountRaw) || stockQty < 0 || !categoryId || (priceCurrency !== "USD" && priceCurrency !== "BRL")) {
    redirect(`/${locale}/admin/products/${productId}/edit?error=validation`);
  }

  const sku = `DEMO-${productId.slice(0, 12)}`;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId } });
      if (imageUrl) {
        await tx.productImage.create({
          data: { productId, url: imageUrl, isPrimary: true, sortOrder: 0 },
        });
      }
      await tx.productVariant.deleteMany({ where: { productId } });
      await tx.productVariant.create({
        data: {
          productId,
          sku,
          priceUsd: new Prisma.Decimal(priceCurrency === "USD" ? priceAmountRaw : "0"),
          priceAmount: new Prisma.Decimal(priceAmountRaw),
          priceCurrency,
          minOrderQty: 1,
          unit,
          stockQty,
        },
      });
      await tx.product.update({
        where: { id: productId },
        data: {
          categoryId,
          status,
          name: { en, pt, zh },
          description: desc === undefined ? Prisma.JsonNull : desc,
        },
      });
    });
  } catch {
    redirect(`/${locale}/admin/products/${productId}/edit?error=db`);
  }

  revalidateCatalog(locale);
  redirect(`/${locale}/admin/products`);
}

export async function deleteDemoProduct(formData: FormData) {
  const { locale } = await requireAdminLocale(formData);
  const sellerId = await getDemoSellerId();
  const productId = String(formData.get("productId") ?? "");
  if (!productId) {
    redirect(`/${locale}/admin/products?error=validation`);
  }

  const existing = await prisma.product.findFirst({
    where: { id: productId, sellerId },
    select: { id: true },
  });
  if (!existing) {
    redirect(`/${locale}/admin/products?error=forbidden`);
  }

  try {
    await prisma.product.delete({ where: { id: productId } });
  } catch {
    redirect(`/${locale}/admin/products?error=db`);
  }

  revalidateCatalog(locale);
  redirect(`/${locale}/admin/products`);
}
