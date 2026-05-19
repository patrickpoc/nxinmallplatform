export type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export const DIM_OPACITY = 0.45;
export const PENDING_DIM_OPACITY = 0.25;
export const MIN_SPOTLIGHT_SIZE = 8;
export const TARGET_WAIT_MS = 3000;
export const STRICT_POLL_MS = 40;
/** Extra inset so the square hole slightly exceeds the target block. */
export const SPOTLIGHT_EXPAND_PX = 14;
/** Nudge seller-overview spotlight left to align with breadcrumb column edge. */
export const SELLER_OVERVIEW_LEFT_EXTRA_PX = 10;

export const HEADER_OVERLAY_STEP_IDS = new Set(["category-nav"]);

/** Steps that use a full-page dim veil with no spotlight hole. */
export const AMBIENT_ONLY_STEP_IDS = new Set(["locale-settings", "profile-menu"]);

/** Steps with no overlay at all (fully clear page). */
export const NO_VEIL_STEP_IDS = new Set(["finish"]);

export function isNoVeilStep(stepId: string): boolean {
  return NO_VEIL_STEP_IDS.has(stepId);
}

export const HEADER_OVERLAY_ENTER_DELAY_MS = 380;

/** Never use search/hero as global fallbacks — search exists on every page and steals the spotlight. */
const STEP_FALLBACKS: Record<string, string[]> = {
  welcome: [],
  search: ["hero"],
  "category-nav": ["category-nav-trigger"],
  "locale-settings": [],
  "profile-menu": [],
  categories: ["categories-grid"],
  products: ["products-sort"],
  sellers: ["sellers-grid"],
  pdp: ["pdp-main", "purchase-card"],
  finish: [],
  "checkout-address": ["checkout-form", "checkout-address-form"],
};

const STEP_MEASURE_PADDING: Record<string, number> = {
  "checkout-address": 4,
  "checkout-freight": 4,
  "checkout-payment": 4,
  "checkout-review": 4,
  products: 6,
  "products-sort": 6,
  "profile-menu": 10,
  "seller-overview": 6,
  finish: 12,
  hero: 12,
};

export function getMeasurePadding(stepId?: string): number {
  if (stepId && stepId in STEP_MEASURE_PADDING) {
    return STEP_MEASURE_PADDING[stepId]!;
  }
  return 8;
}

export function isValidSpotlightRect(rect: SpotlightRect | null): boolean {
  if (!rect) return false;
  return rect.width >= MIN_SPOTLIGHT_SIZE && rect.height >= MIN_SPOTLIGHT_SIZE;
}

const LIST_STEP_IDS = new Set<string>();
const LIST_SPOTLIGHT_MAX_VIEWPORT_RATIO = 0.5;
const GRID_FIRST_ROW_STEP_IDS = new Set<string>();

const FULL_COLUMN_STEP_IDS = new Set(["account-welcome", "dashboard"]);

export function unionElementsRect(
  nodes: Element[],
  padding = 8,
): SpotlightRect | null {
  if (nodes.length === 0) return null;

  let top = Infinity;
  let left = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;

  for (const node of nodes) {
    const r = node.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    top = Math.min(top, r.top);
    left = Math.min(left, r.left);
    right = Math.max(right, r.right);
    bottom = Math.max(bottom, r.bottom);
  }

  if (!Number.isFinite(top)) return null;

  return {
    top: top - padding,
    left: left - padding,
    width: right - left + padding * 2,
    height: bottom - top + padding * 2,
  };
}

export function getVisibleGridColumnCount(viewportW = typeof window !== "undefined" ? window.innerWidth : 1200): number {
  if (viewportW >= 1280) return 4;
  if (viewportW >= 1024) return 3;
  if (viewportW >= 768) return 2;
  return 1;
}

