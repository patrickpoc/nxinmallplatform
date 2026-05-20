import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEMO_VIEWPORT_BOTTOM_MARGIN,
  elementExtendsBelowViewport,
  getRevealScrollDelayMs,
  getRevealScrollDurationMs,
  getRevealScrollTargetY,
  getScrollDurationMs,
  getScrollSettleMs,
  isFixedViewportStep,
  isTopFirstDemoStep,
  shouldRevealBeforeActive,
  shouldScrollToTopOnStepEnter,
  shouldSkipScrollReveal,
} from "@/lib/demo/demo-scroll";

describe("demo-scroll speed", () => {
  it("scales duration inversely with speed", () => {
    expect(getScrollDurationMs(0.5)).toBe(560);
    expect(getScrollDurationMs(1)).toBe(280);
    expect(getScrollDurationMs(1.5)).toBe(0);
    expect(getScrollDurationMs(2)).toBe(0);
  });

  it("scales settle time inversely with speed", () => {
    expect(getScrollSettleMs(0.5)).toBe(160);
    expect(getScrollSettleMs(1)).toBe(80);
    expect(getScrollSettleMs(2)).toBe(0);
  });
});

describe("reveal scroll duration", () => {
  it("uses slower base and enforces minimum at high speed", () => {
    expect(getRevealScrollDurationMs(1)).toBe(950);
    expect(getRevealScrollDurationMs(2)).toBe(500);
    expect(getRevealScrollDurationMs(0.5)).toBe(1900);
  });
});

describe("shouldSkipScrollReveal", () => {
  it("skips reveal for catalog, account, checkout freight and header steps", () => {
    expect(shouldSkipScrollReveal("products")).toBe(true);
    expect(shouldSkipScrollReveal("seller-overview")).toBe(true);
    expect(shouldSkipScrollReveal("addresses")).toBe(true);
    expect(shouldSkipScrollReveal("checkout-freight")).toBe(true);
    expect(shouldSkipScrollReveal("category-nav")).toBe(true);
    expect(shouldSkipScrollReveal("locale-settings")).toBe(true);
    expect(shouldSkipScrollReveal("profile-menu")).toBe(true);
  });

  it("allows reveal for welcome only; skips categories, sellers and pdp", () => {
    expect(shouldSkipScrollReveal("welcome")).toBe(false);
    expect(shouldSkipScrollReveal("welcome", "mobile")).toBe(true);
    expect(shouldSkipScrollReveal("categories")).toBe(true);
    expect(shouldSkipScrollReveal("sellers")).toBe(true);
    expect(shouldSkipScrollReveal("pdp")).toBe(true);
  });
});

describe("shouldRevealBeforeActive", () => {
  it("is false for catalog steps", () => {
    expect(shouldRevealBeforeActive("sellers")).toBe(false);
    expect(shouldRevealBeforeActive("categories")).toBe(false);
    expect(shouldRevealBeforeActive("products")).toBe(false);
  });
});

describe("isFixedViewportStep", () => {
  it("includes skipped reveal steps but not checkout address/review", () => {
    expect(isFixedViewportStep("checkout-address")).toBe(false);
    expect(isFixedViewportStep("checkout-freight")).toBe(true);
    expect(isFixedViewportStep("search")).toBe(false);
    expect(isFixedViewportStep("seller-categories")).toBe(false);
  });
});

describe("shouldScrollToTopOnStepEnter", () => {
  it("scrolls to top on dashboard and checkout steps, not account-welcome or finish", () => {
    expect(shouldScrollToTopOnStepEnter("finish")).toBe(false);
    expect(shouldScrollToTopOnStepEnter("account-welcome")).toBe(false);
    expect(shouldScrollToTopOnStepEnter("dashboard")).toBe(true);
    expect(shouldScrollToTopOnStepEnter("checkout-address")).toBe(true);
    expect(shouldScrollToTopOnStepEnter("checkout-review")).toBe(true);
  });
});

describe("getRevealScrollDelayMs", () => {
  it("uses longer delay for seller category steps", () => {
    expect(getRevealScrollDelayMs("categories")).toBe(1800);
    expect(getRevealScrollDelayMs("seller-categories")).toBe(2000);
    expect(getRevealScrollDelayMs("welcome")).toBe(1800);
  });
});

describe("isTopFirstDemoStep", () => {
  it("is false for catalog steps", () => {
    expect(isTopFirstDemoStep("products")).toBe(false);
    expect(isTopFirstDemoStep("sellers")).toBe(false);
    expect(isTopFirstDemoStep("categories")).toBe(false);
  });

  it("is false for header and detail steps", () => {
    expect(isTopFirstDemoStep("search")).toBe(false);
    expect(isTopFirstDemoStep("welcome")).toBe(false);
    expect(isTopFirstDemoStep("seller-overview")).toBe(false);
  });
});

describe("getRevealScrollTargetY", () => {
  const viewportH = 800;

  beforeEach(() => {
    vi.stubGlobal("window", {
      scrollY: 0,
      innerHeight: viewportH,
    });
    vi.stubGlobal("document", {
      documentElement: { scrollHeight: 3000 },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockEl(bottom: number, top = 100) {
    return {
      getBoundingClientRect: () => ({
        top,
        left: 0,
        width: 400,
        height: bottom - top,
        bottom,
        right: 400,
      }),
    } as HTMLElement;
  }

  it("keeps scrollY when target fits in viewport", () => {
    const el = mockEl(viewportH - DEMO_VIEWPORT_BOTTOM_MARGIN - 10);
    expect(getRevealScrollTargetY(el)).toBe(0);
  });

  it("scrolls minimum to reveal bottom when target extends below", () => {
    const bottom = viewportH + 200;
    const el = mockEl(bottom);
    const targetY = getRevealScrollTargetY(el);
    expect(targetY).toBe(bottom - (viewportH - DEMO_VIEWPORT_BOTTOM_MARGIN));
    expect(targetY).toBeGreaterThan(0);
  });
});

describe("elementExtendsBelowViewport", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { innerHeight: 800 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("detects when bottom exceeds viewport margin", () => {
    const el = {
      getBoundingClientRect: () => ({ bottom: 750 }),
    } as HTMLElement;
    expect(elementExtendsBelowViewport(el)).toBe(true);

    const visible = {
      getBoundingClientRect: () => ({ bottom: 600 }),
    } as HTMLElement;
    expect(elementExtendsBelowViewport(visible)).toBe(false);
  });
});
