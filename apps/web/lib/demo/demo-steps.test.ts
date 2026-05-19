import { describe, expect, it } from "vitest";
import { getDemoSteps, isSamePathSubSteps, type DemoStep } from "@/lib/demo/demo-steps";

describe("isSamePathSubSteps", () => {
  const bootstrap = {
    productId: "p1",
    categoryId: "c1",
    variantId: "v1",
    name: "Test",
    priceAmount: 10,
    priceCurrency: "USD" as const,
    companyId: "co1",
  };

  it("treats home overlay steps on / as same-path (desktop)", () => {
    const steps = getDemoSteps("guest", "desktop");
    const search = steps.find((s) => s.id === "search")!;
    const categoryNav = steps.find((s) => s.id === "category-nav")!;
    expect(isSamePathSubSteps(search, categoryNav, bootstrap)).toBe(true);
  });

  it("treats home overlay steps on / as same-path (mobile)", () => {
    const steps = getDemoSteps("guest", "mobile");
    const search = steps.find((s) => s.id === "search")!;
    const categoryNav = steps.find((s) => s.id === "category-nav")!;
    expect(isSamePathSubSteps(search, categoryNav, bootstrap)).toBe(true);
  });

  it("mobile guest flow is shorter than desktop", () => {
    expect(getDemoSteps("guest", "mobile").length).toBeLessThan(getDemoSteps("guest", "desktop").length);
  });

  it("treats checkout sub-steps as same-path", () => {
    const steps = getDemoSteps("authenticated");
    const address = steps.find((s) => s.id === "checkout-address")!;
    const freight = steps.find((s) => s.id === "checkout-freight")!;
    expect(isSamePathSubSteps(address, freight, bootstrap)).toBe(true);
  });

  it("treats seller profile phases as same-path", () => {
    const steps = getDemoSteps("guest");
    const overview = steps.find((s) => s.id === "seller-overview")!;
    const categories = steps.find((s) => s.id === "seller-categories")!;
    expect(isSamePathSubSteps(overview, categories, bootstrap)).toBe(true);
  });

  it("is false across different routes", () => {
    const a: DemoStep = { id: "a", path: "/products", titleKey: "x", bodyKey: "y" };
    const b: DemoStep = { id: "b", path: "/sellers", titleKey: "x", bodyKey: "y" };
    expect(isSamePathSubSteps(a, b, bootstrap)).toBe(false);
  });
});
