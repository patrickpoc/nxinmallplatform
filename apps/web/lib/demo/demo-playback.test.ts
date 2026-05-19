import { describe, expect, it } from "vitest";
import { getAutoAdvanceDelay } from "@/lib/demo/demo-playback";
import type { DemoStep } from "@/lib/demo/demo-steps";

const baseStep: DemoStep = {
  id: "test",
  path: "/products",
  titleKey: "steps.products.title",
  bodyKey: "steps.products.body",
};

describe("getAutoAdvanceDelay", () => {
  it("halves delay at 2x speed", () => {
    const delay1 = getAutoAdvanceDelay(baseStep, false, 1);
    const delay2 = getAutoAdvanceDelay(baseStep, false, 2);
    expect(delay2).toBe(Math.round(delay1 / 2));
  });

  it("doubles delay at 0.5x speed", () => {
    const delay1 = getAutoAdvanceDelay(baseStep, false, 1);
    const delay05 = getAutoAdvanceDelay(baseStep, false, 0.5);
    expect(delay05).toBe(Math.round(delay1 / 0.5));
  });

  it("uses shorter delays on mobile surface", () => {
    const desktop = getAutoAdvanceDelay(baseStep, false, 1, "desktop");
    const mobile = getAutoAdvanceDelay(baseStep, false, 1, "mobile");
    expect(mobile).toBeLessThan(desktop);
  });
});
