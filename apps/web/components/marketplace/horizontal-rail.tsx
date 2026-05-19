"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useId, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type HorizontalRailProps = {
  title: string;
  scrollPrevLabel: string;
  scrollNextLabel: string;
  children: ReactNode;
};

/**
 * Accessible horizontal scroller for product rows (scroll-snap, no extra deps).
 */
export function HorizontalRail({ title, scrollPrevLabel, scrollNextLabel, children }: HorizontalRailProps) {
  const ref = useRef<HTMLDivElement>(null);
  const headingId = useId();

  function scrollBy(delta: number) {
    ref.current?.scrollBy({ left: delta, behavior: "smooth" });
  }

  return (
    <section className="space-y-4" aria-labelledby={headingId}>
      <div className="flex items-center justify-between gap-4">
        <h2 id={headingId} className="text-xl font-bold text-brand-dark">
          {title}
        </h2>
        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            aria-label={scrollPrevLabel}
            onClick={() => scrollBy(-320)}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            aria-label={scrollNextLabel}
            onClick={() => scrollBy(320)}
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
      <div
        ref={ref}
        className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-2 scrollbar-thin"
        style={{ scrollPaddingInline: 4 }}
      >
        {children}
      </div>
    </section>
  );
}
