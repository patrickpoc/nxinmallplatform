import { prisma } from "@nxinmall/database";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedGrid, AnimatedGridItem } from "@/components/motion/animated-grid";

export const dynamic = "force-dynamic";

type CatRow = {
  id: string;
  slug: string;
  name: unknown;
  children: { id: string; slug: string; name: unknown }[];
};

function label(nameJson: unknown, locale: string): string {
  const o = nameJson as Record<string, string> | null;
  return o?.[locale] ?? o?.en ?? "—";
}

export default async function CategoriesPage() {
  const t = await getTranslations("categoriesPage");
  const locale = await getLocale();
  let rows: CatRow[] = [];
  try {
    rows = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: { slug: "asc" },
      include: {
        children: { orderBy: { slug: "asc" }, select: { id: true, slug: true, name: true } },
      },
    });
  } catch {
    rows = [];
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-16 md:px-6" data-demo-target="categories-page">
      <h1 className="text-3xl font-bold text-brand-dark">{t("title")}</h1>
      <AnimatedGrid className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-demo-target="categories-grid">
        {rows.map((c) => (
          <AnimatedGridItem key={c.id}>
          <Card className="h-full shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            <CardContent className="space-y-3 p-5">
              <Link
                href={`/products?category=${c.id}`}
                className="text-base font-semibold text-brand-dark hover:text-brand-blue"
              >
                {label(c.name, locale)}
              </Link>
              {c.children.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {c.children.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/products?category=${sub.id}`}
                      className="rounded-lg border border-border bg-surface-light px-3 py-1.5 text-sm text-brand-gray transition-colors hover:border-brand-blue hover:text-brand-blue"
                    >
                      {label(sub.name, locale)}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </AnimatedGridItem>
        ))}
      </AnimatedGrid>
    </div>
  );
}
