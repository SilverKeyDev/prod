import type { ReactNode } from "react";

import { Box } from "packages/ui/components/primitives";

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
    <Box className="min-h-screen bg-background-base">
      <Box className={`mx-auto ${maxWidthClassName} pb-1 sm:px-6 lg:px-8`}>
        <Box className="flex flex-row gap-6 lg:gap-8">
          {sidebar}
          <Box role="region" className={regionClassName}>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
