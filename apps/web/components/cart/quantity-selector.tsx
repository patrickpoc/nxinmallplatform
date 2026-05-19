"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type QuantitySelectorProps = {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  compact?: boolean;
  className?: string;
};

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 999,
  compact = false,
  className,
}: QuantitySelectorProps) {
  const clamped = Math.max(min, Math.min(max, value));

  function decrement() {
    if (clamped > min) onChange(clamped - 1);
  }

  function increment() {
    if (clamped < max) onChange(clamped + 1);
  }

  function handleInput(raw: string) {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return;
    onChange(Math.max(min, Math.min(max, n)));
  }

  const btnSize = compact ? "h-7 w-7" : "h-8 w-8";
  const iconSize = compact ? "h-3 w-3" : "h-3.5 w-3.5";
  const inputSize = compact ? "h-7 w-10 text-xs" : "h-8 w-12 text-sm";

  return (
    <div className={cn("inline-flex items-center rounded-lg border border-border", className)}>
      <button
        type="button"
        onClick={decrement}
        disabled={clamped <= min}
        className={cn(
          "flex items-center justify-center rounded-l-lg transition-colors hover:bg-surface-light disabled:cursor-not-allowed disabled:opacity-40",
          btnSize,
        )}
        aria-label="Decrease quantity"
      >
        <Minus className={iconSize} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={clamped}
        onChange={(e) => handleInput(e.target.value)}
        className={cn(
          "border-x border-border bg-transparent text-center font-medium text-brand-dark outline-none focus:ring-1 focus:ring-brand-blue/30",
          inputSize,
        )}
      />
      <button
        type="button"
        onClick={increment}
        disabled={clamped >= max}
        className={cn(
          "flex items-center justify-center rounded-r-lg transition-colors hover:bg-surface-light disabled:cursor-not-allowed disabled:opacity-40",
          btnSize,
        )}
        aria-label="Increase quantity"
      >
        <Plus className={iconSize} />
      </button>
    </div>
  );
}
