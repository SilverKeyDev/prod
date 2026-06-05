import type { AlignedRowItem, AlignedRowProps } from "./alignedRowTypes";

export const GAP_CLASSES: Record<NonNullable<AlignedRowProps["gap"]>, string> = {
  none: "gap-0",
  xs: "gap-1 sm:gap-2",
  sm: "gap-2 sm:gap-3",
  md: "gap-3 sm:gap-4",
  lg: "gap-4 sm:gap-6",
  xl: "gap-6 sm:gap-8",
};

export const JUSTIFY_CLASSES: Record<NonNullable<AlignedRowProps["justify"]>, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

export type BreakIntoRows = NonNullable<AlignedRowProps["breakIntoRows"]>;

/** Tailwind default breakpoints — used when comparing container width (not viewport). */
export function getViewportBreakpointPx(breakIntoRows: Exclude<BreakIntoRows, "never">): number {
  const map: Record<Exclude<BreakIntoRows, "never">, number> = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  };
  return map[breakIntoRows];
}

export function getResponsiveLayoutClasses(breakIntoRows: BreakIntoRows): string {
  if (breakIntoRows === "never") return "flex-row";
  const map: Record<Exclude<BreakIntoRows, "never">, string> = {
    sm: "flex-col sm:flex-row",
    md: "flex-col md:flex-row",
    lg: "flex-col lg:flex-row",
    xl: "flex-col xl:flex-row",
  };
  return map[breakIntoRows];
}

/** Row vs column using measured container width (e.g. popover), not viewport. */
export function getContainerAwareLayoutClass(
  breakIntoRows: BreakIntoRows,
  containerWidthPx: number | undefined
): string {
  if (breakIntoRows === "never") return "flex-row";
  if (containerWidthPx === undefined) return getResponsiveLayoutClasses(breakIntoRows);
  const bp = getViewportBreakpointPx(breakIntoRows);
  return containerWidthPx < bp ? "flex-col" : "flex-row";
}

export function getResponsiveWidthClasses(width: number, breakIntoRows: BreakIntoRows): string {
  if (breakIntoRows === "never") return "";
  const map: Record<Exclude<BreakIntoRows, "never">, string> = {
    sm: `w-full sm:w-[${width}%]`,
    md: `w-full md:w-[${width}%]`,
    lg: `w-full lg:w-[${width}%]`,
    xl: `w-full xl:w-[${width}%]`,
  };
  return map[breakIntoRows];
}

export function getContainerAwareItemWidthClasses(
  width: number,
  breakIntoRows: BreakIntoRows,
  containerWidthPx: number | undefined
): string {
  if (breakIntoRows === "never") return "";
  if (containerWidthPx === undefined) return getResponsiveWidthClasses(width, breakIntoRows);
  const bp = getViewportBreakpointPx(breakIntoRows);
  if (containerWidthPx < bp) return "w-full";
  return `w-[${width}%]`;
}

export function calculateElementWidths(itemCount: number, widths?: number[]): number[] {
  if (widths && widths.length > 0) {
    const totalProvided = widths.reduce((sum, w) => sum + w, 0);
    const remaining = 100 - totalProvided;
    const remainingItems = itemCount - widths.length;
    const equalWidth = remainingItems > 0 ? remaining / remainingItems : 0;
    return Array.from({ length: itemCount }, (_, i) =>
      i < widths.length ? widths[i] : equalWidth
    );
  }
  const equalWidth = 100 / itemCount;
  return Array.from({ length: itemCount }, () => equalWidth);
}

export function runAlignedRowHeightSync(
  root: HTMLElement,
  items: AlignedRowItem[] | undefined,
  minHeight?: string | number
) {
  if (items && items.length > 0) {
    const titleEls = root.querySelectorAll<HTMLElement>(".aligned-row-title");
    const contentEls = root.querySelectorAll<HTMLElement>(".aligned-row-content");
    titleEls.forEach((e) => (e.style.height = "auto"));
    contentEls.forEach((e) => (e.style.height = "auto"));
    const titleHeights = Array.from(titleEls).map((e) => e.offsetHeight);
    const maxTitle = titleHeights.length ? Math.max(...titleHeights) : 0;
    titleEls.forEach((e) => {
      if (maxTitle > 0) {
        e.style.height = `${maxTitle}px`;
        e.style.display = "flex";
        e.style.alignItems = "flex-start";
      }
    });
    contentEls.forEach((e) => {
      e.style.height = "auto";
      e.style.minHeight = "";
      e.style.display = "flex";
      e.style.flexDirection = "column";
    });
    return;
  }

  const childEls = Array.from(root.children) as HTMLElement[];
  if (childEls.length === 0) return;
  childEls.forEach((c) => (c.style.height = "auto"));
  const heights = childEls.map((c) => c.offsetHeight);
  const maxH = Math.max(...heights);
  const finalH = minHeight
    ? Math.max(maxH, typeof minHeight === "string" ? parseInt(minHeight, 10) : minHeight)
    : maxH;
  childEls.forEach((c) => {
    c.style.height = `${finalH}px`;
    c.style.display = "flex";
    c.style.flexDirection = "column";
  });
}
