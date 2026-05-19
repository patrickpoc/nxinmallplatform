"use client";



import { useCallback, useEffect, useRef, useState } from "react";

import {

  DIM_OPACITY,

  getFallbackTargetsForStep,

  getMeasurePadding,

  HEADER_OVERLAY_ENTER_DELAY_MS,

  HEADER_OVERLAY_STEP_IDS,

  isNoVeilStep,

  measureDemoTargetRect,

  PENDING_DIM_OPACITY,

  TARGET_WAIT_MS,

  type SpotlightRect,

  waitForDemoTarget,

} from "@/lib/demo/demo-overlay";

import { bindLayoutSync } from "@/lib/demo/demo-layout-sync";

import {

  getDemoViewportBottomMargin,
  getRevealScrollDelayMs,

  scrollToPageTop,

  scrollToRevealElement,

  shouldRevealBeforeActive,

  shouldScrollToTopOnStepEnter,

  shouldSkipScrollReveal,

  waitForDoubleFrame,

} from "@/lib/demo/demo-scroll";

import { useDemoTourOptional } from "@/lib/demo/demo-context";



type OverlayMode = "pending" | "active" | "ambient";



function DemoVeil({

  rect,

  opacity,

}: {

  rect: SpotlightRect | null;

  opacity: number;

}) {

  if (!rect) {

    return (

      <div

        className="demo-veil-full pointer-events-none fixed inset-0 z-[45]"

        style={{ backgroundColor: `rgba(0,0,0,${opacity})` }}

        aria-hidden

      />

    );

  }



  return (

    <div

      className="demo-veil-hole pointer-events-none fixed z-[45]"

      style={

        {

          top: rect.top,

          left: rect.left,

          width: rect.width,

          height: rect.height,

          "--demo-veil-opacity": String(opacity),

        } as React.CSSProperties

      }

      aria-hidden

    />

  );

}



