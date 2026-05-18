import React, { createContext, useContext } from "react";

import type { ProfileUiSurface } from "packages/features/profile/types/profileVisibility";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";
import Title from "packages/ui/components/text/Title";
import { isWeb } from "packages/utils/platform";

type PersonalizationSectionLayoutValue = {
  /** When true, section bodies should not repeat the step title (card heading shows it). */
  hideStepHeadings: boolean;
  /** When false, the card heading is visually hidden; bodies should show their own primary title. */
  panelShowsVisibleHeading: boolean;
  /** Drives agent-only buyer callouts (onboarding only). */
  profileUiSurface: ProfileUiSurface;
};

const PersonalizationSectionLayoutContext = createContext<PersonalizationSectionLayoutValue>({
  hideStepHeadings: false,
  panelShowsVisibleHeading: true,
  profileUiSurface: "personalization",
});

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

/** @deprecated Prefer {@link useShowPersonalizationSectionBodyTitle}. */
// eslint-disable-next-line react-refresh/only-export-components -- hook paired with Provider above
export function useHidePersonalizationStepHeading(): boolean {
  return useContext(PersonalizationSectionLayoutContext).hideStepHeadings;
}

/**
 * When true, render the section body's own step-level title; when false, the card already shows it visibly.
 */
// eslint-disable-next-line react-refresh/only-export-components -- hook paired with Provider above
export function useShowPersonalizationSectionBodyTitle(): boolean {
  const { hideStepHeadings, panelShowsVisibleHeading } = useContext(
    PersonalizationSectionLayoutContext
  );
  return !hideStepHeadings || !panelShowsVisibleHeading;
}

/** Profile vs onboarding vs settings — controls agent-only buyer callout visibility. */
// eslint-disable-next-line react-refresh/only-export-components -- hook paired with Provider above
export function useProfileUiSurface(): ProfileUiSurface {
  return useContext(PersonalizationSectionLayoutContext).profileUiSurface;
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
