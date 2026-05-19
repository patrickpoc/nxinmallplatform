/** Custom events to expand/collapse the products sort select during the demo tour. */

export const DEMO_PRODUCTS_SORT_EXPAND_EVENT = "nxinmall:demo-products-sort-expand";
export const DEMO_PRODUCTS_SORT_COLLAPSE_EVENT = "nxinmall:demo-products-sort-collapse";

export function setDemoProductsSortExpanded(expanded: boolean): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(expanded ? DEMO_PRODUCTS_SORT_EXPAND_EVENT : DEMO_PRODUCTS_SORT_COLLAPSE_EVENT),
  );
}
