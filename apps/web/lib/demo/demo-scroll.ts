import type { DemoSurface } from "@/lib/demo/demo-surface";

export type DemoScrollSpeed = 0.5 | 1 | 1.5 | 2;

export const DEMO_SPEED_PREF_KEY = "nxinmall:demo-speed-pref";

const BASE_SCROLL_MS = 280;
const SCROLL_SETTLE_MS = 80;
const INSTANT_SPEED_THRESHOLD = 1.5;

const REVEAL_BASE_SCROLL_MS = 950;
const REVEAL_MIN_SCROLL_MS = 500;
const REVEAL_SETTLE_MS = 120;

export const DEMO_SCROLL_SPEEDS: DemoScrollSpeed[] = [0.5, 1, 1.5, 2];

export const DEMO_SCROLL_REVEAL_DELAY_MS = 1800;

const REVEAL_DELAY_BY_STEP: Record<string, number> = {
  "seller-categories": 2000,
  "checkout-address": 2000,
  "checkout-review": 2000,
};

const REVEAL_DELAY_BY_STEP_MOBILE: Record<string, number> = {
  "category-nav": 1600,
  "checkout-address": 1500,
  "checkout-review": 1500,
};

/** Bottom clearance aligned with demo target scroll-margin in globals.css */
export const DEMO_VIEWPORT_BOTTOM_MARGIN = 96;

const TOP_FIRST_STEP_IDS = new Set<string>();

/** Scroll reveal runs before the spotlight is shown (avoids measuring off-screen targets). */
const REVEAL_BEFORE_ACTIVE_STEP_IDS = new Set<string>();

export function shouldRevealBeforeActive(stepId: string): boolean {
  return REVEAL_BEFORE_ACTIVE_STEP_IDS.has(stepId);
}

export function isTopFirstDemoStep(stepId: string): boolean {
  return TOP_FIRST_STEP_IDS.has(stepId);
}

export const NO_SCROLL_REVEAL_STEP_IDS = new Set([
  "categories",
  "products",
  "pdp",
  "sellers",
  "seller-overview",
  "addresses",
  "personal",
  "account-welcome",
  "checkout-freight",
  "checkout-payment",
  "category-nav",
  "locale-settings",
  "profile-menu",
  "finish",
]);

export function shouldSkipScrollReveal(stepId: string): boolean {
  return NO_SCROLL_REVEAL_STEP_IDS.has(stepId);
}

export function isFixedViewportStep(stepId: string): boolean {
  if (stepId === "seller-categories") return false;
  if (stepId === "checkout-address" || stepId === "checkout-review") return false;
  return shouldSkipScrollReveal(stepId);
}

const SCROLL_TO_TOP_ON_ENTER_STEP_IDS = new Set([
  "dashboard",
  "checkout-address",
  "checkout-freight",
  "checkout-payment",
  "checkout-review",
]);

export function shouldScrollToTopOnStepEnter(stepId: string): boolean {
  return SCROLL_TO_TOP_ON_ENTER_STEP_IDS.has(stepId) || isTopFirstDemoStep(stepId);
}

export function getRevealScrollDelayMs(stepId: string, surface: DemoSurface = "desktop"): number {
  if (surface === "mobile") {
    return REVEAL_DELAY_BY_STEP_MOBILE[stepId] ?? 1200;
  }
  return REVEAL_DELAY_BY_STEP[stepId] ?? DEMO_SCROLL_REVEAL_DELAY_MS;
}

export function getDemoViewportBottomMargin(
  surface: DemoSurface = "desktop",
  pocketExpanded = false,
): number {
  if (surface === "mobile") {
    return pocketExpanded ? 128 : 64;
  }
  return DEMO_VIEWPORT_BOTTOM_MARGIN;
}

export function isPageScrollable(): boolean {
  if (typeof window === "undefined") return false;
  return document.documentElement.scrollHeight > window.innerHeight + 8;
}

export function elementExtendsBelowViewport(
  el: HTMLElement,
  bottomMargin = DEMO_VIEWPORT_BOTTOM_MARGIN,
): boolean {
  const r = el.getBoundingClientRect();
  return r.bottom > window.innerHeight - bottomMargin;
}

export function getRevealScrollTargetY(
  el: HTMLElement,
  bottomMargin = DEMO_VIEWPORT_BOTTOM_MARGIN,
): number {
  const r = el.getBoundingClientRect();
  const viewportH = window.innerHeight;
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewportH);
  if (r.bottom <= viewportH - bottomMargin) {
    return window.scrollY;
  }
  const targetY = window.scrollY + r.bottom - (viewportH - bottomMargin);
  return Math.max(0, Math.min(targetY, maxScroll));
}

export async function waitForDoubleFrame(): Promise<void> {
  await new Promise<void>((r) => {
    requestAnimationFrame(() => requestAnimationFrame(() => r()));
  });
}

export async function scrollToPageTop(): Promise<void> {
  if (typeof window === "undefined") return;
  window.scrollTo(0, 0);
  await waitForDoubleFrame();
}

export type ScrollToRevealOptions = {
  delayMs?: number;
  resetTop?: boolean;
  bottomMargin?: number;
  onProgress?: () => void;
  /** When false, layout sync runs only after scroll completes (smoother veil). */
  syncOnProgress?: boolean;
};