export function measureGridFirstRowRect(
  gridRoot: HTMLElement,
  padding = 8,
): SpotlightRect | null {
  const grid =
    gridRoot.firstElementChild ??
    gridRoot.querySelector(".grid") ??
    gridRoot;
  const children = Array.from(grid.children).filter(
    (c) => c instanceof HTMLElement && c.getBoundingClientRect().height > 1,
  ) as HTMLElement[];
  if (children.length === 0) return null;

  const cols = getVisibleGridColumnCount();
  const firstRow = children.slice(0, cols);
  return unionElementsRect(firstRow, padding);
}

export function clipSpotlightRectToViewport(
  rect: SpotlightRect,
  viewportW = typeof window !== "undefined" ? window.innerWidth : 0,
  viewportH = typeof window !== "undefined" ? window.innerHeight : 0,
): SpotlightRect | null {
  if (viewportW <= 0 || viewportH <= 0) return rect;

  const top = Math.max(0, rect.top);
  const left = Math.max(0, rect.left);
  const right = Math.min(viewportW, rect.left + rect.width);
  const bottom = Math.min(viewportH, rect.top + rect.height);

  if (right <= left || bottom <= top) return null;

  return {
    top,
    left,
    width: right - left,
    height: bottom - top,
  };
}

export function capSpotlightRectForListStep(
  rect: SpotlightRect,
  stepId: string,
  viewportH = typeof window !== "undefined" ? window.innerHeight : 0,
): SpotlightRect {
  if (!LIST_STEP_IDS.has(stepId) || viewportH <= 0) return rect;

  const maxHeight = viewportH * LIST_SPOTLIGHT_MAX_VIEWPORT_RATIO;
  if (rect.height <= maxHeight) return rect;

  return {
    ...rect,
    height: maxHeight,
  };
}

export function expandSpotlightRect(rect: SpotlightRect, extra = SPOTLIGHT_EXPAND_PX): SpotlightRect {
  return {
    top: rect.top - extra,
    left: rect.left - extra,
    width: rect.width + extra * 2,
    height: rect.height + extra * 2,
  };
}

export function normalizeSpotlightRect(
  raw: SpotlightRect,
  stepId?: string,
): SpotlightRect | null {
  const expanded = expandSpotlightRect(raw);
  let capped = stepId ? capSpotlightRectForListStep(expanded, stepId) : expanded;
  const clipped = clipSpotlightRectToViewport(capped);
  if (!clipped || !isValidSpotlightRect(clipped)) return null;
  return clipped;
}

export function measureLocaleSettingsZoneRect(padding?: number): {
  el: HTMLElement | null;
  rect: SpotlightRect | null;
} {
  const trigger = queryDemoTarget("locale-settings-trigger");
  const exchange = queryDemoTarget("locale-exchange-rate");
  const nodes = [trigger, exchange].filter(Boolean) as HTMLElement[];
  const pad = padding ?? getMeasurePadding("locale-settings");
  const rect = unionElementsRect(nodes, pad);
  if (!rect || !trigger) return { el: null, rect: null };
  return { el: trigger, rect: normalizeSpotlightRect(rect, "locale-settings") };
}

export function measureFullColumnRect(
  el: HTMLElement,
  padding = 8,
  stepId?: string,
): SpotlightRect | null {
  const r = el.getBoundingClientRect();
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 0;
  const top = r.top - padding;
  const left = r.left - padding;
  const width = r.width + padding * 2;
  const bottom = viewportH > 0 ? Math.min(r.bottom + padding, viewportH) : r.bottom + padding;
  const height = bottom - top;
  if (height < MIN_SPOTLIGHT_SIZE) return null;
  return normalizeSpotlightRect({ top, left, width, height }, stepId);
}

