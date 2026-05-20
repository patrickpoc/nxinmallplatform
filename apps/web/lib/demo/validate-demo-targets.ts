import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { getDemoSteps, type DemoFlow, type DemoPersona } from "@/lib/demo/demo-steps";
import type { DemoSurface } from "@/lib/demo/demo-surface";

function walkSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walkSourceFiles(full, acc);
    } else if (/\.(tsx|ts)$/.test(name)) {
      acc.push(full);
    }
  }
  return acc;
}

export type DemoTargetAuditIssue = {
  stepId: string;
  target?: string;
  reason: "missing_target" | "missing_dom_marker";
};

export function collectDemoTargetAuditIssues(
  sourceRoot: string,
  personas: DemoPersona[] = ["buyer", "seller"],
  flows: DemoFlow[] = ["guest", "authenticated"],
  surfaces: DemoSurface[] = ["desktop", "mobile"],
): DemoTargetAuditIssue[] {
  const files = walkSourceFiles(sourceRoot);
  const source = files.map((f) => readFileSync(f, "utf8")).join("\n");
  const issues: DemoTargetAuditIssue[] = [];
  const seen = new Set<string>();

  for (const persona of personas) {
    const flowsToRun: DemoFlow[] = persona === "seller" ? ["guest"] : flows;
    for (const flow of flowsToRun) {
      for (const surface of surfaces) {
        for (const step of getDemoSteps(persona, flow, surface)) {
          const key = `${persona}:${flow}:${surface}:${step.id}`;
          if (seen.has(key)) continue;
          seen.add(key);

          if (!step.target) {
            issues.push({ stepId: step.id, reason: "missing_target" });
            continue;
          }
          const marker = `data-demo-target="${step.target}"`;
          if (!source.includes(marker)) {
            issues.push({ stepId: step.id, target: step.target, reason: "missing_dom_marker" });
          }
        }
      }
    }
  }

  return issues;
}

export function auditDemoTargets(sourceRoot = process.cwd()): DemoTargetAuditIssue[] {
  return collectDemoTargetAuditIssues(sourceRoot);
}

export function assertDemoTargetsValid(sourceRoot = process.cwd()) {
  const issues = auditDemoTargets(sourceRoot);
  if (issues.length > 0) {
    const msg = issues
      .map((i) =>
        i.reason === "missing_target"
          ? `${i.stepId}: no target in demo-steps`
          : `${i.stepId}: missing ${i.target} in source`,
      )
      .join("\n");
    throw new Error(`Demo target audit failed:\n${msg}`);
  }
}