export type AnimateScrollOptions = {
  onProgress?: () => void;
  syncOnProgress?: boolean;
};

export function getRevealScrollDurationMs(speed: DemoScrollSpeed): number {
  return Math.max(REVEAL_MIN_SCROLL_MS, Math.round(REVEAL_BASE_SCROLL_MS / speed));
}

export async function waitForRevealScrollSettle(speed: DemoScrollSpeed): Promise<void> {
  const ms = Math.round(REVEAL_SETTLE_MS / speed);
  if (ms <= 0) return;
  await new Promise((r) => setTimeout(r, ms));
}

/** Waits, then scrolls the minimum amount to reveal the bottom of el (never centers). */
export async function scrollToRevealElement(
  el: HTMLElement,
  speed: DemoScrollSpeed = 1,
  options?: ScrollToRevealOptions,
): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const delayMs = options?.delayMs ?? DEMO_SCROLL_REVEAL_DELAY_MS;
  const bottomMargin = options?.bottomMargin ?? DEMO_VIEWPORT_BOTTOM_MARGIN;

  if (options?.resetTop) {
    await scrollToPageTop();
  }

  await new Promise((r) => setTimeout(r, delayMs));

  if (!isPageScrollable() || !elementExtendsBelowViewport(el, bottomMargin)) {
    return false;
  }

  const startY = window.scrollY;
  const targetY = getRevealScrollTargetY(el, bottomMargin);
  if (Math.abs(targetY - startY) < 2) return false;

  const durationMs = getRevealScrollDurationMs(speed);
  await animateScrollTo(targetY, durationMs, {
    onProgress: options?.onProgress,
    syncOnProgress: options?.syncOnProgress,
  });
  await waitForRevealScrollSettle(speed);
  options?.onProgress?.();
  return Math.abs(window.scrollY - startY) > 2;
}

export function loadPreferredScrollSpeed(): DemoScrollSpeed {
  if (typeof window === "undefined") return 1;
  try {
    const v = parseFloat(localStorage.getItem(DEMO_SPEED_PREF_KEY) ?? "1");
    if (v === 0.5 || v === 1 || v === 1.5 || v === 2) return v;
    return 1;
  } catch {
    return 1;
  }
}

export function savePreferredScrollSpeed(speed: DemoScrollSpeed) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEMO_SPEED_PREF_KEY, String(speed));
  } catch {
    // ignore
  }
}

export function getScrollDurationMs(speed: DemoScrollSpeed): number {
  if (speed >= INSTANT_SPEED_THRESHOLD) return 0;
  return BASE_SCROLL_MS / speed;
}

export function getScrollSettleMs(speed: DemoScrollSpeed): number {
  if (speed >= INSTANT_SPEED_THRESHOLD) return 0;
  return Math.round(SCROLL_SETTLE_MS / speed);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function getScrollTargetY(el: HTMLElement): number {
  const r = el.getBoundingClientRect();
  const viewportH = window.innerHeight;
  const centered = window.scrollY + r.top - (viewportH - r.height) / 2;
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewportH);
  return Math.max(0, Math.min(centered, maxScroll));
}

export function animateScrollTo(
  targetY: number,
  durationMs: number,
  options?: AnimateScrollOptions | (() => void),
): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  const opts: AnimateScrollOptions =
    typeof options === "function" ? { onProgress: options } : (options ?? {});
  const { onProgress, syncOnProgress = true } = opts;

  const startY = window.scrollY;
  const delta = targetY - startY;
  if (Math.abs(delta) < 2 || durationMs <= 0) {
    window.scrollTo(0, targetY);
    onProgress?.();
    return Promise.resolve();
  }

  let progressRaf: number | null = null;
  const scheduleProgress = () => {
    if (!syncOnProgress || !onProgress) return;
    if (progressRaf !== null) return;
    progressRaf = requestAnimationFrame(() => {
      progressRaf = null;
      onProgress();
    });
  };

  return new Promise((resolve) => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      window.scrollTo(0, startY + delta * easeInOutCubic(t));
      scheduleProgress();
      if (t < 1) requestAnimationFrame(tick);
      else {
        if (progressRaf !== null) cancelAnimationFrame(progressRaf);
        onProgress?.();
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });
}

export async function waitForScrollSettle(speed: DemoScrollSpeed): Promise<void> {
  const ms = getScrollSettleMs(speed);
  if (ms <= 0) return;
  await new Promise((r) => setTimeout(r, ms));
}

export async function scrollToElement(el: HTMLElement, speed: DemoScrollSpeed = 1): Promise<void> {
  const durationMs = getScrollDurationMs(speed);
  await animateScrollTo(getScrollTargetY(el), durationMs);
  await waitForScrollSettle(speed);
}

/** @deprecated Use waitForDemoTarget + scrollToElement */
export async function scrollToDemoTarget(
  targetId: string | undefined,
  speed: DemoScrollSpeed = 1,
): Promise<HTMLElement | null> {
  if (typeof window === "undefined" || !targetId) return null;
  const { queryDemoTarget } = await import("@/lib/demo/demo-overlay");
  const el = queryDemoTarget(targetId);
  if (!el) return null;
  await scrollToElement(el, speed);
  return el;
}
