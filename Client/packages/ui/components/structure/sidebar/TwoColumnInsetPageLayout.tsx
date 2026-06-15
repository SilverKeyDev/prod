import type { ReactNode } from "react";

import { Box } from "packages/ui/components/structure/primitives";

export type TwoColumnInsetPageLayoutProps = {
  sidebar: ReactNode;
  children: ReactNode;
  /** Tailwind max-width class for the centered column (mirrors personalization settings). */
  maxWidthClassName?: string;
  /** Merged onto the primary content `role="region"` wrapper. */
  regionClassName?: string;
};

/** Shared two-column shell: full-height background, centered max width, flex row + main region. */
export function TwoColumnInsetPageLayout({
  sidebar,
  children,
  maxWidthClassName = "max-w-7xl",
  regionClassName = "w-full flex-1",
}: TwoColumnInsetPageLayoutProps) {
  return (
    <Box className="bg-background-base min-h-screen">
      <Box className={`mx-auto ${maxWidthClassName} pb-1 sm:px-6 lg:px-8`}>
        <Box className="flex flex-row gap-6 lg:gap-8">
          {/*
            Stretch this column to the row height so inner `position: sticky` sidebars
            (e.g. SidebarNavigation) stay anchored while the main column scrolls. Without
            this wrapper, `h-fit` on the aside prevents flex cross-axis stretch and sticky
            never gets a tall containing block.
          */}
          <Box className="shrink-0 self-stretch">{sidebar}</Box>
          <Box role="region" className={regionClassName}>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
