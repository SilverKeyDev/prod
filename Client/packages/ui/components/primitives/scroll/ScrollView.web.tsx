import React, { forwardRef } from "react";

/** Props accepted for cross-platform parity; web implementation strips RN-only fields from the DOM. */
export type ScrollViewProps = React.HTMLAttributes<HTMLDivElement> & {
  horizontal?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void | Promise<void>;
  contentContainerStyle?: React.CSSProperties;
  refreshControl?: React.ReactNode;
  keyboardShouldPersistTaps?: "always" | "never" | "handled";
  keyboardDismissMode?: string;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  nestedScrollEnabled?: boolean;
  pagingEnabled?: boolean;
  scrollEnabled?: boolean;
  bounces?: boolean;
  stickyHeaderIndices?: number[];
};

const RN_SCROLL_KEYS = new Set([
  "refreshing",
  "onRefresh",
  "contentContainerStyle",
  "refreshControl",
  "keyboardShouldPersistTaps",
  "keyboardDismissMode",
  "showsVerticalScrollIndicator",
  "showsHorizontalScrollIndicator",
  "nestedScrollEnabled",
  "pagingEnabled",
  "directionalLockEnabled",
  "stickyHeaderIndices",
  "automaticallyAdjustKeyboardInsets",
  "automaticallyAdjustContentInsets",
  "contentInset",
  "contentInsetAdjustmentBehavior",
  "scrollEventThrottle",
  "scrollEnabled",
  "bounces",
  "alwaysBounceVertical",
  "alwaysBounceHorizontal",
  "centerContent",
  "indicatorStyle",
  "maximumZoomScale",
  "minimumZoomScale",
  "zoomScale",
  "snapToInterval",
  "snapToAlignment",
  "decelerationRate",
  "endFillColor",
  "overScrollMode",
  "removeClippedSubviews",
  "maintainVisibleContentPosition",
  "onContentSizeChange",
  "onMomentumScrollBegin",
  "onMomentumScrollEnd",
  "onScrollBeginDrag",
  "onScrollEndDrag",
  "scrollPerfTag",
  "scrollToOverflowEnabled",
  "scrollsToTop",
  "onScrollToTop",
]);

function filterDomProps(props: Record<string, unknown>): React.HTMLAttributes<HTMLDivElement> {
  const dom: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!RN_SCROLL_KEYS.has(key)) {
      dom[key] = value;
    }
  }
  return dom as React.HTMLAttributes<HTMLDivElement>;
}

/** Maps common React Native style shorthands to DOM CSS. */
function normalizeRnLayoutStyle(style: React.CSSProperties | undefined): React.CSSProperties {
  if (!style) return {};
  const s = style as Record<string, unknown>;
  const { paddingHorizontal, paddingVertical, marginHorizontal, marginVertical, ...rest } = s;
  const out: React.CSSProperties = { ...(rest as React.CSSProperties) };
  if (paddingHorizontal !== undefined) {
    const p = paddingHorizontal as React.CSSProperties["paddingLeft"];
    out.paddingLeft = p;
    out.paddingRight = p;
  }
  if (paddingVertical !== undefined) {
    const p = paddingVertical as React.CSSProperties["paddingTop"];
    out.paddingTop = p;
    out.paddingBottom = p;
  }
  if (marginHorizontal !== undefined) {
    const m = marginHorizontal as React.CSSProperties["marginLeft"];
    out.marginLeft = m;
    out.marginRight = m;
  }
  if (marginVertical !== undefined) {
    const m = marginVertical as React.CSSProperties["marginTop"];
    out.marginTop = m;
    out.marginBottom = m;
  }
  return out;
}

const ScrollView = forwardRef<HTMLDivElement, ScrollViewProps>(function ScrollView(
  { children, className = "", style, horizontal = false, contentContainerStyle, ...rest },
  ref
) {
  const domProps = filterDomProps(rest as Record<string, unknown>);

  const resolvedStyle: React.CSSProperties = {
    overflowX: horizontal ? "auto" : "hidden",
    overflowY: horizontal ? "hidden" : "auto",
    ...(style as React.CSSProperties),
  };

  const normalizedContent = normalizeRnLayoutStyle(contentContainerStyle);
  const innerStyle: React.CSSProperties = horizontal
    ? {
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        width: "max-content",
        minHeight: "100%",
        ...normalizedContent,
      }
    : {
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        width: "100%",
        minHeight: "min-content",
        ...normalizedContent,
      };

  return (
    <div ref={ref} className={className} style={resolvedStyle} {...domProps}>
      <div style={innerStyle}>{children}</div>
    </div>
  );
});

export default ScrollView;
