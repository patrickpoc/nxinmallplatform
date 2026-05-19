import { prisma } from "@nxinmall/database";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { VerificationBadge } from "@/components/brand/verification-badge";
import { ProductBreadcrumbs } from "@/components/marketplace/product-breadcrumbs";
import { ProductGallery } from "@/components/marketplace/product-gallery";
import { ProductPurchaseCard } from "@/components/marketplace/product-purchase-card";
import { ShareButton } from "@/components/marketplace/share-button";
import { RailProductCard } from "@/components/marketplace/rail-product-card";
import { HorizontalRail } from "@/components/marketplace/horizontal-rail";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { productListInclude, type ProductListRow } from "@/lib/product-listing";
import type { CartPriceCurrency } from "@/lib/cart/types";

export const dynamic = "force-dynamic";

function titleCase(s: string): string {
  return s.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatSpecValue(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v && typeof v === "object") {
    const obj = v as Record<string, unknown>;
    if ("min" in obj && "max" in obj) return `${obj.min} – ${obj.max}`;
    return Object.entries(obj).map(([k, val]) => `${titleCase(k)}: ${val}`).join(", ");
  }
  return JSON.stringify(v);
}

export default async function ProductDetailPage({ params }: { params: { locale: string; id: string } }) {
  const t = await getTranslations("product");
  let product = null;
  try {
    product = await prisma.product.findFirst({
      where: { id: params.id, status: "ACTIVE" },
      include: {
        category: { include: { parent: { select: { id: true, name: true } } } },
        variants: true,
        images: { orderBy: { sortOrder: "asc" } },
        docs: true,
        seller: { select: { id: true, name: true, company: true } },
      },
    });
  } catch {
    product = null;
  }
  if (!product) {
    notFound();
  }

  const localeKey = params.locale as "en" | "pt" | "zh";
  const nameObj = product.name as { en?: string; pt?: string; zh?: string };
  const name = nameObj?.[localeKey] ?? nameObj?.en ?? "Product";
  const descObj = product.description as { en?: string; pt?: string; zh?: string } | null;
  const description = descObj?.[localeKey] ?? descObj?.en ?? "";
  const images = product.images.map((i) => ({ url: i.url }));
  const primaryVariant =
    product.variants.slice().sort((a, b) => Number(a.priceUsd) - Number(b.priceUsd))[0] ?? null;
  const primaryAmount = primaryVariant?.priceAmount
    ? Number(primaryVariant.priceAmount)
    : primaryVariant?.priceUsd
      ? Number(primaryVariant.priceUsd)
      : 0;
  const primaryCurrency = (primaryVariant?.priceCurrency as "USD" | "BRL" | undefined) ?? "USD";

  const attributes = (product.variants[0]?.attributes as Record<string, unknown> | null | undefined) ?? null;
  const specEntries = attributes ? Object.entries(attributes) : [];
  const companyId = product.seller.company?.id ?? null;

  const catNameObj = product.category.name as { en?: string; pt?: string; zh?: string } | null;
  const categoryLabel = catNameObj?.[localeKey] ?? catNameObj?.en ?? product.category.slug;

  const parentCat = product.category.parent;
  const parentCatLabel = parentCat
    ? (parentCat.name as { en?: string; pt?: string; zh?: string })?.[localeKey] ??
      (parentCat.name as { en?: string })?.en ?? ""
    : null;

  let relatedProducts: ProductListRow[] = [];
  try {
    relatedProducts = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        categoryId: product.categoryId,
        id: { not: product.id },
      },
      take: 12,
      orderBy: { createdAt: "desc" },
      include: productListInclude,
    });
  } catch {
    relatedProducts = [];
  }

  function labelName(nameJson: unknown): string {
    const o = nameJson as Record<string, string> | null;
    return o?.[localeKey] ?? o?.en ?? "—";
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-6 md:py-12">
      <div className="space-y-6" data-demo-target="pdp-showcase">
      <ProductBreadcrumbs
        categoryId={product.categoryId}
        categoryLabel={categoryLabel}
        productName={name}
        homeLabel={t("breadcrumbHome")}
        categoriesHubLabel={t("breadcrumbCategories")}
        parentCategoryId={parentCat?.id}
        parentCategoryLabel={parentCatLabel ?? undefined}
      />

      <div className="space-y-6" data-demo-target="pdp-main">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-brand-dark">{name}</h1>
          <ShareButton />
        </div>
        {product.seller.company ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-brand-gray">
            <span>{product.seller.company.name}</span>
            <VerificationBadge tier={product.seller.company.verificationTier} />
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0">
          <ProductGallery images={images} alt={name} />
        </div>
        <div className="min-w-0">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <ProductPurchaseCard
              locale={params.locale}
              productId={product.id}
              variantId={primaryVariant?.id ?? null}
              productName={name}
              categoryId={product.categoryId}
              primaryAmount={primaryAmount}
              primaryCurrency={primaryCurrency}
              companyId={companyId}
              companyName={product.seller.company?.name ?? null}
              companyCountry={product.seller.company?.country ?? null}
              labels={{
                fromPrice: t("fromPrice"),
                priceHint: t("priceHint"),
                askQuotation: t("askQuotation"),
                viewSeller: t("viewSeller"),
                sellerUnknown: t("sellerUnknown"),
                sidebarTitle: t("sidebarTitle"),
                sidebarBody: t("sidebarBody"),
              }}
            />
          </aside>
        </div>
      </div>
      </div>
      </div>

      <div className="mt-2 rounded-xl bg-surface-light/30 p-4">
        <Tabs defaultValue="details">
          <TabsList className="bg-surface-light">
            <TabsTrigger value="details">{t("tabDetails")}</TabsTrigger>
            <TabsTrigger value="specs">{t("tabSpecifications")}</TabsTrigger>
            <TabsTrigger value="docs">{t("tabDocuments")}</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <Card className="shadow-card">
              <CardContent className="space-y-2 p-6 text-sm text-brand-gray">
                {description ? <p>{description}</p> : <p>{t("noDescription")}</p>}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="specs">
            <Card className="shadow-card">
              <CardContent className="p-0">
                {specEntries.length === 0 ? (
                  <div className="p-6 text-sm text-brand-gray">{t("noSpecifications")}</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("specKey")}</TableHead>
                        <TableHead>{t("specValue")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {specEntries.map(([k, v]) => (
                        <TableRow key={k}>
                          <TableCell className="font-medium text-brand-dark">{titleCase(k)}</TableCell>
                          <TableCell className="text-brand-gray">{formatSpecValue(v)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="docs">
            <Card className="shadow-card">
              <CardContent className="space-y-2 p-6 text-sm">
                {product.docs.length === 0 ? (
                  <p className="text-brand-gray">{t("noDocuments")}</p>
                ) : (
                  <ul className="space-y-2">
                    {product.docs.map((d) => (
                      <li key={d.id}>
                        <a className="font-medium text-brand-blue hover:underline" href={d.url} target="_blank" rel="noreferrer">
                          {d.name}
                        </a>
                        <span className="ml-2 text-xs text-brand-gray">{d.type}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {relatedProducts.length > 0 && (
        <section className="pt-4">
          <HorizontalRail
            title={t("relatedProducts")}
            scrollPrevLabel="Previous"
            scrollNextLabel="Next"
          >
            {relatedProducts.map((p) => {
              const v = p.variants[0];
              return (
                <RailProductCard
                  key={p.id}
                  product={{
                    id: p.id,
                    name: labelName(p.name),
                    imageUrl: p.images[0]?.url,
                    priceAmount: v?.priceAmount ? Number(v.priceAmount) : v?.priceUsd ? Number(v.priceUsd) : 0,
                    priceCurrency: ((v?.priceCurrency as string) ?? "USD") as CartPriceCurrency,
                    variantId: v?.id,
                    unit: v?.unit,
                  }}
                />
              );
            })}
          </HorizontalRail>
        </section>
      )}
    </div>
  );
}
