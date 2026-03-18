import { parseHousingTypes } from "./constants";
import type { OnboardingData } from "./types";

/**
 * Fields that must be filled for the housing step to be considered "complete".
 * All other housing inputs (sliders, optional dropdowns/tags) can be empty.
 */
const HOUSING_REQUIRED_FIELDS: (keyof OnboardingData)[] = [
  "preferred_bedrooms",
  "preferred_bathrooms",
  "preferred_housing_type",
];

/**
 * Returns true when every field on the given onboarding step is filled.
 * Used to show "Skip" (white) vs "Next" (primary): when not complete, show Skip.
 * Demographics (About You) never shows Skip regardless of completion.
 */
export function isOnboardingStepComplete(
  formData: OnboardingData,
  stepId: string
): boolean {
  switch (stepId) {
    case "demographics":
      return true; // Not used for skip; About You has no skip option.
    case "housing": {
      for (const key of HOUSING_REQUIRED_FIELDS) {
        const value = formData[key];
        if (key === "preferred_housing_type") {
          const parsed = parseHousingTypes(value as string | undefined);
          if (parsed.length === 0) return false;
          continue;
        }
        if (value === undefined || value === null) return false;
        if (typeof value === "number") continue;
        if (typeof value === "string" && value.trim() === "") return false;
      }
      return true;
    }
    case "location": {
      const locations = formData.important_locations;
      if (!locations || locations.length === 0) return false;
      return locations.every((loc) => loc?.address?.trim() !== "");
    }
    default:
      return true;
  }
}
