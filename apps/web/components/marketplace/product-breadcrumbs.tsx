"use client";

import { ChevronRight, Home } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

type ProductBreadcrumbsProps = {
  categoryId: string;
  categoryLabel: string;
  productName: string;
  homeLabel: string;
  categoriesHubLabel: string;
  parentCategoryId?: string;
  parentCategoryLabel?: string;
};

export function ProductBreadcrumbs({
  categoryId,
  categoryLabel,
  productName,
  homeLabel,
  categoriesHubLabel,
  parentCategoryId,
  parentCategoryLabel,
}: ProductBreadcrumbsProps) {
  const t = useTranslations("product");

  const sep = (
    <li className="flex shrink-0 items-center" aria-hidden>
      <ChevronRight className="h-3.5 w-3.5 text-brand-gray/60" />
    </li>
  );

  return (
    <nav aria-label={t("breadcrumbNav")} className="text-sm text-brand-gray">
      <ol className="flex flex-wrap items-center gap-1">
        <li className="flex min-w-0 items-center gap-1">
          <Link href="/" className="inline-flex min-w-0 items-center gap-1 rounded-md px-1 py-0.5 transition-colors hover:text-brand-blue">
            <Home className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
            <span className="truncate">{homeLabel}</span>
          </Link>
        </li>
        {sep}
        <li className="flex min-w-0 items-center gap-1">
          <Link href="/categories" className="truncate rounded-md px-1 py-0.5 transition-colors hover:text-brand-blue">
            {categoriesHubLabel}
          </Link>
        </li>
        {parentCategoryId && parentCategoryLabel && (
          <>
            {sep}
            <li className="flex min-w-0 items-center gap-1">
              <Link
                href={`/products?category=${parentCategoryId}`}
                className="truncate rounded-md px-1 py-0.5 transition-colors hover:text-brand-blue"
              >
                {parentCategoryLabel}
              </Link>
            </li>
          </>
        )}
        {sep}
        <li className="flex min-w-0 items-center gap-1">
          <Link
            href={`/products?category=${categoryId}`}
            className="truncate rounded-md px-1 py-0.5 transition-colors hover:text-brand-blue"
          >
            {categoryLabel}
          </Link>
        </li>
        {sep}
        <li className="min-w-0 font-medium text-brand-dark" aria-current="page">
          <span className="line-clamp-1">{productName}</span>
        </li>
      </ol>
    </nav>
  );
}
