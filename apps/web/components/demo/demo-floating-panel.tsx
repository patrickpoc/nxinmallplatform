"use client";

import { ChevronLeft, ChevronRight, Hand, Pause, Play, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { DemoSpeedControl } from "@/components/demo/demo-speed-control";
import { Button } from "@/components/ui/button";
import { useDemoTourOptional } from "@/lib/demo/demo-context";
import { FINISH_FAREWELL_FADE_MS, FINISH_FAREWELL_MS } from "@/lib/demo/demo-playback";
import type { DemoPlaybackMode } from "@/lib/demo/demo-playback";

export function DemoFloatingPanel() {
  const demo = useDemoTourOptional();
  const t = useTranslations("demo");
  const [farewellRemainingMs, setFarewellRemainingMs] = useState(FINISH_FAREWELL_MS);
  const [fadeOut, setFadeOut] = useState(false);
  const farewellEndRef = useRef<(() => void) | null>(null);

  const isFinishStep = demo?.currentStep.id === "finish";

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

  if (!demo?.isActive) return null;

  const tour = demo;
  const step = tour.currentStep;
  const title = t(step.titleKey);
  const body = t(step.bodyKey);
  const current = tour.stepIndex + 1;
  const total = tour.totalSteps;
  const progress = Math.round((current / total) * 100);
  const flowLabel =
    tour.flow === "authenticated" ? t("flowAuthenticated") : t("flowGuest");
  const modeLabel = tour.playbackMode === "auto" ? t("modeAutoBadge") : t("modeManualBadge");
  const farewellSeconds = Math.ceil(farewellRemainingMs / 1000);
  const farewellProgress =
    ((FINISH_FAREWELL_MS - farewellRemainingMs) / FINISH_FAREWELL_MS) * 100;

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
      aria-labelledby="demo-panel-title"
      aria-describedby="demo-panel-body"
      className={`fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-border bg-white p-4 shadow-dropdown sm:left-auto sm:right-6 sm:max-w-sm ${
        fadeOut ? "demo-panel-fade-out pointer-events-none" : "transition-shadow duration-300"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-blue">{flowLabel}</p>
        <span className="text-[10px] text-brand-gray">·</span>
        <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-brand-gray">
          {tour.playbackMode === "auto" ? (
            <Sparkles className="h-3 w-3 text-brand-blue" aria-hidden />
          ) : (
            <Hand className="h-3 w-3 text-brand-blue" aria-hidden />
          )}
          {modeLabel}
        </p>
      </div>

      <div className="mb-3 h-1 overflow-hidden rounded-full bg-surface-light">
        <div
          className="h-full rounded-full bg-brand-blue transition-all duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray" aria-live="polite">
        {t("stepProgress", { current: String(current), total: String(total) })}
        {tour.isResolvingTarget || tour.isNavigating ? (
          <span className="ml-2 font-normal normal-case text-brand-blue">{t("transitioning")}</span>
        ) : null}
      </p>

      <h2 id="demo-panel-title" className="mt-2 text-base font-bold text-brand-dark">
        {title}
      </h2>
      <p id="demo-panel-body" className="mt-1 text-sm leading-relaxed text-brand-gray">
        {body}
      </p>

      {isFinishStep ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-brand-gray" aria-live="polite">
            {t("finishCountdown", { seconds: String(farewellSeconds) })}
          </p>
          <div className="h-1 overflow-hidden rounded-full bg-surface-light">
            <div
              className="h-full rounded-full bg-brand-blue transition-all duration-200 ease-linear"
              style={{ width: `${farewellProgress}%` }}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="btn-press w-full"
            onClick={() => void tour.startDemo(tour.playbackMode)}
          >
            {t("restartTour")}
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex gap-1 rounded-lg border border-border bg-surface-light p-1">
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              tour.playbackMode === "manual" ? "bg-white text-brand-dark shadow-sm" : "text-brand-gray hover:text-brand-dark"
            }`}
          >
            <Hand className="h-3.5 w-3.5" aria-hidden />
            {t("modeManualShort")}
          </button>
          <button
            type="button"
            onClick={() => setMode("auto")}
            className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              tour.playbackMode === "auto" ? "bg-white text-brand-dark shadow-sm" : "text-brand-gray hover:text-brand-dark"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {t("modeAutoShort")}
          </button>
        </div>
      )}

      {tour.playbackMode === "auto" && !isFinishStep ? (
        <DemoSpeedControl
          className="mt-3"
          value={tour.scrollSpeed}
          onChange={(speed) => tour.setScrollSpeed(speed)}
        />
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="btn-press"
          onClick={() => void tour.goPrev()}
          disabled={tour.stepIndex === 0 || tour.isNavigating || fadeOut}
        >
          <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
          {t("prev")}
        </Button>
        {tour.playbackMode === "auto" && !isFinishStep ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="btn-press"
            onClick={tour.isAutoPlaying ? tour.pauseAuto : tour.resumeAuto}
            disabled={tour.isResolvingTarget || tour.isNavigating}
            aria-label={tour.isAutoPlaying ? t("pauseAuto") : t("resumeAuto")}
          >
            {tour.isAutoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          className="btn-press flex-1"
          onClick={handlePrimaryAction}
          disabled={(tour.isResolvingTarget || tour.isNavigating) && !isFinishStep}
        >
          {tour.stepIndex >= total - 1 ? t("finishDismiss") : t("next")}
          {tour.stepIndex < total - 1 ? <ChevronRight className="ml-1 h-4 w-4" aria-hidden /> : null}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-brand-gray"
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
