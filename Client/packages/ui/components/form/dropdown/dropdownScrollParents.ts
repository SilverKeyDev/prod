/** Scroll containers between `node` and the document root (for repositioning portaled menus). */
export function getScrollParents(node: HTMLElement | null): HTMLElement[] {
  const out: HTMLElement[] = [];
  let el: HTMLElement | null = node?.parentElement ?? null;
  while (el) {
    const style = getComputedStyle(el);
    const oy = style.overflowY;
    const ox = style.overflowX;
    const scrollableY = /(auto|scroll|overlay)/.test(oy) && el.scrollHeight > el.clientHeight;
    const scrollableX = /(auto|scroll|overlay)/.test(ox) && el.scrollWidth > el.clientWidth;
    if (scrollableY || scrollableX) {
      out.push(el);
    }
    el = el.parentElement;
  }
  return out;
}
