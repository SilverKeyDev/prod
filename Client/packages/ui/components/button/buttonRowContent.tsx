import React from "react";

import { Box, Row } from "packages/ui/components/primitives";

type IconRenderer = (
  icon: React.ReactNode,
  size: "sm" | "md" | "lg",
  textColorClass: string
) => React.ReactNode;

export function renderButtonLoadingSlot(textColorClass: string): React.ReactElement {
  return (
    <Row className="z-header relative items-center justify-center gap-2">
      <Box
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center ${textColorClass}`.trim()}
      />
    </Row>
  );
}

export function renderButtonEdgeRightRow(args: {
  iconLeft: boolean;
  iconRight: boolean;
  resolvedIcon: React.ReactNode;
  textContent: React.ReactNode;
  size: "sm" | "md" | "lg";
  textColorClass: string;
  renderIcon: IconRenderer;
}): React.ReactElement {
  const { iconLeft, iconRight, resolvedIcon, textContent, size, textColorClass, renderIcon } = args;
  return (
    <>
      <Box
        className={`min-w-0 flex-1 flex-row items-center justify-start gap-2 ${textColorClass}`.trim()}
      >
        {iconLeft && renderIcon(resolvedIcon, size, textColorClass)}
        {textContent}
      </Box>
      {iconRight ? (
        <Box className={`shrink-0 items-center ${textColorClass}`.trim()}>
          {renderIcon(resolvedIcon, size, textColorClass)}
        </Box>
      ) : null}
    </>
  );
}

export function renderButtonStandardRow(args: {
  iconLeft: boolean;
  iconRight: boolean;
  resolvedIcon: React.ReactNode;
  textContent: React.ReactNode;
  contentAlign: "center" | "start";
  size: "sm" | "md" | "lg";
  textColorClass: string;
  renderIcon: IconRenderer;
}): React.ReactElement {
  const {
    iconLeft,
    iconRight,
    resolvedIcon,
    textContent,
    contentAlign,
    size,
    textColorClass,
    renderIcon,
  } = args;
  const labelAbsent = textContent == null || textContent === false;
  const rowClass =
    contentAlign === "start"
      ? "min-w-0 w-full flex-row items-center justify-start gap-2"
      : labelAbsent
        ? "min-w-0 w-full flex-row items-center justify-center gap-2"
        : "min-w-0 flex-row items-center justify-center gap-2";
  return (
    <Row className={rowClass}>
      {iconLeft ? (
        <Box
          className={
            contentAlign === "start"
              ? "shrink-0 flex-row items-center justify-center"
              : "flex-row items-center justify-center"
          }
        >
          {renderIcon(resolvedIcon, size, textColorClass)}
        </Box>
      ) : null}
      {textContent}
      {iconRight ? (
        <Box
          className={
            contentAlign === "start"
              ? "shrink-0 flex-row items-center justify-center"
              : "flex-row items-center justify-center"
          }
        >
          {renderIcon(resolvedIcon, size, textColorClass)}
        </Box>
      ) : null}
    </Row>
  );
}
