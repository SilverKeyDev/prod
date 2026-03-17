import React, { useEffect, useRef } from "react";

import { Box } from "packages/ui/components/primitives";
import { getWindow } from "packages/utils/platform";

export type AlignedRowItem = {
  title?: React.ReactNode;
  content: React.ReactNode;
  className?: string;
};

type AlignedRowProps = {
  children?: React.ReactNode;
  items?: AlignedRowItem[];
  className?: string;
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: boolean;
  minHeight?: string | number;
  titleClassName?: string;
  contentClassName?: string;
  widths?: number[];
  style?: React.CSSProperties;
  breakIntoRows?: "sm" | "md" | "lg" | "xl" | "never";
};

const GAP_CLASSES: Record<NonNullable<AlignedRowProps["gap"]>, string> = {
  none: "gap-0",
  xs: "gap-1 sm:gap-2",
  sm: "gap-2 sm:gap-3",
  md: "gap-3 sm:gap-4",
  lg: "gap-4 sm:gap-6",
  xl: "gap-6 sm:gap-8",
};

const JUSTIFY_CLASSES: Record<NonNullable<AlignedRowProps["justify"]>, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

type BreakIntoRows = NonNullable<AlignedRowProps["breakIntoRows"]>;

function getResponsiveLayoutClasses(breakIntoRows: BreakIntoRows): string {
  if (breakIntoRows === "never") return "flex-row";
  const map: Record<Exclude<BreakIntoRows, "never">, string> = {
    sm: "flex-col sm:flex-row",
    md: "flex-col md:flex-row",
    lg: "flex-col lg:flex-row",
    xl: "flex-col xl:flex-row",
  };
  return map[breakIntoRows];
}

