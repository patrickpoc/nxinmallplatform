import { HorizontalRail } from "./horizontal-rail";

export function RailSkeleton({
  title,
  scrollPrevLabel,
  scrollNextLabel,
}: {
  title: string;
  scrollPrevLabel: string;
  scrollNextLabel: string;
}) {
  return (
    <HorizontalRail title={title} scrollPrevLabel={scrollPrevLabel} scrollNextLabel={scrollNextLabel}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[280px] w-[min(85vw,240px)] shrink-0 animate-pulse rounded-xl border border-border bg-surface-light sm:w-[240px]"
          aria-hidden
        />
      ))}
    </HorizontalRail>
  );
}
