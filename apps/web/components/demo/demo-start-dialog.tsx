"use client";

import { PlayCircle, ShoppingBag, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDemoTourOptional } from "@/lib/demo/demo-context";
import { DemoPlaybackModeControl } from "@/components/demo/demo-playback-mode-control";
import { DemoSpeedControl } from "@/components/demo/demo-speed-control";
import {
  loadPreferredPlaybackMode,
  savePreferredPlaybackMode,
  type DemoPlaybackMode,
} from "@/lib/demo/demo-playback";
import {
  loadPreferredScrollSpeed,
  savePreferredScrollSpeed,
  type DemoScrollSpeed,
} from "@/lib/demo/demo-scroll";
import type { DemoPersona } from "@/lib/demo/demo-steps";
import { cn } from "@/lib/utils";

type DemoStartDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStarted?: () => void;
};

export function DemoStartDialog({ open, onOpenChange, onStarted }: DemoStartDialogProps) {
  const t = useTranslations("demo");
  const demo = useDemoTourOptional();
  const [persona, setPersona] = useState<DemoPersona>("buyer");
  const [mode, setMode] = useState<DemoPlaybackMode>(() => loadPreferredPlaybackMode());
  const [scrollSpeed, setScrollSpeed] = useState<DemoScrollSpeed>(() => loadPreferredScrollSpeed());
  const [starting, setStarting] = useState(false);

  async function handleStart() {
    if (!demo || demo.isActive || starting) return;
    setStarting(true);
    savePreferredPlaybackMode(mode);
    savePreferredScrollSpeed(scrollSpeed);
    onOpenChange(false);
    onStarted?.();
    await demo.startDemo(mode, persona);
    setStarting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-5 sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-brand-dark">
            <PlayCircle className="h-5 w-5 text-brand-blue" aria-hidden />
            {t("startDialogTitle")}
          </DialogTitle>
          <DialogDescription>{t("startDialogDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray">{t("personaLabel")}</p>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t("personaLabel")}>
            <button
              type="button"
              role="radio"
              aria-checked={persona === "buyer"}
              onClick={() => setPersona("buyer")}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all duration-200",
                persona === "buyer"
                  ? "border-brand-blue bg-brand-blue-50 shadow-sm"
                  : "border-border hover:border-brand-blue/40 hover:bg-surface-light",
              )}
            >
              <ShoppingBag className="h-5 w-5 text-brand-blue" aria-hidden />
              <span className="font-semibold text-brand-dark">{t("personaBuyerTitle")}</span>
              <span className="text-xs leading-relaxed text-brand-gray">{t("personaBuyerDescription")}</span>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={persona === "seller"}
              onClick={() => setPersona("seller")}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all duration-200",
                persona === "seller"
                  ? "border-brand-blue bg-brand-blue-50 shadow-sm"
                  : "border-border hover:border-brand-blue/40 hover:bg-surface-light",
              )}
            >
              <Store className="h-5 w-5 text-brand-blue" aria-hidden />
              <span className="font-semibold text-brand-dark">{t("personaSellerTitle")}</span>
              <span className="text-xs leading-relaxed text-brand-gray">{t("personaSellerDescription")}</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <DemoPlaybackModeControl value={mode} onChange={setMode} />
          {mode === "auto" ? (
            <DemoSpeedControl value={scrollSpeed} onChange={setScrollSpeed} />
          ) : null}
        </div>

        <Button type="button" className="btn-press w-full" onClick={() => void handleStart()} disabled={starting}>
          {starting ? t("starting") : t("startTour")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
