import React from "react";

import { PersonalizationSectionLayoutContext } from "packages/features/profile/hooks/usePersonalizationSectionLayout";
import type { ProfileUiSurface } from "packages/features/profile/types/visibility/profileVisibility";
import { Box } from "packages/ui/components/structure/primitives";
import Title from "packages/ui/components/structure/text/Title";
import Card from "packages/ui/components/surfaces/cards/Card";
import { isWeb } from "packages/utils/core/platform";

/**
 * Wraps settings / profile personalization main content when not using
 * {@link PersonalizationSectionPanel} (each panel supplies this context for its children).
 */
export function PersonalizationSectionLayoutProvider({
  children,
  profileUiSurface = "personalization",
}: {
  children: React.ReactNode;
  profileUiSurface?: ProfileUiSurface;
}) {
  return (
    <PersonalizationSectionLayoutContext.Provider
      value={{ hideStepHeadings: true, panelShowsVisibleHeading: true, profileUiSurface }}
    >
      {children}
    </PersonalizationSectionLayoutContext.Provider>
  );
}

export type PersonalizationSectionPanelProps = {
  /** Anchor id for sidebar scroll (`#sectionId`). */
  sectionId: string;
  /** Visible in sidebar/tabs; rendered as the shared section heading inside the card. */
  screenReaderHeading: string;
  children: React.ReactNode;
  className?: string;
  /**
   * When false, the card heading is visually hidden (still present for screen readers).
   * Use when the section body renders the same title (e.g. Location).
   */
  showVisibleHeading?: boolean;
  profileUiSurface?: ProfileUiSurface;
};

/**
 * One card per settings/profile step: same border, padding, and landmark pattern everywhere.
 */
export function PersonalizationSectionPanel({
  sectionId,
  screenReaderHeading,
  children,
  className = "",
  showVisibleHeading = true,
  profileUiSurface = "personalization",
}: PersonalizationSectionPanelProps) {
  const headingId = `${sectionId}-personalization-sr-title`;
  const headingClassName = showVisibleHeading ? "mb-6" : "sr-only";

  return (
    <Box
      {...(isWeb
        ? { id: sectionId, "aria-labelledby": headingId }
        : { nativeID: sectionId, accessibilityLabel: screenReaderHeading })}
      className={className}
    >
      <Card border="light" padding="lg" hover={false} className="w-full">
        <Title {...(isWeb ? { id: headingId } : {})} as="h2" size="md" className={headingClassName}>
          {screenReaderHeading}
        </Title>
        <PersonalizationSectionLayoutContext.Provider
          value={{
            hideStepHeadings: true,
            panelShowsVisibleHeading: showVisibleHeading,
            profileUiSurface,
          }}
        >
          {children}
        </PersonalizationSectionLayoutContext.Provider>
      </Card>
    </Box>
  );
}
