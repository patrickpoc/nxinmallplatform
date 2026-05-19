"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Pause, Play, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { DemoSpeedControl } from "@/components/demo/demo-speed-control";
import { Button } from "@/components/ui/button";
import { useDemoTourOptional } from "@/lib/demo/demo-context";
import { FINISH_FAREWELL_FADE_MS, FINISH_FAREWELL_MS } from "@/lib/demo/demo-playback";
import type { DemoPlaybackMode } from "@/lib/demo/demo-playback";
import { cn } from "@/lib/utils";

export function DemoFloatingPanelPocket() {
  const demo = useDemoTourOptional();
  const t = useTranslations("demo");
  const [farewellRemainingMs, setFarewellRemainingMs] = useState(FINISH_FAREWELL_MS);
  const [fadeOut, setFadeOut] = useState(false);
  const farewellEndRef = useRef<(() => void) | null>(null);

  const isFinishStep = demo?.currentStep.id === "finish";
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
  const title = t(step.titleKey);
  const body = t(step.bodyKey);
  const current = tour.stepIndex + 1;
  const total = tour.totalSteps;
  const progress = Math.round((current / total) * 100);
  const farewellSeconds = Math.ceil(farewellRemainingMs / 1000);
  const farewellProgress = ((FINISH_FAREWELL_MS - farewellRemainingMs) / FINISH_FAREWELL_MS) * 100;

  function setMode(nextMode: DemoPlaybackMode) {
    tour.setPlaybackMode(nextMode);
    if (nextMode === "auto") tour.resumeAuto();
  }

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
      aria-labelledby="demo-pocket-title"
      aria-describedby={expanded ? "demo-pocket-body" : undefined}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white shadow-dropdown md:hidden",
        fadeOut && "demo-panel-fade-out pointer-events-none",
      )}
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {expanded ? (
        <div className="max-h-[38dvh] overflow-y-auto border-b border-border px-3 pb-2 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-blue">{t("flowMobile")}</p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-light">
            <div className="h-full rounded-full bg-brand-blue transition-all duration-150" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-brand-gray" aria-live="polite">
            {t("stepProgress", { current: String(current), total: String(total) })}
            {tour.isResolvingTarget || tour.isNavigating ? (
              <span className="ml-1 text-brand-blue">{t("transitioning")}</span>
            ) : null}
          </p>
          <h2 id="demo-pocket-title" className="mt-1 text-sm font-bold text-brand-dark">
            {title}
          </h2>
          <p id="demo-pocket-body" className="mt-1 text-xs leading-relaxed text-brand-gray">
            {body}
          </p>

          {isFinishStep ? (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-brand-gray">{t("finishCountdown", { seconds: String(farewellSeconds) })}</p>
              <div className="h-1 overflow-hidden rounded-full bg-surface-light">
                <div
                  className="h-full rounded-full bg-brand-blue transition-all duration-200"
                  style={{ width: `${farewellProgress}%` }}
                />
              </div>
              <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => void tour.startDemo(tour.playbackMode)}>
                {t("restartTour")}
              </Button>
            </div>
          ) : (
            <>
              <div className="mt-2 flex gap-1 rounded-lg border border-border bg-surface-light p-0.5">
                <button
                  type="button"
                  onClick={() => setMode("manual")}
                  className={cn(
                    "flex-1 rounded-md py-1 text-[10px] font-medium",
                    tour.playbackMode === "manual" ? "bg-white text-brand-dark shadow-sm" : "text-brand-gray",
                  )}
                >
                  {t("modeManualShort")}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("auto")}
                  className={cn(
                    "flex-1 rounded-md py-1 text-[10px] font-medium",
                    tour.playbackMode === "auto" ? "bg-white text-brand-dark shadow-sm" : "text-brand-gray",
                  )}
                >
                  {t("modeAutoShort")}
                </button>
              </div>
              {tour.playbackMode === "auto" && !isFinishStep ? (
                <DemoSpeedControl className="mt-2" value={tour.scrollSpeed} onChange={(speed) => tour.setScrollSpeed(speed)} />
              ) : null}
            </>
          )}
        </div>
      ) : null}

      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          className="touch-target flex shrink-0 flex-col items-center justify-center rounded-md px-1 text-[10px] font-semibold text-brand-gray"
          onClick={() => tour.setPocketExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label={expanded ? t("pocket.collapse") : t("pocket.expand")}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          <span>
            {current}/{total}
          </span>
        </button>

        <p id="demo-pocket-title" className="min-w-0 flex-1 truncate text-sm font-semibold text-brand-dark">
          {title}
        </p>

        {!isFinishStep && tour.playbackMode === "auto" ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="touch-target shrink-0"
            onClick={tour.isAutoPlaying ? tour.pauseAuto : tour.resumeAuto}
            aria-label={tour.isAutoPlaying ? t("pauseAuto") : t("resumeAuto")}
          >
            {tour.isAutoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        ) : null}

        <Button
          type="button"
          size="sm"
          className="touch-target shrink-0"
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
          className="touch-target shrink-0 text-brand-gray"
          onClick={dismissFarewell}
          disabled={fadeOut}
          aria-label={t("exit")}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {expanded && !isFinishStep ? (
        <div className="flex gap-2 border-t border-border px-3 py-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => void tour.goPrev()}
            disabled={tour.stepIndex === 0 || tour.isNavigating || fadeOut}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            {t("prev")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

