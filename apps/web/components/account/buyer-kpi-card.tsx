import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BuyerKpiCardProps = {
  label: string;
  value: ReactNode;
  /** Full value for tooltip when value is a formatted string */
  valueTitle?: string;
  icon: ReactNode;
  iconClassName?: string;
  valueClassName?: string;
  className?: string;
};

export function BuyerKpiCard({
  label,
  value,
  valueTitle,
  icon,
  iconClassName,
  valueClassName,
  className,
}: BuyerKpiCardProps) {
  const valueIsString = typeof value === "string";

  return (
    <Card className={cn("shadow-card", className)}>
      <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11",
            iconClassName,
          )}
        >
          {icon}
        </div>
        <div className="w-full min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-gray sm:text-xs">{label}</p>
          <p
            className={cn(
              "mt-1 w-full max-w-full overflow-x-auto text-sm font-bold tabular-nums leading-snug text-brand-dark [scrollbar-width:none] sm:text-base lg:text-lg [&::-webkit-scrollbar]:hidden",
              valueClassName,
            )}
            title={valueTitle ?? (valueIsString ? value : undefined)}
          >
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