export function measureSellerOverviewRect(
  _el: HTMLElement | null,
  padding = 8,
  stepId?: string,
): SpotlightRect | null {
  const breadcrumb = queryDemoTarget("seller-profile-breadcrumb");
  const sidebar = queryDemoTarget("seller-profile-sidebar");
  const nodes = [breadcrumb, sidebar].filter(Boolean) as HTMLElement[];
  if (nodes.length === 0) return null;

  const union = unionElementsRect(nodes, padding);
  if (!union) return null;

  const aside = sidebar?.closest("aside") as HTMLElement | null;
  const asideR = aside?.getBoundingClientRect();
  const breadcrumbR = breadcrumb?.getBoundingClientRect();

  const leftEdge = Math.min(
    breadcrumbR?.left ?? asideR?.left ?? union.left,
    asideR?.left ?? breadcrumbR?.left ?? union.left,
  );

  const raw: SpotlightRect = {
    top: union.top,
    left: leftEdge - padding - SELLER_OVERVIEW_LEFT_EXTRA_PX,
    width: (asideR?.width ?? union.width) + padding * 2 + SELLER_OVERVIEW_LEFT_EXTRA_PX,
    height: union.height,
  };
  return normalizeSpotlightRect(raw, stepId);
}

export function measureProfileMenuRect(padding?: number): {
  el: HTMLElement | null;
  rect: SpotlightRect | null;
} {
  const trigger = queryDemoTarget("profile-menu-trigger");
  const panel = queryDemoTarget("profile-menu-panel");
  const pad = padding ?? getMeasurePadding("profile-menu");
  const nodes = [trigger, panel].filter(Boolean) as HTMLElement[];
  if (nodes.length === 0) return { el: null, rect: null };
  const rect = unionElementsRect(nodes, pad);
  const anchor = panel ?? trigger;
  if (!rect || !anchor) return { el: null, rect: null };
  return { el: anchor, rect: normalizeSpotlightRect(rect, "profile-menu") };
}

export function measureDemoTargetRect(
  el: HTMLElement | null,
  padding?: number,
  stepId?: string,
  targetId?: string,
): SpotlightRect | null {
  if (!el && stepId !== "locale-settings" && stepId !== "profile-menu") return null;

  const pad = padding ?? getMeasurePadding(stepId);

  if (stepId === "locale-settings" && (targetId === "locale-settings-zone" || !el)) {
    return measureLocaleSettingsZoneRect(pad).rect;
  }

  if (stepId === "profile-menu") {
    const union = measureProfileMenuRect(pad);
    if (union.rect) return union.rect;
  }

  if (!el) return null;

  if (stepId && FULL_COLUMN_STEP_IDS.has(stepId)) {
    return measureFullColumnRect(el, pad, stepId);
  }

  if (stepId === "seller-overview") {
    return measureSellerOverviewRect(el, pad, stepId);
  }

  if (stepId === "products") {
    return measureProductsSortRect(el, pad, stepId);
  }

  let raw: SpotlightRect | null = null;
  if (stepId && GRID_FIRST_ROW_STEP_IDS.has(stepId)) {
    raw = measureGridFirstRowRect(el, pad);
  }
  if (!raw) {
    const r = el.getBoundingClientRect();
    raw = {
      top: r.top - pad,
      left: r.left - pad,
      width: r.width + pad * 2,
      height: r.height + pad * 2,
    };
  }
  return normalizeSpotlightRect(raw, stepId);
}

export function measureProductsSortRect(
  el: HTMLElement | null,
  padding = 8,
  stepId?: string,
): SpotlightRect | null {
  const root = el ?? queryDemoTarget("products-sort");
  if (!root) return null;
  const pad = padding ?? getMeasurePadding("products");
  const r = root.getBoundingClientRect();
  const raw: SpotlightRect = {
    top: r.top - pad,
    left: r.left - pad,
    width: r.width + pad * 2,
    height: r.height + pad * 2,
  };
  return normalizeSpotlightRect(raw, stepId ?? "products");
}

export function resolveMeasureElement(
  targetId: string,
  stepId?: string,
): HTMLElement | null {
  if (stepId === "locale-settings" && targetId === "locale-settings-zone") {
    return measureLocaleSettingsZoneRect().el;
  }
  if (stepId === "profile-menu") {
    return measureProfileMenuRect().el ?? queryDemoTarget(targetId);
  }
  return queryDemoTarget(targetId);
}

