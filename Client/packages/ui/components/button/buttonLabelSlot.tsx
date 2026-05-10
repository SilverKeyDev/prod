import React from "react";

import { Box, Text } from "packages/ui/components/primitives";

export type ButtonLabelSlotParams = {
  children: React.ReactNode;
  containerCollapse: boolean;
  contentAlign: "center" | "start";
  textVisibilityClass: string;
  contentInnerLayoutClass: string;
  collapseShowLabelAt: string;
  textColorClass: string;
  textSizeClass: string;
  truncateLabel: boolean;
};

function collapseWideLayouts(showLabelAt: string): { start: string; center: string } {
  return {
    start: `${showLabelAt}:justify-start ${showLabelAt}:text-left ${showLabelAt}:w-full`.trim(),
    center: `${showLabelAt}:justify-center ${showLabelAt}:text-center`.trim(),
  };
}

function buildCollapsedLabelRowClass(
  showLabelAt: string,
  contentAlign: "center" | "start",
  wide: ReturnType<typeof collapseWideLayouts>,
  textVisibilityClass: string
): string {
  return [
    "hidden",
    "min-w-0",
    "flex-row",
    "items-center",
    "gap-2",
    "font-medium",
    "leading-none",
    `${showLabelAt}:inline-flex`,
    contentAlign === "start" ? wide.start : wide.center,
    textVisibilityClass,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Label area for Button (string or JSX children), including web icon-collapse visibility. */
export function renderButtonLabelSlot(p: ButtonLabelSlotParams): React.ReactNode | null {
  const { children } = p;
  // `condition && <Foo />` yields `false` when condition is false; that must not render the
  // label row (empty `w-full` slot would steal flex space and offset icon-only buttons).
  if (children == null || children === false) return null;

  const wide = collapseWideLayouts(p.collapseShowLabelAt);

  const stringChildrenLayoutClass = p.containerCollapse
    ? buildCollapsedLabelRowClass(
        p.collapseShowLabelAt,
        p.contentAlign,
        wide,
        p.textVisibilityClass
      )
    : [p.contentInnerLayoutClass, p.textVisibilityClass].filter(Boolean).join(" ");

  const boxChildrenLayoutClass = p.containerCollapse
    ? buildCollapsedLabelRowClass(
        p.collapseShowLabelAt,
        p.contentAlign,
        wide,
        p.textVisibilityClass
      )
    : [p.contentInnerLayoutClass, p.textVisibilityClass].filter(Boolean).join(" ");

  const stringTruncateClasses =
    p.containerCollapse || !p.truncateLabel ? "" : "min-w-0 shrink truncate";
  const stringNowrapClasses =
    !p.containerCollapse && !p.truncateLabel ? "shrink-0 whitespace-nowrap" : "";

  if (typeof children === "string") {
    return (
      <Text
        className={[
          stringChildrenLayoutClass,
          p.textColorClass,
          p.textSizeClass,
          stringTruncateClasses,
          stringNowrapClasses,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </Text>
    );
  }

  return (
    <Box
      className={[
        boxChildrenLayoutClass,
        p.textColorClass,
        p.textSizeClass,
        p.containerCollapse ? "" : "min-w-0 shrink",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Box>
  );
}
