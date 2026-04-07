// Shared utility functions for onboarding and personalization

import type { OnboardingData } from "packages/features/profile/types/onboarding";

import { DEFAULT_REPORT_SECTIONS } from "./constants";

export type {
  ProfileSectionCompletionMap,
  ProfileSectionCompletionStatus,
  ProfileSectionId,
} from "packages/features/profile/types/profileSections";

/** True when demographics `is_agent` marks a real estate agent (aligns with server / useIsAgent). */
export function isAgentFormSelection(is_agent: string | undefined): boolean {
  return is_agent === "yes" || is_agent === "am_agent";
}

/**
 * For buyer-preference UI (optional callouts): true if the auth user is an agent or the form
 * draft says agent (onboarding before store updates).
 */
export function effectiveIsAgentForOptionalBuyerUi(options: {
  authIsAgent: boolean;
  formIsAgent?: string;
}): boolean {
  return options.authIsAgent || isAgentFormSelection(options.formIsAgent);
}

type SetStateAction<S> = S | ((prevState: S) => S);
type Dispatch<A> = (value: A) => void;

/**
 * Updates form data with a new field value
 */
export const updateFormData = <T extends OnboardingData>(
  prevData: T,
  field: keyof T,
  value: unknown
): T => {
  return { ...prevData, [field]: value };
};

/**
 * Manages dropdown open/close state
 */
export const createDropdownManager = () => {
  const toggleDropdown = (
    fieldName: string,
    setOpenDropdowns: Dispatch<SetStateAction<{ [key: string]: boolean }>>
  ) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const closeAllDropdowns = (
    setOpenDropdowns: Dispatch<SetStateAction<{ [key: string]: boolean }>>
  ) => {
    setOpenDropdowns({});
  };

  return { toggleDropdown, closeAllDropdowns };
};

/**
 * Creates and manages dropdown refs
 */
export const createDropdownRefManager = () => {
  const dropdownRefs: { [key: string]: unknown } = {};

  const getDropdownRef = (fieldName: string) => {
    dropdownRefs[fieldName] ??= { current: null };
    return dropdownRefs[fieldName];
  };

  return { dropdownRefs, getDropdownRef };
};

/**
 * Get ordered report sections in fixed order (no user preferences)
 */
export const getOrderedReportSections = (_formData?: OnboardingData) => {
  return DEFAULT_REPORT_SECTIONS;
};

export {
  getProfileSectionCompletion,
  navigateToMissingFieldSection,
} from "./profileSectionCompletion";
