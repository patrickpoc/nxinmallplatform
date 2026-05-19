import { NextResponse } from "next/server";
import { prisma } from "@nxinmall/database";
import { productListInclude } from "@/lib/product-listing";

export const dynamic = "force-dynamic";

const bootstrapProductInclude = {
  ...productListInclude,
  seller: {
    select: {
      company: {
        select: { id: true, name: true, verificationStatus: true },
      },
    },
  },
} as const;

async function resolveDemoCompany(
  product: {
    seller: {
      company: { id: string; name: string; verificationStatus: string } | null;
    } | null;
  } | null,
): Promise<{ companyId: string; companyName: string } | null> {
  const fromProduct = product?.seller?.company;
  if (fromProduct?.verificationStatus === "APPROVED") {
    return { companyId: fromProduct.id, companyName: fromProduct.name };
  }

  const fallback = await prisma.company.findFirst({
    where: { verificationStatus: "APPROVED" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  if (!fallback) return null;
  return { companyId: fallback.id, companyName: fallback.name };
}

export async function GET() {
  try {
    const product = await prisma.product.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      include: bootstrapProductInclude,
    });

    if (!product) {
      return NextResponse.json({ error: "No active product" }, { status: 404 });
    }

    const company = await resolveDemoCompany(product);
    if (!company) {
      return NextResponse.json({ error: "No approved seller" }, { status: 404 });
    }

    const v = product.variants[0];
    const nameObj = product.name as Record<string, string> | null;
    const name = nameObj?.pt ?? nameObj?.en ?? "Product";

    return NextResponse.json({
      productId: product.id,
      categoryId: product.categoryId,
      variantId: v?.id ?? "",
      name,
      priceAmount: v?.priceAmount ? Number(v.priceAmount) : v?.priceUsd ? Number(v.priceUsd) : 0,
      priceCurrency: (v?.priceCurrency as "USD" | "BRL") ?? "USD",
      imageUrl: product.images[0]?.url,
      unit: v?.unit ?? undefined,
      companyId: company.companyId,
      companyName: company.companyName,
    });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
