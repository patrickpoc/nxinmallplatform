import { prisma } from "@nxinmall/database";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { notFound } from "next/navigation";
import { FairProductDetailClient } from "@/components/fair/fair-product-detail-client";
import { FairSpecValue, fairSpecKeyLabel } from "@/components/fair/fair-spec-value";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getFairBoothBySlug } from "@/lib/fair/fair-booth";
import type { CartPriceCurrency } from "@/lib/cart/types";

export const dynamic = "force-dynamic";

export default async function FairProductPage({
  params,
}: {
  params: { locale: string; slug: string; id: string };
}) {
  setRequestLocale(params.locale);
  const t = await getTranslations("fairBooth");

  const booth = await getFairBoothBySlug(params.slug);
  if (!booth) notFound();

  const product = await prisma.product.findFirst({
    where: {
      id: params.id,
      sellerId: booth.userId,
      salesChannel: "FAIR",
      status: "ACTIVE",
    },
    include: {
      variants: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!product) notFound();

  const localeKey = params.locale as "en" | "pt" | "zh";
  const nameObj = product.name as { en?: string; pt?: string; zh?: string };
  const name = nameObj?.[localeKey] ?? nameObj?.pt ?? nameObj?.en ?? "—";
  const descObj = product.description as { en?: string; pt?: string; zh?: string } | null;
  const description = descObj?.[localeKey] ?? descObj?.pt ?? descObj?.en ?? "";

  const galleryImages = product.images
    .filter((i) => i.kind === "GALLERY")
    .map((i) => ({ url: i.url }));
  const descriptionImage = product.images.find((i) => i.kind === "DESCRIPTION");

  const variants = product.variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    priceAmount: Number(v.priceAmount),
    priceCurrency: (v.priceCurrency as CartPriceCurrency) ?? "BRL",
    unit: v.unit,
    stockQty: v.stockQty,
    minOrderQty: v.minOrderQty,
    attributes: v.attributes,
  }));

  const attributes = (product.variants[0]?.attributes as Record<string, unknown> | null) ?? null;
  const specEntries = attributes ? Object.entries(attributes) : [];

  return (
    <div className="space-y-4 py-3 sm:space-y-6 sm:py-4">
      <h1 className="text-lg font-bold text-brand-dark sm:text-xl md:text-2xl">{name}</h1>

      <FairProductDetailClient
        slug={params.slug}
        productId={product.id}
        productName={name}
        galleryImages={galleryImages}
        variants={variants}
        booth={{
          quotationUrl: booth.quotationUrl,
          whatsappNumber: booth.whatsappNumber,
          phone: booth.phone,
        }}
      />

      <Tabs defaultValue="details">
        <TabsList className="grid h-auto w-full grid-cols-2">
          <TabsTrigger value="details" className="min-h-10">
            {t("tabDetails")}
          </TabsTrigger>
          <TabsTrigger value="specs" className="min-h-10">
            {t("tabSpecifications")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <Card className="shadow-card">
            <CardContent className="space-y-4 p-4 text-sm text-brand-gray sm:p-6">
              {description ? <p className="whitespace-pre-wrap">{description}</p> : <p>{t("noDescription")}</p>}
              {descriptionImage ? (
                <div className="relative mx-auto max-w-md aspect-video">
                  <Image
                    src={descriptionImage.url}
                    alt=""
                    fill
                    className="rounded-lg object-contain"
                    unoptimized
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="specs">
          <Card className="shadow-card">
            <CardContent className="p-0">
              {specEntries.length === 0 ? (
                <p className="p-6 text-sm text-brand-gray">{t("noSpecifications")}</p>
              ) : (
                <div className="overflow-x-auto">
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
                        <TableCell className="font-medium text-brand-dark">
                          {fairSpecKeyLabel(k, {
                            variantLabel: t("specVariantLabel"),
                            image: t("specImage"),
                            images: t("specImages"),
                          })}
                        </TableCell>
                        <TableCell>
                          <FairSpecValue specKey={k} value={v} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
