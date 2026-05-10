import React from "react";

import { Box } from "packages/ui/components/primitives";

const MOBILE_TOP_BAR_HEIGHT_PX = 80; // h-20 – default height (search and dense chrome)
/** Matches `SIDEBAR_INSET_HEADER_SHELL` (`h-14`) so messaging header is not vertically centered in extra slack. */
export const MOBILE_TOP_BAR_COMPACT_HEIGHT_PX = 56;
/**
 * Library (/saved) mobile header: underline tabs + card toolbar exceed the default bar height; spacer
 * must match or content renders under the fixed header.
 */
export const MOBILE_TOP_BAR_LIBRARY_HEIGHT_PX = 180;
const SPACER_MARGIN_PX = 12;

type MobileTopBarProps = {
  children: React.ReactNode;
  /** When true, children take full width (e.g. messaging header with its own left/right layout) */
  fullWidth?: boolean;
  /** When true, remove left/right padding (e.g. when MobileBottomNav is visible) */
  noPadding?: boolean;
  /** When true, use a frosted-glass backdrop instead of a solid background */
  blurBackground?: boolean;
  /** Bar min-height in pixels; use compact for routes whose header is `h-14` only (e.g. messaging). */
  barHeightPx?: number;
};

const MobileTopBar: React.FC<MobileTopBarProps> = ({
  children,
  fullWidth = false,
  noPadding = false,
  blurBackground = false,
  barHeightPx = MOBILE_TOP_BAR_HEIGHT_PX,
}) => {
  const backgroundClass = blurBackground ? "bg-background/75 backdrop-blur-md" : "bg-background";
  const spacerHeight = `calc(${barHeightPx + SPACER_MARGIN_PX}px + env(safe-area-inset-top, 0px))`;
  return (
    <>
      <header
        className={`${backgroundClass} fixed left-0 right-0 top-0 z-header flex items-center overflow-hidden md:hidden ${
          fullWidth || noPadding ? "px-0" : "px-4"
        }`}
        style={{
          minHeight: barHeightPx,
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
        aria-label="Page header"
      >
        {fullWidth ? (
          <Box className="flex h-full w-full flex-1 items-center">{children}</Box>
        ) : (
          <>
            <Box className="flex h-full w-10 flex-shrink-0 items-center justify-start" />
            <Box className="flex min-h-full min-w-0 flex-1 items-center justify-center">
              {children}
            </Box>
            <Box className="flex h-full w-10 flex-shrink-0 items-center justify-end" />
          </>
        )}
      </header>
      <Box className="md:hidden" style={{ height: spacerHeight }} />
    </>
  );
};

export default MobileTopBar;
