import React from "react";

import { Box } from "packages/ui/components/primitives";

const MOBILE_TOP_BAR_HEIGHT_PX = 80; // h-20 – single fixed height for all top bar content
const SPACER_MARGIN_PX = 12;

type MobileTopBarProps = {
  children: React.ReactNode;
  /** When true, children take full width (e.g. messaging header with its own left/right layout) */
  fullWidth?: boolean;
  /** When true, remove left/right padding (e.g. when MobileBottomNav is visible) */
  noPadding?: boolean;
};

const MobileTopBar: React.FC<MobileTopBarProps> = ({
  children,
  fullWidth = false,
  noPadding = false,
}) => {
  return (
    <>
      <header
        className={`bg-background fixed left-0 right-0 top-0 z-header flex items-center overflow-hidden md:hidden ${
          fullWidth || noPadding ? "px-0" : "px-4"
        }`}
        style={{ minHeight: MOBILE_TOP_BAR_HEIGHT_PX }}
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
      <Box
        className="md:hidden"
        style={{ height: `${MOBILE_TOP_BAR_HEIGHT_PX + SPACER_MARGIN_PX}px` }}
      />
    </>
  );
};

export default MobileTopBar;
