import React, { useLayoutEffect, useRef, useState } from "react";

import { Box } from "packages/ui/components/structure/primitives";
import { getWindow } from "packages/utils/core/platform";

import {
  type BreakIntoRows,
  calculateElementWidths,
  GAP_CLASSES,
  getAlignedRowItemClassName,
  getAlignedRowItemStyle,
  getContainerAwareLayoutClass,
  JUSTIFY_CLASSES,
  runAlignedRowHeightSync,
} from "./alignedRow/alignedRowLayout";
import type { AlignedRowItem, AlignedRowProps } from "./alignedRow/alignedRowTypes";

export type { AlignedRowItem } from "./alignedRow/alignedRowTypes";

/**
 * Tracks this row's own width (popover panel, profile column, etc.) via ResizeObserver so
 * row vs column and column % widths follow the container — not the viewport `sm/md` breakpoints.
 */
function useAlignedRowContainerWidth(
  containerRef: React.RefObject<HTMLDivElement | null>
): number | undefined {
  const [containerWidthPx, setContainerWidthPx] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const win = getWindow();
    if (!win) return;
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      if (w > 0) {
        setContainerWidthPx((prev) => (prev === w ? prev : w));
      }
    };

    updateWidth();

    const onWinResize = () => {
      win.setTimeout(updateWidth, 100);
    };
    win.addEventListener("resize", onWinResize);

    let ro: ResizeObserver | null = null;
    if (win.ResizeObserver) {
      ro = new win.ResizeObserver(updateWidth);
      ro.observe(el);
    }

    return () => {
      win.removeEventListener("resize", onWinResize);
      ro?.disconnect();
    };
  }, [containerRef]);

  return containerWidthPx;
}

function useAlignedRowHeightSyncAfterLayout(
  containerRef: React.RefObject<HTMLDivElement | null>,
  items: AlignedRowItem[] | undefined,
  children: React.ReactNode,
  minHeight: string | number | undefined,
  containerWidthPx: number | undefined
) {
  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    runAlignedRowHeightSync(root, items, minHeight);
  }, [containerRef, containerWidthPx, items, children, minHeight]);
}

type AlignedRowItemsContentProps = {
  items: AlignedRowItem[];
  elementWidths: number[];
  breakIntoRows: BreakIntoRows;
  containerWidthPx: number | undefined;
  hasCustomWidths: boolean;
  titleClassName: string;
  contentClassName: string;
};

function AlignedRowItemsContent({
  items,
  elementWidths,
  breakIntoRows,
  containerWidthPx,
  hasCustomWidths,
  titleClassName,
  contentClassName,
}: AlignedRowItemsContentProps) {
  return (
    <>
      {items.map((item, index) => {
        const width = elementWidths[index] ?? 0;
        const respClass = getAlignedRowItemClassName(breakIntoRows, containerWidthPx);
        const widthStyle = getAlignedRowItemStyle(
          width,
          breakIntoRows,
          containerWidthPx,
          hasCustomWidths
        );
        return (
          <Box
            key={index}
            className={`aligned-row-item flex h-full min-h-0 flex-col ${respClass} ${
              item.className ?? ""
            }`}
            style={widthStyle}
          >
            {item.title && (
              <Box className={`aligned-row-title w-full min-w-0 flex-shrink-0 ${titleClassName}`}>
                {item.title}
              </Box>
            )}
            <Box
              className={`aligned-row-content flex w-full min-w-0 flex-1 flex-col justify-start ${contentClassName}`}
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
  containerWidthPx: number | undefined;
  hasCustomWidths: boolean;
};

function AlignedRowChildrenContent({
  children,
  elementWidths,
  breakIntoRows,
  containerWidthPx,
  hasCustomWidths,
}: AlignedRowChildrenContentProps) {
  return (
    <>
      {React.Children.map(children, (child, index) => {
        const width = elementWidths[index] ?? 0;
        const respClass = getAlignedRowItemClassName(breakIntoRows, containerWidthPx);
        const widthStyle = getAlignedRowItemStyle(
          width,
          breakIntoRows,
          containerWidthPx,
          hasCustomWidths
        );
        const node = React.isValidElement(child) ? child : <Box>{child}</Box>;
        return (
          <Box
            key={index}
            className={`aligned-row-item flex h-full min-h-0 flex-col ${respClass}`}
            style={widthStyle}
          >
            {React.cloneElement(node as React.ReactElement<{ className?: string }>, {
              className: `${
                (node as React.ReactElement<{ className?: string }>).props?.className ?? ""
              } h-full w-full flex-1`.trim(),
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
  const containerWidthPx = useAlignedRowContainerWidth(containerRef);
  useAlignedRowHeightSyncAfterLayout(containerRef, items, children, minHeight, containerWidthPx);

  const itemCount = items ? items.length : React.Children.count(children);
  const elementWidths = calculateElementWidths(itemCount, widths);
  const hasCustomWidths = Boolean(widths && widths.length > 0);

  const combinedClasses = [
    "flex",
    getContainerAwareLayoutClass(breakIntoRows, containerWidthPx),
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
        containerWidthPx={containerWidthPx}
        hasCustomWidths={hasCustomWidths}
        titleClassName={titleClassName}
        contentClassName={contentClassName}
      />
    ) : children ? (
      <AlignedRowChildrenContent
        children={children}
        elementWidths={elementWidths}
        breakIntoRows={breakIntoRows}
        containerWidthPx={containerWidthPx}
        hasCustomWidths={hasCustomWidths}
      />
    ) : null;

  return (
    <Box ref={containerRef} className={combinedClasses} style={style}>
      {content}
    </Box>
  );
};

export default AlignedRow;
