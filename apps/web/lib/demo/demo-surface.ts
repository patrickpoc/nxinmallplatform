"use client";

import { useEffect, useState } from "react";

export type DemoSurface = "desktop" | "mobile";

const MOBILE_MQ = "(max-width: 767px)";

export function isDemoMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MOBILE_MQ).matches;
}

export function detectDemoSurface(): DemoSurface {
  return isDemoMobileViewport() ? "mobile" : "desktop";
}

export function useDemoSurface(): DemoSurface {
  const [surface, setSurface] = useState<DemoSurface>("desktop");

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const update = () => setSurface(mq.matches ? "mobile" : "desktop");
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return surface;
}
