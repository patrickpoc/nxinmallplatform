import { describe, expect, it, vi } from "vitest";
import {
  capSpotlightRectForListStep,
  clipSpotlightRectToViewport,
  expandSpotlightRect,
  getFallbackTargetsForStep,
  getVisibleGridColumnCount,
  isValidSpotlightRect,
  measureDemoTargetRect,
  measureFullColumnRect,
  measureGridFirstRowRect,
  measureProductsSortRect,
  measureSellerOverviewRect,
  SPOTLIGHT_EXPAND_PX,
  unionElementsRect,
  waitForDemoTarget,
} from "@/lib/demo/demo-overlay";

describe("demo-overlay", () => {
  it("rejects null and tiny rects", () => {
    expect(isValidSpotlightRect(null)).toBe(false);
    expect(isValidSpotlightRect({ top: 0, left: 0, width: 4, height: 20 })).toBe(false);
    expect(isValidSpotlightRect({ top: 0, left: 0, width: 20, height: 8 })).toBe(true);
  });

  it("returns null when element is null", () => {
    expect(measureDemoTargetRect(null)).toBeNull();
  });

  it("categories step falls back to grid when page wrapper is primary", () => {
    expect(getFallbackTargetsForStep("categories", "categories-page")).not.toContain("search");
    expect(getFallbackTargetsForStep("categories", "categories-page")).toEqual(["categories-grid"]);
  });

  it("search step may fall back to hero only", () => {
    expect(getFallbackTargetsForStep("search", "search")).toEqual(["hero"]);
  });

  it("products falls back to sort control; sellers has no global fallbacks", () => {
    expect(getFallbackTargetsForStep("products", "products-sort")).toEqual([]);
    expect(getFallbackTargetsForStep("products", "missing-target")).toEqual(["products-sort"]);
    expect(getFallbackTargetsForStep("sellers", "sellers-page")).toEqual(["sellers-grid"]);
  });

  it("header steps fall back to triggers", () => {
    expect(getFallbackTargetsForStep("category-nav", "category-sidebar")).toEqual([
      "category-nav-trigger",
    ]);
    expect(getFallbackTargetsForStep("locale-settings", "locale-settings-zone")).toEqual([]);
    expect(getFallbackTargetsForStep("profile-menu", "profile-menu-panel")).toEqual([]);
    expect(getFallbackTargetsForStep("finish", "hero")).toEqual([]);
  });

  it("expandSpotlightRect adds padding on all sides", () => {
    const expanded = expandSpotlightRect({ top: 10, left: 20, width: 100, height: 50 });
    expect(expanded.top).toBe(10 - SPOTLIGHT_EXPAND_PX);
    expect(expanded.width).toBe(100 + SPOTLIGHT_EXPAND_PX * 2);
  });
});

describe("measureGridFirstRowRect", () => {
  class MockEl {
    constructor(
      private left: number,
      private top: number,
      private w: number,
      private h: number,
    ) {}
    getBoundingClientRect() {
      return {
        top: this.top,
        left: this.left,
        width: this.w,
        height: this.h,
        right: this.left + this.w,
        bottom: this.top + this.h,
      };
    }
  }

  it("unions only the first visible row of grid children", () => {
    vi.stubGlobal("HTMLElement", MockEl);
    vi.stubGlobal("window", { innerWidth: 1400 });
    const children = [
      new MockEl(0, 100, 200, 120),
      new MockEl(220, 100, 200, 120),
      new MockEl(440, 100, 200, 120),
      new MockEl(660, 100, 200, 120),
      new MockEl(0, 260, 200, 120),
    ];
    const grid = {
      firstElementChild: { children },
    } as unknown as HTMLElement;

    const rect = measureGridFirstRowRect(grid);
    expect(rect).not.toBeNull();
    expect(rect!.top).toBe(92);
    expect(rect!.height).toBe(136);
    expect(rect!.width).toBe(876);
    vi.unstubAllGlobals();
  });

  it("getVisibleGridColumnCount follows breakpoints", () => {
    expect(getVisibleGridColumnCount(500)).toBe(1);
    expect(getVisibleGridColumnCount(900)).toBe(2);
    expect(getVisibleGridColumnCount(1100)).toBe(3);
    expect(getVisibleGridColumnCount(1400)).toBe(4);
  });
});

describe("unionElementsRect", () => {
  it("returns null for empty list", () => {
    expect(unionElementsRect([])).toBeNull();
  });
});