function calculateElementWidths(itemCount: number, widths?: number[]): number[] {
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

function getResponsiveWidthClasses(width: number, breakIntoRows: BreakIntoRows): string {
  if (breakIntoRows === "never") return "";
  const map: Record<Exclude<BreakIntoRows, "never">, string> = {
    sm: `w-full sm:w-[${width}%]`,
    md: `w-full md:w-[${width}%]`,
    lg: `w-full lg:w-[${width}%]`,
    xl: `w-full xl:w-[${width}%]`,
  };
  return map[breakIntoRows];
}

function useAlignedRowHeights(
  containerRef: React.RefObject<HTMLDivElement | null>,
  items: AlignedRowItem[] | undefined,
  children: React.ReactNode,
  minHeight?: string | number
) {
  useEffect(() => {
    const win = getWindow();
    if (!win) return;
    const el = containerRef.current;
    if (!el) return;

    const run = () => {
      if (!containerRef.current) return;

      if (items && items.length > 0) {
        const titleEls = containerRef.current.querySelectorAll<HTMLElement>(".aligned-row-title");
        const contentEls =
          containerRef.current.querySelectorAll<HTMLElement>(".aligned-row-content");
        titleEls.forEach((e) => (e.style.height = "auto"));
        contentEls.forEach((e) => (e.style.height = "auto"));
        const titleHeights = Array.from(titleEls).map((e) => e.offsetHeight);
        const contentHeights = Array.from(contentEls).map((e) => e.offsetHeight);
        const maxTitle = titleHeights.length ? Math.max(...titleHeights) : 0;
        const maxContent = contentHeights.length ? Math.max(...contentHeights) : 0;
        titleEls.forEach((e) => {
          if (maxTitle > 0) {
            e.style.height = `${maxTitle}px`;
            e.style.display = "flex";
            e.style.alignItems = "center";
          }
        });
        contentEls.forEach((e) => {
          if (maxContent > 0) {
            e.style.height = `${maxContent}px`;
            e.style.display = "flex";
            e.style.flexDirection = "column";
          }
        });
        return;
      }

      const childEls = Array.from(containerRef.current.children) as HTMLElement[];
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
    };

    run();
    const onResize = () => setTimeout(run, 100);
    win.addEventListener("resize", onResize);
    let ro: ResizeObserver | null = null;
    if (win.ResizeObserver) {
      ro = new win.ResizeObserver(() => setTimeout(run, 50));
      ro.observe(el);
    }
    return () => {
      win.removeEventListener("resize", onResize);
      ro?.disconnect();
    };
  }, [children, items, minHeight, containerRef]);
}

type AlignedRowItemsContentProps = {
  items: AlignedRowItem[];
  elementWidths: number[];
  breakIntoRows: BreakIntoRows;
  titleClassName: string;
  contentClassName: string;
};

function AlignedRowItemsContent({
  items,
  elementWidths,
  breakIntoRows,
  titleClassName,
  contentClassName,
}: AlignedRowItemsContentProps) {
  return (
    <>
      {items.map((item, index) => {
        const width = elementWidths[index] ?? 0;
        const respClass = getResponsiveWidthClasses(width, breakIntoRows);
        const widthStyle = breakIntoRows === "never" ? { width: `${width}%` } : {};
        return (
          <Box
            key={index}
            className={`aligned-row-item flex h-full min-h-0 flex-col ${respClass} ${item.className ?? ""}`}
            style={widthStyle}
          >
            {item.title && (
              <Box className={`aligned-row-title flex-shrink-0 ${titleClassName}`}>
                {item.title}
              </Box>
            )}
            <Box
              className={`aligned-row-content flex min-h-0 flex-1 flex-col justify-start ${contentClassName}`}
            >
              {item.content}
            </Box>
          </Box>
        );
      })}
    </>
  );
}

type AlignedRowChildrenContentProps = {
  children: React.ReactNode;
  elementWidths: number[];
  breakIntoRows: BreakIntoRows;
};

function AlignedRowChildrenContent({
  children,
  elementWidths,
  breakIntoRows,
}: AlignedRowChildrenContentProps) {
  return (
    <>
      {React.Children.map(children, (child, index) => {
        const width = elementWidths[index] ?? 0;
        const respClass = getResponsiveWidthClasses(width, breakIntoRows);
        const widthStyle = breakIntoRows === "never" ? { width: `${width}%` } : {};
        const node = React.isValidElement(child) ? child : <Box>{child}</Box>;
        return (
          <Box
            key={index}
            className={`aligned-row-item flex h-full min-h-0 flex-col ${respClass}`}
            style={widthStyle}
          >
            {React.cloneElement(node as React.ReactElement<{ className?: string }>, {
              className:
                `${(node as React.ReactElement<{ className?: string }>).props?.className ?? ""} h-full w-full flex-1`.trim(),
            })}
          </Box>
        );
      })}
    </>
  );
}

const AlignedRow: React.FC<AlignedRowProps> = ({
  children,
  items,
  className = "",
  gap = "md",
  justify = "start",
  wrap = false,
  minHeight,
  titleClassName = "",
  contentClassName = "",
  widths,
  style,
  breakIntoRows = "never",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useAlignedRowHeights(containerRef, items, children, minHeight);

  const itemCount = items ? items.length : React.Children.count(children);
  const elementWidths = calculateElementWidths(itemCount, widths);

  const combinedClasses = [
    "flex",
    getResponsiveLayoutClasses(breakIntoRows),
    wrap ? "flex-wrap" : "flex-nowrap",
    GAP_CLASSES[gap],
    "items-stretch",
    JUSTIFY_CLASSES[justify],
    "w-full",
    "min-h-0",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content =
    items && items.length > 0 ? (
      <AlignedRowItemsContent
        items={items}
        elementWidths={elementWidths}
        breakIntoRows={breakIntoRows}
        titleClassName={titleClassName}
        contentClassName={contentClassName}
      />
    ) : children ? (
      <AlignedRowChildrenContent
        children={children}
        elementWidths={elementWidths}
        breakIntoRows={breakIntoRows}
      />
    ) : null;

  return (
    <Box ref={containerRef} className={combinedClasses} style={style}>
      {content}
    </Box>
  );
};

export default AlignedRow;
