"use client";

import { useTranslations } from "next-intl";
import type { DemoPlaybackMode } from "@/lib/demo/demo-playback";
import { cn } from "@/lib/utils";

const MODES: DemoPlaybackMode[] = ["manual", "auto"];

type DemoPlaybackModeControlProps = {
  value: DemoPlaybackMode;
  onChange: (mode: DemoPlaybackMode) => void;
  className?: string;
};

export function DemoPlaybackModeControl({ value, onChange, className }: DemoPlaybackModeControlProps) {
  const t = useTranslations("demo");

  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-gray">
        {t("playbackModeLabel")}
      </p>
      <div
        className="flex gap-1 rounded-lg border border-border bg-surface-light p-1"
        role="radiogroup"
        aria-label={t("playbackModeLabel")}
      >
        {MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={value === mode}
            title={mode === "manual" ? t("modeManualDescription") : t("modeAutoDescription")}
            onClick={() => onChange(mode)}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              value === mode
                ? "bg-white text-brand-dark shadow-sm"
                : "text-brand-gray hover:text-brand-dark",
            )}
          >
            {mode === "manual" ? t("modeManualShort") : t("modeAutoShort")}
          </button>
        ))}
      </div>
    </div>
  );
}
