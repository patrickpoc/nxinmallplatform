"use client";

import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type CategoryChip = { id: string; label: string };

type Props = {
  slug: string;
  categories: CategoryChip[];
  current: {
    q?: string;
    category?: string;
    sort?: string;
  };
};

export function FairFiltersBar({ slug, categories, current }: Props) {
  const t = useTranslations("fairBooth");
  const router = useRouter();

  function navigate(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { ...current, ...updates };
    if (merged.q) params.set("q", merged.q);
    if (merged.category) params.set("category", merged.category);
    if (merged.sort && merged.sort !== "newest") params.set("sort", merged.sort);
    const qs = params.toString();
    router.push(qs ? `/feira/${slug}?${qs}` : `/feira/${slug}`);
  }

  return (
    <div className="sticky top-14 z-30 space-y-3 rounded-lg border border-border bg-white p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <Input
          className="w-full"
          placeholder={t("searchPlaceholder")}
          defaultValue={current.q ?? ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              navigate({ q: (e.target as HTMLInputElement).value || undefined });
            }
          }}
        />
        <select
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-auto"
          value={current.sort ?? "newest"}
          onChange={(e) => navigate({ sort: e.target.value })}
        >
          <option value="newest">{t("sortNewest")}</option>
          <option value="price_asc">{t("sortPriceAsc")}</option>
          <option value="price_desc">{t("sortPriceDesc")}</option>
        </select>
      </div>
      {categories.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={!current.category ? "default" : "outline"}
            onClick={() => navigate({ category: undefined })}
          >
            {t("allCategories")}
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={current.category === c.id ? "default" : "outline"}
              onClick={() => navigate({ category: c.id })}
            >
              {c.label}
            </Button>
          ))}
        </div>
      ) : null}
      {current.q || current.category ? (
        <Button variant="ghost" size="sm" onClick={() => router.push(`/feira/${slug}`)}>
          {t("clearFilters")}
        </Button>
      ) : null}
    </div>
  );
}
