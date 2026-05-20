import { Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ProductReviewSummary } from "@/lib/marketplace/product-reviews";

type Props = {
  summary: ProductReviewSummary;
  locale: string;
};

export async function ProductReviewsSection({ summary, locale }: Props) {
  const t = await getTranslations("product");

  if (summary.count === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-surface-light/50 py-10 text-center">
        <Star className="h-8 w-8 text-brand-gray/30" aria-hidden />
        <div className="space-y-1">
          <p className="text-sm font-medium text-brand-dark">{t("noRatingYet")}</p>
          <p className="text-sm text-brand-gray">{t("noReviews")}</p>
        </div>
      </div>
    );
  }

  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 border-b border-border pb-6 sm:flex-row sm:items-start">
        <div className="shrink-0 text-center sm:text-left">
          <div className="flex items-center justify-center gap-1 sm:justify-start">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" aria-hidden />
            <p className="text-3xl font-bold tabular-nums text-brand-dark">{summary.average.toFixed(1)}</p>
          </div>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-gray">{t("tabReviews")}</p>
          <p className="mt-0.5 text-sm text-brand-gray">{t("reviewsCount", { count: summary.count })}</p>
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-gray">{t("reviewsBreakdown")}</p>
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const n = summary.distribution[star];
            const pct = summary.count > 0 ? Math.round((n / summary.count) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-right tabular-nums text-brand-gray">{star}</span>
                <Star className="h-3 w-3 shrink-0 fill-yellow-400 text-yellow-400" aria-hidden />
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-yellow-400" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right tabular-nums text-brand-gray">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <ul className="divide-y divide-border">
        {summary.reviews.map((r) => (
          <li key={r.id} className="space-y-2 py-4 first:pt-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-brand-dark">{r.authorName}</p>
              <time className="text-xs text-brand-gray" dateTime={r.createdAt.toISOString()}>
                {dateFmt.format(r.createdAt)}
              </time>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" aria-hidden />
              <span className="text-sm font-semibold tabular-nums text-brand-dark">{r.rating}</span>
            </div>
            <p className="text-sm leading-relaxed text-brand-gray">{r.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
