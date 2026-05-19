import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEMO_STEPS_GUEST, DEMO_STEPS_LOGGED_IN } from "@/lib/demo/demo-steps";
import { assertDemoTargetsValid } from "@/lib/demo/validate-demo-targets";

describe("demo step targets", () => {
  it("every guest and logged-in step defines a target", () => {
    for (const step of [...DEMO_STEPS_GUEST, ...DEMO_STEPS_LOGGED_IN]) {
      expect(step.target, `step ${step.id} missing target`).toBeTruthy();
    }
  });

  it("every target has a matching data-demo-target in app source", () => {
    const webRoot = join(__dirname, "../..");
    expect(() => assertDemoTargetsValid(webRoot)).not.toThrow();
  });
});
