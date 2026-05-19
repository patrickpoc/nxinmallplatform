"use client";

import { useTranslations } from "next-intl";
import { DEMO_SCROLL_SPEEDS, type DemoScrollSpeed } from "@/lib/demo/demo-scroll";
import { cn } from "@/lib/utils";

type DemoSpeedControlProps = {
  value: DemoScrollSpeed;
  onChange: (speed: DemoScrollSpeed) => void;
  className?: string;
};

const SPEED_LABEL_KEYS: Record<DemoScrollSpeed, "speed05" | "speed10" | "speed15" | "speed20"> = {
  0.5: "speed05",
  1: "speed10",
  1.5: "speed15",
  2: "speed20",
};

export function DemoSpeedControl({ value, onChange, className }: DemoSpeedControlProps) {
  const t = useTranslations("demo");

  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-gray">
        {t("speedSectionTitle")}
      </p>
      <div
        className="flex gap-1 rounded-lg border border-border bg-surface-light p-1"
        role="radiogroup"
        aria-label={t("speedSectionTitle")}
      >
        {DEMO_SCROLL_SPEEDS.map((speed) => (
          <button
            key={speed}
            type="button"
            role="radio"
            aria-checked={value === speed}
            onClick={() => onChange(speed)}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              value === speed
                ? "bg-white text-brand-dark shadow-sm"
                : "text-brand-gray hover:text-brand-dark",
            )}
          >
            {t(SPEED_LABEL_KEYS[speed])}
          </button>
        ))}
      </div>
    </div>
  );
}