describe("spotlight rect normalization", () => {
  const viewportW = 1200;
  const viewportH = 800;

  it("clips rect to viewport", () => {
    const clipped = clipSpotlightRectToViewport(
      { top: 100, left: 0, width: 1200, height: 2000 },
      viewportW,
      viewportH,
    );
    expect(clipped).toEqual({ top: 100, left: 0, width: 1200, height: 700 });
  });

  it("does not cap height for categories (full page wrapper)", () => {
    const rect = { top: 200, left: 16, width: 800, height: 1200 };
    const capped = capSpotlightRectForListStep(rect, "categories", viewportH);
    expect(capped.height).toBe(1200);
  });
});

describe("ambient and no-veil steps", () => {
  it("waitForDemoTarget returns ambient without spotlight for locale-settings", async () => {
    const result = await waitForDemoTarget("locale-settings-zone", {
      stepId: "locale-settings",
      strict: true,
      timeoutMs: 100,
    });
    expect(result.mode).toBe("ambient");
    expect(result.rect).toBeNull();
    expect(result.el).toBeNull();
  });

  it("waitForDemoTarget returns ambient for profile-menu", async () => {
    const result = await waitForDemoTarget("profile-menu-panel", {
      stepId: "profile-menu",
      strict: true,
      timeoutMs: 100,
    });
    expect(result.mode).toBe("ambient");
    expect(result.el).toBeNull();
  });

  it("waitForDemoTarget returns ambient for finish", async () => {
    const result = await waitForDemoTarget("hero", {
      stepId: "finish",
      strict: true,
      timeoutMs: 100,
    });
    expect(result.mode).toBe("ambient");
    expect(result.el).toBeNull();
  });
});

describe("measureFullColumnRect", () => {
  it("caps height at viewport bottom", () => {
    vi.stubGlobal("window", { innerWidth: 1200, innerHeight: 800 });
    const el = {
      getBoundingClientRect: () => ({
        top: 80,
        left: 100,
        width: 600,
        height: 1200,
        bottom: 1280,
        right: 700,
      }),
    } as HTMLElement;
    const rect = measureFullColumnRect(el, 8, "dashboard");
    expect(rect).not.toBeNull();
    expect(rect!.top).toBe(80 - 8 - SPOTLIGHT_EXPAND_PX);
    expect(rect!.top + rect!.height).toBeLessThanOrEqual(800);
    vi.unstubAllGlobals();
  });
});

describe("measureSellerOverviewRect", () => {
  it("aligns left edge to breadcrumb/aside column with extra left nudge", () => {
    vi.stubGlobal("window", { innerWidth: 1200, innerHeight: 900 });
    vi.stubGlobal("document", {
      querySelector: (sel: string) => {
        if (sel.includes("breadcrumb")) {
          return {
            getBoundingClientRect: () => ({
              top: 80,
              left: 24,
              width: 400,
              height: 24,
              bottom: 104,
              right: 424,
            }),
          };
        }
        if (sel.includes("sidebar")) {
          return {
            getBoundingClientRect: () => ({
              top: 120,
              left: 50,
              width: 260,
              height: 400,
              bottom: 520,
              right: 310,
            }),
            closest: (selector: string) => {
              if (selector === "aside") {
                return {
                  getBoundingClientRect: () => ({
                    top: 100,
                    left: 24,
                    width: 300,
                    height: 500,
                    bottom: 600,
                    right: 324,
                  }),
                };
              }
              return null;
            },
          };
        }
        return null;
      },
    });

    const rect = measureSellerOverviewRect(null, 6, "seller-overview");
    expect(rect).not.toBeNull();
    expect(rect!.left).toBeLessThan(40 - 14);
    expect(rect!.width).toBeGreaterThan(300);
    vi.unstubAllGlobals();
  });
});

describe("pdp fallbacks", () => {
  it("falls back to pdp-main and purchase-card when pdp-showcase is primary", () => {
    expect(getFallbackTargetsForStep("pdp", "pdp-showcase")).toEqual(["pdp-main", "purchase-card"]);
  });
});

describe("measureProductsSortRect", () => {
  it("measures expanded sort wrapper height", () => {
    const el = {
      getBoundingClientRect: () => ({
        top: 120,
        left: 400,
        width: 220,
        height: 140,
        bottom: 260,
        right: 620,
      }),
    } as HTMLElement;
    const rect = measureProductsSortRect(el, 6, "products");
    expect(rect).not.toBeNull();
    expect(rect!.height).toBeGreaterThan(130);
    expect(rect!.top).toBeLessThan(120);
  });
});
