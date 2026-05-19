"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  DEMO_PRODUCTS_SORT_COLLAPSE_EVENT,
  DEMO_PRODUCTS_SORT_EXPAND_EVENT,
} from "@/lib/demo/demo-products-sort";
import { cn } from "@/lib/utils";

type SortSelectProps = {
  currentSort: string;
  sortUrls: Record<string, string>;
};

export function SortSelect({ currentSort, sortUrls }: SortSelectProps) {
  const t = useTranslations("productsPage");
  const locale = useLocale();
  const [demoExpanded, setDemoExpanded] = useState(false);

  useEffect(() => {
    const onExpand = () => setDemoExpanded(true);
    const onCollapse = () => setDemoExpanded(false);
    window.addEventListener(DEMO_PRODUCTS_SORT_EXPAND_EVENT, onExpand);
    window.addEventListener(DEMO_PRODUCTS_SORT_COLLAPSE_EVENT, onCollapse);
    return () => {
      window.removeEventListener(DEMO_PRODUCTS_SORT_EXPAND_EVENT, onExpand);
      window.removeEventListener(DEMO_PRODUCTS_SORT_COLLAPSE_EVENT, onCollapse);
      setDemoExpanded(false);
    };
  }, []);

  return (
    <div
      className={cn("flex gap-2", demoExpanded ? "flex-col items-stretch" : "items-center")}
      data-demo-target="products-sort"
    >
      <label htmlFor="sort-select" className="text-sm text-brand-gray">
        {t("sortLabel")}:
      </label>
      <select
        id="sort-select"
        defaultValue={currentSort}
        size={demoExpanded ? 4 : undefined}
        onChange={(e) => {
          window.location.href = `/${locale}${sortUrls[e.target.value]}`;
        }}
        className={cn(
          "rounded-md border border-border bg-white px-3 py-1.5 text-sm text-brand-dark focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue",
          demoExpanded ? "h-auto w-full max-w-xs py-1" : "pr-8",
        )}
      >
        <option value="newest">{t("sortNewest")}</option>
        <option value="price_asc">{t("sortPriceLow")}</option>
        <option value="price_desc">{t("sortPriceHigh")}</option>
      </select>
    </div>
  );
}
