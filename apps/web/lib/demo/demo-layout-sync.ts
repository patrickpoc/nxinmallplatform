/** Binds resize + scroll listeners on window and scrollable ancestors so the veil tracks layout. */
export function bindLayoutSync(el: HTMLElement, onSync: () => void): () => void {
  const scrollTargets = new Set<EventTarget>();
  scrollTargets.add(window);

  let node: HTMLElement | null = el;
  while (node) {
    const style = getComputedStyle(node);
    const overflow = `${style.overflow} ${style.overflowY} ${style.overflowX}`;
    if (/(auto|scroll)/.test(overflow)) {
      scrollTargets.add(node);
    }
    node = node.parentElement;
  }

  const onScroll = () => onSync();
  for (const target of scrollTargets) {
    target.addEventListener("scroll", onScroll, { passive: true, capture: true });
  }

  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => onSync()) : null;
  ro?.observe(el);

  return () => {
    ro?.disconnect();
    for (const target of scrollTargets) {
      target.removeEventListener("scroll", onScroll, { capture: true });
    }
  };
}