export function queryDemoTarget(targetId: string): HTMLElement | null {
  return document.querySelector(`[data-demo-target="${targetId}"]`) as HTMLElement | null;
}

export function getFallbackTargetsForStep(stepId: string, primaryTarget?: string): string[] {
  if (stepId in STEP_FALLBACKS) {
    return STEP_FALLBACKS[stepId]!.filter((id) => id !== primaryTarget);
  }
  if (stepId.startsWith("seller-")) {
    return [
      "seller-profile-breadcrumb",
      "seller-profile-sidebar",
      "seller-profile-catalog",
      "seller-profile-categories",
    ].filter((id) => id !== primaryTarget);
  }
  if (stepId.startsWith("register-")) {
    return ["register-form", "register-email", "register-password", "register-role", "register-submit"].filter(
      (id) => id !== primaryTarget,
    );
  }
  if (stepId.startsWith("checkout-")) {
    return [
      "checkout-form",
      "checkout-address-form",
      "checkout-freight",
      "checkout-freight-options",
      "checkout-payment",
      "checkout-review",
      "checkout-review-body",
      "checkout-done",
    ].filter((id) => id !== primaryTarget);
  }
  return [];
}

export type DemoTargetResolveResult = {
  el: HTMLElement | null;
  rect: SpotlightRect | null;
  mode: "active" | "ambient";
  resolvedTargetId?: string;
};

function tryResolveSingleTarget(targetId: string, stepId?: string): DemoTargetResolveResult | null {
  if (stepId && (AMBIENT_ONLY_STEP_IDS.has(stepId) || NO_VEIL_STEP_IDS.has(stepId))) {
    return { el: null, rect: null, mode: "ambient" };
  }

  const el = queryDemoTarget(targetId);
  if (!el) return null;
  const rect = measureDemoTargetRect(el, undefined, stepId, targetId);
  if (!rect) return null;
  return { el, rect, mode: "active", resolvedTargetId: targetId };
}

function tryResolveTarget(ids: string[], stepId?: string): DemoTargetResolveResult | null {
  for (const id of ids) {
    const resolved = tryResolveSingleTarget(id, stepId);
    if (resolved) return resolved;
  }
  return null;
}

export type WaitForDemoTargetOptions = {
  timeoutMs?: number;
  fallbackIds?: string[];
  /** When true, only polls primary target until timeout, then step fallbacks (never header search). */
  strict?: boolean;
  stepId?: string;
};

export async function waitForDemoTarget(
  targetId: string | undefined,
  options?: WaitForDemoTargetOptions,
): Promise<DemoTargetResolveResult> {
  if (typeof document === "undefined") {
    return { el: null, rect: null, mode: "ambient" };
  }

  const timeoutMs = options?.timeoutMs ?? TARGET_WAIT_MS;
  const strict = options?.strict ?? true;
  const stepId = options?.stepId ?? "";
  const fallbackIds =
    options?.fallbackIds ?? getFallbackTargetsForStep(stepId, targetId);

  const deadline = Date.now() + timeoutMs;

  if (targetId && strict) {
    while (Date.now() < deadline) {
      const primary = tryResolveSingleTarget(targetId, stepId);
      if (primary) return primary;
      await new Promise((r) => setTimeout(r, STRICT_POLL_MS));
    }
    if (fallbackIds.length > 0) {
      const fromFallback = tryResolveTarget(fallbackIds, stepId);
      if (fromFallback) return fromFallback;
    }
    return { el: null, rect: null, mode: "ambient" };
  }

  const ids = targetId ? [targetId, ...fallbackIds.filter((id) => id !== targetId)] : fallbackIds;
  while (Date.now() < deadline) {
    const resolved = tryResolveTarget(ids, stepId);
    if (resolved) return resolved;
    await new Promise((r) => setTimeout(r, STRICT_POLL_MS));
  }

  return { el: null, rect: null, mode: "ambient" };
}
