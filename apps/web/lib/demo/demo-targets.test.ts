import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getDemoSteps } from "@/lib/demo/demo-steps";
import { assertDemoTargetsValid } from "@/lib/demo/validate-demo-targets";

describe("demo step targets", () => {
  it("every buyer and seller step defines a target (desktop and mobile)", () => {
    for (const step of [
      ...getDemoSteps("buyer", "guest", "desktop"),
      ...getDemoSteps("buyer", "authenticated", "desktop"),
      ...getDemoSteps("buyer", "guest", "mobile"),
      ...getDemoSteps("buyer", "authenticated", "mobile"),
      ...getDemoSteps("seller", "guest", "desktop"),
      ...getDemoSteps("seller", "guest", "mobile"),
    ]) {
      expect(step.target, `step ${step.id} missing target`).toBeTruthy();
    }
  });

  it("every target has a matching data-demo-target in app source", () => {
    const webRoot = join(__dirname, "../..");
    expect(() => assertDemoTargetsValid(webRoot)).not.toThrow();
  });
});
