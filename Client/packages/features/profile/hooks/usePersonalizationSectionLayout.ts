import { createContext, useContext } from "react";

import type { ProfileUiSurface } from "packages/features/profile/types/visibility/profileVisibility";

export type PersonalizationSectionLayoutValue = {
  /** When true, section bodies should not repeat the step title (card heading shows it). */
  hideStepHeadings: boolean;
  /** When false, the card heading is visually hidden; bodies should show their own primary title. */
  panelShowsVisibleHeading: boolean;
  /** Drives agent-only buyer callouts (onboarding only). */
  profileUiSurface: ProfileUiSurface;
};

export const PersonalizationSectionLayoutContext = createContext<PersonalizationSectionLayoutValue>(
  {
    hideStepHeadings: false,
    panelShowsVisibleHeading: true,
    profileUiSurface: "personalization",
  }
);

/**
 * When true, render the section body's own step-level title; when false, the card already shows it visibly.
 */

export function useShowPersonalizationSectionBodyTitle(): boolean {
  const { hideStepHeadings, panelShowsVisibleHeading } = useContext(
    PersonalizationSectionLayoutContext
  );
  return !hideStepHeadings || !panelShowsVisibleHeading;
}

/** Profile vs onboarding vs settings — controls agent-only buyer callout visibility. */

export function useProfileUiSurface(): ProfileUiSurface {
  return useContext(PersonalizationSectionLayoutContext).profileUiSurface;
}
