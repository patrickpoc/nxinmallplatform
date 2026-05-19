"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/brand/currency-display";
import { cn } from "@/lib/utils";

export type HeroSlide = {
  id: string;
  title: string;
  imageUrl: string | null;
  priceUsd: number;
  trustBadge: string;
};

type HeroProductCarouselProps = {
  slides: HeroSlide[];
  ctaLabel: string;
  prevLabel: string;
  nextLabel: string;
  goToSlideLabel: string;
};

export function HeroProductCarousel({
  slides,
  ctaLabel,
  prevLabel,
  nextLabel,
  goToSlideLabel,
}: HeroProductCarouselProps) {
  const [index, setIndex] = useState(0);
  const safeLen = slides.length;
  const current = safeLen > 0 ? slides[Math.min(index, safeLen - 1)]! : null;

  const next = useCallback(() => {
    if (safeLen === 0) return;
    setIndex((i) => (i + 1) % safeLen);
  }, [safeLen]);

  const prev = useCallback(() => {
    if (safeLen === 0) return;
    setIndex((i) => (i - 1 + safeLen) % safeLen);
  }, [safeLen]);

  useEffect(() => {
    if (safeLen <= 1) return;
    const t = setInterval(next, 7000);
    return () => clearInterval(t);
  }, [next, safeLen]);

  if (!current) {
    return (
      <div className="rounded-xl border border-border bg-surface-light px-6 py-16 text-center text-brand-gray">
        —
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-surface-light to-white shadow-card">
      <div className="grid gap-8 p-6 md:grid-cols-2 md:p-10">
        <div className="relative aspect-[4/3] max-h-[320px] w-full overflow-hidden rounded-lg bg-white md:max-h-none">
          {current.imageUrl ? (
            <Image
              src={current.imageUrl}
              alt=""
              fill
              className="object-contain p-4"
              sizes="(max-width: 768px) 100vw, 50vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center bg-surface-light text-sm text-brand-gray">
              —
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center gap-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">{current.trustBadge}</p>
          <h1 className="text-2xl font-bold leading-tight text-brand-dark md:text-3xl">{current.title}</h1>
          <p className="text-lg text-brand-gray">
            <CurrencyDisplay amountUsd={current.priceUsd} />
          </p>
          <Button asChild size="lg" className="w-fit">
            <Link href={`/products/${current.id}`}>{ctaLabel}</Link>
          </Button>
        </div>
      </div>
      {safeLen > 1 ? (
        <>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`${goToSlideLabel} ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-colors",
                  i === index ? "bg-brand-blue" : "bg-border hover:bg-brand-gray/40",
                )}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute left-2 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full shadow-md"
            aria-label={prevLabel}
            onClick={prev}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-2 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full shadow-md"
            aria-label={nextLabel}
            onClick={next}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      ) : null}
    </div>
  );
}
