"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Pause, Play, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useDemoTourOptional } from "@/lib/demo/demo-context";
import { FINISH_FAREWELL_FADE_MS, FINISH_FAREWELL_MS } from "@/lib/demo/demo-playback";
import { getDemoPageNameKey } from "@/lib/demo/demo-steps-mobile";
import { cn } from "@/lib/utils";

export function DemoFloatingPanelPocket() {
  const demo = useDemoTourOptional();
  const t = useTranslations("demo");
  const [farewellRemainingMs, setFarewellRemainingMs] = useState(FINISH_FAREWELL_MS);
  const [fadeOut, setFadeOut] = useState(false);
  const farewellEndRef = useRef<(() => void) | null>(null);

  const isFinishStep =
    demo?.currentStep.id === "finish" || demo?.currentStep.id === "seller-finish";
  const expanded = demo?.pocketExpanded ?? false;

  const dismissFarewell = useCallback(() => {
    setFadeOut(true);
    window.setTimeout(() => {
      demo?.exitDemo();
    }, FINISH_FAREWELL_FADE_MS);
  }, [demo]);

  useEffect(() => {
    farewellEndRef.current = dismissFarewell;
  }, [dismissFarewell]);

  useEffect(() => {
    if (!demo?.isActive || !isFinishStep || !demo.stepReady) {
      setFarewellRemainingMs(FINISH_FAREWELL_MS);
      setFadeOut(false);
      return;
    }

    setFarewellRemainingMs(FINISH_FAREWELL_MS);
    setFadeOut(false);
    const deadline = Date.now() + FINISH_FAREWELL_MS;

    const tick = () => {
      const left = Math.max(0, deadline - Date.now());
      setFarewellRemainingMs(left);
      if (left <= 0) {
        farewellEndRef.current?.();
      }
    };

    tick();
    const interval = window.setInterval(tick, 200);
    return () => window.clearInterval(interval);
  }, [demo?.isActive, demo?.stepReady, demo?.navigationEpoch, isFinishStep]);

  if (!demo?.isActive || demo.surface !== "mobile") return null;

  const tour = demo;
  const step = tour.currentStep;
  const pageName = t(getDemoPageNameKey(step));
  const title = t(step.titleKey);
  const body = t(step.bodyKey);
  const current = tour.stepIndex + 1;
  const total = tour.totalSteps;
  const farewellSeconds = Math.ceil(farewellRemainingMs / 1000);
  const farewellProgress = ((FINISH_FAREWELL_MS - farewellRemainingMs) / FINISH_FAREWELL_MS) * 100;
  const flowLabel =
    tour.persona === "seller"
      ? tour.flow === "authenticated"
        ? t("flowSeller")
        : t("flowSellerGuest")
      : tour.flow === "authenticated"
        ? t("flowAuthenticated")
        : t("flowGuest");

  function handlePrimaryAction() {
    if (tour.stepIndex >= total - 1) {
      dismissFarewell();
    } else {
      void tour.goNext();
    }
  }

  return (
    <div
      role="dialog"
      aria-labelledby="demo-pocket-page-name"
      aria-describedby="demo-pocket-body"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 flex flex-col border-t border-border bg-white shadow-dropdown md:hidden",
        fadeOut && "demo-panel-fade-out pointer-events-none",
      )}
      style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
    >
      <div className="border-b border-border px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-blue">{flowLabel}</p>
            <p id="demo-pocket-page-name" className="text-base font-bold leading-snug text-brand-dark">
              {pageName}
            </p>
            {expanded ? (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-semibold text-brand-dark">{title}</p>
                <p id="demo-pocket-body" className="text-xs leading-relaxed text-brand-gray">
                  {body}
                </p>
              </div>
            ) : (
              <p
                id="demo-pocket-body"
                className={cn("mt-1 text-xs leading-relaxed text-brand-gray", !expanded && "line-clamp-3")}
              >
                {body}
              </p>
            )}
            {isFinishStep ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-brand-gray">{t("finishCountdown", { seconds: String(farewellSeconds) })}</p>
                <div className="h-1 overflow-hidden rounded-full bg-surface-light">
                  <div
                    className="h-full rounded-full bg-brand-blue transition-all duration-200"
                    style={{ width: `${farewellProgress}%` }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => void tour.startDemo(tour.playbackMode, tour.persona ?? "buyer")}
                >
                  {t("restartTour")}
                </Button>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="touch-target shrink-0 rounded-md px-1 py-0.5 text-[10px] font-medium text-brand-blue"
            onClick={() => tour.setPocketExpanded(!expanded)}
            aria-expanded={expanded}
          >
            {expanded ? (
              <span className="flex items-center gap-0.5">
                <ChevronDown className="h-3.5 w-3.5" />
                {t("pocket.showLess")}
              </span>
            ) : (
              <span className="flex items-center gap-0.5">
                <ChevronUp className="h-3.5 w-3.5" />
                {t("pocket.showMore")}
              </span>
            )}
          </button>
        </div>
        {tour.isResolvingTarget || tour.isNavigating ? (
          <p className="mt-1 text-[10px] text-brand-blue" aria-live="polite">
            {t("transitioning")}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5 px-2 py-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="touch-target shrink-0 px-2"
          onClick={() => void tour.goPrev()}
          disabled={tour.stepIndex === 0 || tour.isNavigating || fadeOut}
          aria-label={t("prev")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="shrink-0 px-1 text-[10px] font-semibold tabular-nums text-brand-gray">
          {current}/{total}
        </span>

        {!isFinishStep && tour.playbackMode === "auto" ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="touch-target h-8 w-8 shrink-0"
            onClick={tour.isAutoPlaying ? tour.pauseAuto : tour.resumeAuto}
            aria-label={tour.isAutoPlaying ? t("pauseAuto") : t("resumeAuto")}
          >
            {tour.isAutoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        ) : (
          <div className="w-8 shrink-0" />
        )}

        <Button
          type="button"
          size="sm"
          className="touch-target min-w-0 flex-1"
          onClick={handlePrimaryAction}
          disabled={(tour.isResolvingTarget || tour.isNavigating) && !isFinishStep}
        >
          {tour.stepIndex >= total - 1 ? t("finishDismiss") : t("next")}
          {tour.stepIndex < total - 1 ? <ChevronRight className="ml-0.5 h-4 w-4" /> : null}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="touch-target h-8 w-8 shrink-0 text-brand-gray"
          onClick={dismissFarewell}
          disabled={fadeOut}
          aria-label={t("exit")}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
