"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();

  function navigate(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { ...current, ...updates };
    if (merged.q) params.set("q", merged.q);
    if (merged.category) params.set("category", merged.category);
    if (merged.sort && merged.sort !== "newest") params.set("sort", merged.sort);
    const qs = params.toString();
    const href = qs ? `/feira/${slug}?${qs}` : `/feira/${slug}`;
    startTransition(() => router.push(href));
  }

  return (
    <div className="sticky top-14 z-30 space-y-3 rounded-lg border border-border bg-white p-3 sm:p-4">
      <div className="relative grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <Input
          className="w-full"
          placeholder={t("searchPlaceholder")}
          defaultValue={current.q ?? ""}
          disabled={isPending}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              navigate({ q: (e.target as HTMLInputElement).value || undefined });
            }
          }}
        />
        <div className="flex items-center gap-2">
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-auto"
            value={current.sort ?? "newest"}
            onChange={(e) => navigate({ sort: e.target.value })}
            disabled={isPending}
          >
            <option value="newest">{t("sortNewest")}</option>
            <option value="price_asc">{t("sortPriceAsc")}</option>
            <option value="price_desc">{t("sortPriceDesc")}</option>
          </select>
          {isPending ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-brand-blue" aria-hidden />
          ) : null}
        </div>
      </div>
      {categories.length > 0 ? (
        <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
          <Button
            size="sm"
            className="shrink-0"
            variant={!current.category ? "default" : "outline"}
            onClick={() => navigate({ category: undefined })}
            disabled={isPending}
          >
            {t("allCategories")}
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              size="sm"
              className="shrink-0"
              variant={current.category === c.id ? "default" : "outline"}
              onClick={() => navigate({ category: c.id })}
              disabled={isPending}
            >
              {c.label}
            </Button>
          ))}
        </div>
      ) : null}
      {current.q || current.category ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => startTransition(() => router.push(`/feira/${slug}`))}
        >
          {t("clearFilters")}
        </Button>
      ) : null}
    </div>
  );
}
