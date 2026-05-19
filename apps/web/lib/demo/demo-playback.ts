import type { DemoStep } from "@/lib/demo/demo-steps";
import type { DemoSurface } from "@/lib/demo/demo-surface";
import type { DemoScrollSpeed } from "@/lib/demo/demo-scroll";

export type DemoPlaybackMode = "manual" | "auto";

export const DEMO_MODE_PREF_KEY = "nxinmall:demo-mode-pref";

/** Countdown on the finish step before the demo panel fades out (ms). */
export const FINISH_FAREWELL_MS = 10_000;

export const FINISH_FAREWELL_FADE_MS = 400;

export function loadPreferredPlaybackMode(): DemoPlaybackMode {
  if (typeof window === "undefined") return "manual";
  try {
    const v = localStorage.getItem(DEMO_MODE_PREF_KEY);
    return v === "auto" ? "auto" : "manual";
  } catch {
    return "manual";
  }
}

export function savePreferredPlaybackMode(mode: DemoPlaybackMode) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEMO_MODE_PREF_KEY, mode);
  } catch {
    // ignore
  }
}

function baseAutoAdvanceDelay(
  step: DemoStep,
  samePathAsPrevious: boolean,
  surface: DemoSurface,
): number {
  const mobile = surface === "mobile";
  if (step.onEnter === "signInDemo") return mobile ? 6500 : 9000;
  if (step.onEnter === "confirmCheckout") return mobile ? 6200 : 8500;
  if (step.onEnter === "prefillCheckout" || step.onEnter === "seedCart") return mobile ? 5500 : 7500;
  if (samePathAsPrevious) return mobile ? 3900 : 5200;
  if (step.path.includes("[id]")) return mobile ? 5200 : 6800;
  return mobile ? 4600 : 6200;
}

/** Delay before auto-advance once the step is ready (ms), scaled by scroll speed. */
export function getAutoAdvanceDelay(
  step: DemoStep,
  samePathAsPrevious: boolean,
  speed: DemoScrollSpeed = 1,
  surface: DemoSurface = "desktop",
): number {
  return Math.round(baseAutoAdvanceDelay(step, samePathAsPrevious, surface) / speed);
}
