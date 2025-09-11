import React, { useEffect, useRef } from "react";

export interface AlignedRowItem {
  title?: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}

interface AlignedRowProps {
  children?: React.ReactNode;
  items?: AlignedRowItem[];
  className?: string;
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: boolean;
  minHeight?: string | number;
  titleClassName?: string;
  contentClassName?: string;
  widths?: number[]; // Array of percentages for each element (e.g., [30, 70] for 30% and 70%)
  style?: React.CSSProperties;
  breakIntoRows?: "sm" | "md" | "lg" | "xl" | "never"; // Screen size below which elements stack vertically
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

  const gapClasses = {
    none: "gap-0",
    xs: "gap-1 sm:gap-2",
    sm: "gap-2 sm:gap-3",
    md: "gap-3 sm:gap-4",
    lg: "gap-4 sm:gap-6",
    xl: "gap-6 sm:gap-8",
  };

  // Responsive breakpoint classes for stacking
  const getResponsiveClasses = () => {
    if (breakIntoRows === "never") {
      return "flex-row";
    }

    const breakpointMap = {
      sm: "flex-col sm:flex-row",
      md: "flex-col md:flex-row",
      lg: "flex-col lg:flex-row",
      xl: "flex-col xl:flex-row",
    };

    return breakpointMap[breakIntoRows];
  };

  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly",
  };

  // Calculate widths for each element
  const calculateWidths = () => {
    const itemCount = items ? items.length : React.Children.count(children);

    if (widths && widths.length > 0) {
      // Use provided widths, pad with equal distribution if needed
      const totalProvided = widths.reduce((sum, width) => sum + width, 0);
      const remaining = 100 - totalProvided;
      const remainingItems = itemCount - widths.length;
      const equalWidth = remainingItems > 0 ? remaining / remainingItems : 0;

      return Array.from({ length: itemCount }, (_, index) =>
        index < widths.length ? widths[index] : equalWidth,
      );
    }

    // Default: equal width for all elements
    const equalWidth = 100 / itemCount;
    return Array.from({ length: itemCount }, () => equalWidth);
  };

  const elementWidths = calculateWidths();

  // Calculate the maximum height of titles and content separately for structured items
  useEffect(() => {
    const calculateMaxHeights = () => {
      if (!containerRef.current) return;

      if (items && items.length > 0) {
        // Handle structured items with title/content
        const titleElements = containerRef.current.querySelectorAll(
          ".aligned-row-title",
        ) as NodeListOf<HTMLElement>;
        const contentElements = containerRef.current.querySelectorAll(
          ".aligned-row-content",
        ) as NodeListOf<HTMLElement>;

        // Reset heights to get natural heights
        titleElements.forEach((el) => {
          el.style.height = "auto";
        });
        contentElements.forEach((el) => {
          el.style.height = "auto";
        });

        // Calculate max heights
        const titleHeights = Array.from(titleElements).map(
          (el) => el.offsetHeight,
        );
        const contentHeights = Array.from(contentElements).map(
          (el) => el.offsetHeight,
        );

        const newMaxTitleHeight =
          titleHeights.length > 0 ? Math.max(...titleHeights) : 0;
        const newMaxContentHeight =
          contentHeights.length > 0 ? Math.max(...contentHeights) : 0;

        // Apply heights for alignment
        titleElements.forEach((el) => {
          if (newMaxTitleHeight > 0) {
            el.style.height = `${newMaxTitleHeight}px`;
            el.style.display = "flex";
            el.style.alignItems = "center";
          }
        });

        contentElements.forEach((el) => {
          if (newMaxContentHeight > 0) {
            el.style.height = `${newMaxContentHeight}px`;
            el.style.display = "flex";
            el.style.flexDirection = "column";
          }
        });
      } else if (children) {
        // Handle regular children mode
        const childElements = Array.from(
          containerRef.current.children,
        ) as HTMLElement[];
        if (childElements.length === 0) return;

        // Reset heights to auto to get natural heights
        childElements.forEach((child) => {
          child.style.height = "auto";
        });

        // Get the maximum natural height
        const heights = childElements.map((child) => child.offsetHeight);
        const newMaxHeight = Math.max(...heights);

        // Apply minimum height if specified
        const finalHeight = minHeight
          ? Math.max(
              newMaxHeight,
              typeof minHeight === "string" ? parseInt(minHeight) : minHeight,
            )
          : newMaxHeight;

        // Apply the max height to all children for alignment
        childElements.forEach((child) => {
          child.style.height = `${finalHeight}px`;
          child.style.display = "flex";
          child.style.flexDirection = "column";
        });
      }
    };

    // Calculate on mount and when children change
    calculateMaxHeights();

    // Recalculate on window resize
    const handleResize = () => {
      // Use setTimeout to ensure layout has settled
      setTimeout(calculateMaxHeights, 100);
    };

    window.addEventListener("resize", handleResize);

    // Use ResizeObserver if available for more precise detection
    let resizeObserver: ResizeObserver | null = null;
    if (window.ResizeObserver && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        setTimeout(calculateMaxHeights, 50);
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [children, items, minHeight]);

  const baseClasses = [
    "flex",
    getResponsiveClasses(),
    wrap ? "flex-wrap" : "flex-nowrap",
    gapClasses[gap],
    "items-stretch", // Force all children to stretch to same height
    justifyClasses[justify],
    "w-full",
    "min-h-0", // Ensure flex items can shrink below content size
  ];

  const combinedClasses = [...baseClasses, className].filter(Boolean).join(" ");

  const combinedStyle = {
    ...style,
  };

  // Get responsive width classes based on breakpoint
  const getResponsiveWidthClasses = (width: number) => {
    if (breakIntoRows === "never") {
      return "";
    }

    const breakpointMap = {
      sm: `w-full sm:w-[${width}%]`,
      md: `w-full md:w-[${width}%]`,
      lg: `w-full lg:w-[${width}%]`,
      xl: `w-full xl:w-[${width}%]`,
    };

    return breakpointMap[breakIntoRows];
  };

  // Render structured items if provided, otherwise render children
  const renderContent = () => {
    if (items && items.length > 0) {
      return items.map((item, index) => {
        const width = elementWidths[index] || 0;
        const responsiveWidthClasses = getResponsiveWidthClasses(width);
        const widthStyle =
          breakIntoRows === "never" ? { width: `${width}%` } : {};

        return (
          <div
            key={index}
            className={`aligned-row-item flex flex-col h-full min-h-0 ${responsiveWidthClasses} ${
              item.className || ""
            }`}
            style={widthStyle}
          >
            {item.title && (
              <div
                className={`aligned-row-title flex-shrink-0 ${titleClassName}`}
              >
                {item.title}
              </div>
            )}
            <div
              className={`aligned-row-content flex-1 flex flex-col justify-start min-h-0 ${contentClassName}`}
            >
              {item.content}
            </div>
          </div>
        );
      });
    }

    if (children) {
      return React.Children.map(children, (child, index) => {
        const width = elementWidths[index] || 0;
        const responsiveWidthClasses = getResponsiveWidthClasses(width);
        const widthStyle =
          breakIntoRows === "never" ? { width: `${width}%` } : {};

        // Clone the child and ensure it stretches to full height
        const childElement = React.isValidElement(child) ? (
          child
        ) : (
          <div>{child}</div>
        );
        return (
          <div
            key={index}
            className={`aligned-row-item h-full flex flex-col min-h-0 ${responsiveWidthClasses}`}
            style={widthStyle}
          >
            {React.cloneElement(childElement as React.ReactElement, {
              className: `${
                (childElement as any)?.props?.className || ""
              } h-full w-full flex-1`.trim(),
            })}
          </div>
        );
      });
    }

    return null;
  };

  return (
    <div ref={containerRef} className={combinedClasses} style={combinedStyle}>
      {renderContent()}
    </div>
  );
};

export default AlignedRow;
