import { auth } from "@/auth";
import { FairProductForm } from "@/components/fair/fair-product-form";
import { prisma } from "@nxinmall/database";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function FairVendorNewProductPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const session = await auth();
  if (!session?.user) redirect(`/${params.locale}/feira-vendor/auth/login`);

  const t = await getTranslations("fairVendor");
  const [booth, categories] = await Promise.all([
    prisma.fairBooth.findUnique({
      where: { userId: session.user.id },
      select: { slug: true },
    }),
    prisma.category.findMany({
      select: { id: true, slug: true, name: true },
      orderBy: { slug: "asc" },
    }),
  ]);

  if (!booth) redirect(`/${params.locale}/feira-vendor/perfil`);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-brand-dark">{t("newProduct")}</h2>
      <FairProductForm categories={categories} />
    </div>
  );
}