export function DemoOverlay() {

  const demo = useDemoTourOptional();

  const [rect, setRect] = useState<SpotlightRect | null>(null);

  const [mode, setMode] = useState<OverlayMode>("pending");

  const rafSyncRef = useRef<number | null>(null);

  const measureElRef = useRef<HTMLElement | null>(null);

  const layoutSyncCleanupRef = useRef<(() => void) | null>(null);



  const target = demo?.isActive ? demo.currentStep.target : undefined;

  const stepId = demo?.currentStep.id;

  const speed = demo?.scrollSpeed ?? 1;

  const tourSurface = demo?.surface ?? "desktop";

  const bottomMargin = getDemoViewportBottomMargin(tourSurface, demo?.pocketExpanded ?? false);

  const navigationEpoch = demo?.navigationEpoch ?? 0;



  const measureFromElement = useCallback(

    (el: HTMLElement | null) => {

      if (!el || !stepId) return null;

      return measureDemoTargetRect(el, getMeasurePadding(stepId), stepId, target);

    },

    [stepId, target],

  );



  const scheduleLayoutSync = useCallback(() => {

    if (rafSyncRef.current !== null) return;

    rafSyncRef.current = requestAnimationFrame(() => {

      rafSyncRef.current = null;

      const el = measureElRef.current;

      if (!el) return;

      const next = measureFromElement(el);

      if (next) setRect(next);

    });

  }, [measureFromElement]);



  const clearLayoutSync = useCallback(() => {

    layoutSyncCleanupRef.current?.();

    layoutSyncCleanupRef.current = null;

  }, []);



  useEffect(() => {

    if (!demo?.isActive || !stepId) {

      setRect(null);

      setMode("pending");

      measureElRef.current = null;

      clearLayoutSync();

      demo?.setActiveDemoTargetId(null);

      demo?.setResolvingTarget(false);

      return;

    }



    let cancelled = false;

    const epoch = navigationEpoch;



    const run = async () => {

      setMode("pending");

      setRect(null);

      measureElRef.current = null;

      clearLayoutSync();

      demo.setActiveDemoTargetId(null);

      demo.setResolvingTarget(true);

      if (HEADER_OVERLAY_STEP_IDS.has(stepId)) {
        await new Promise((r) => setTimeout(r, HEADER_OVERLAY_ENTER_DELAY_MS));
      }

      const resolved = await waitForDemoTarget(target, {

        strict: true,

        stepId,

        fallbackIds: getFallbackTargetsForStep(stepId, target),

        timeoutMs: TARGET_WAIT_MS,

      });

      if (cancelled || demo.navigationEpoch !== epoch) return;



      if (resolved.el) {

        if (shouldScrollToTopOnStepEnter(stepId)) {

          await scrollToPageTop();

        } else {

          await waitForDoubleFrame();

        }

        if (cancelled || demo.navigationEpoch !== epoch) return;

        const el = resolved.el;

        if (stepId === "sellers" || stepId === "categories") {
          el.scrollIntoView({ block: "start", behavior: "instant" });
          await waitForDoubleFrame();
        }

        if (shouldRevealBeforeActive(stepId)) {

          await scrollToRevealElement(el, speed, {

            resetTop: false,

            delayMs: getRevealScrollDelayMs(stepId, tourSurface),

            bottomMargin,

            onProgress: scheduleLayoutSync,

            syncOnProgress: false,

          });

          if (cancelled || demo.navigationEpoch !== epoch) return;

        }

        measureElRef.current = el;

        layoutSyncCleanupRef.current = bindLayoutSync(el, scheduleLayoutSync);

        const freshRect = measureFromElement(el);

        if (cancelled || demo.navigationEpoch !== epoch) return;

        const id = resolved.resolvedTargetId ?? target ?? null;

        demo.setActiveDemoTargetId(id);

        setRect(freshRect ?? resolved.rect);

        setMode(resolved.mode);

        demo.setResolvingTarget(false);

        demo.markStepReady();

        if (!shouldSkipScrollReveal(stepId) && !shouldRevealBeforeActive(stepId)) {

          void scrollToRevealElement(el, speed, {

            resetTop: false,

            delayMs: getRevealScrollDelayMs(stepId, tourSurface),

            bottomMargin,

            onProgress: scheduleLayoutSync,

            syncOnProgress: false,

          }).then((scrolled) => {

            if (cancelled || demo.navigationEpoch !== epoch) return;

            if (scrolled) {

              const afterReveal = measureFromElement(el);

              if (afterReveal) setRect(afterReveal);

            }

          });

        }

        return;

      }



      const id = resolved.resolvedTargetId ?? null;

      demo.setActiveDemoTargetId(id);

      setRect(resolved.rect);

      setMode(resolved.mode);

      demo.setResolvingTarget(false);

      demo.markStepReady();

    };



    const timer = window.setTimeout(() => {

      void run();

    }, 50);



    return () => {

      cancelled = true;

      window.clearTimeout(timer);

      demo.setResolvingTarget(false);

      clearLayoutSync();

      if (rafSyncRef.current !== null) {

        cancelAnimationFrame(rafSyncRef.current);

        rafSyncRef.current = null;

      }

    };

  }, [

    demo?.isActive,

    demo?.markStepReady,

    demo?.setActiveDemoTargetId,

    demo?.setResolvingTarget,

    demo?.navigationEpoch,

    stepId,

    target,

    speed,

    demo?.stepIndex,

    navigationEpoch,

    measureFromElement,

    scheduleLayoutSync,

    clearLayoutSync,

  ]);



  useEffect(() => {

    if (!demo?.isActive) return;

    const onResize = () => scheduleLayoutSync();

    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);

  }, [demo?.isActive, scheduleLayoutSync]);



  if (!demo?.isActive) return null;

  if (stepId && isNoVeilStep(stepId)) return null;

  const isPending = mode === "pending";

  const dimOpacity = isPending ? PENDING_DIM_OPACITY : mode === "active" ? DIM_OPACITY : PENDING_DIM_OPACITY;

  const showHole = mode === "active" && rect;



  return <DemoVeil rect={showHole ? rect : null} opacity={dimOpacity} />;

}


