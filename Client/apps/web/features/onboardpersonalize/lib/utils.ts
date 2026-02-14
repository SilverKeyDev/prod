// Shared utility functions for onboarding and personalization

import { DEFAULT_REPORT_SECTIONS } from "./constants";
import type { OnboardingData } from "./types";

/**
 * Updates form data with a new field value
 */
export const updateFormData = <T extends OnboardingData>(
  prevData: T,
  field: keyof T,
  value: unknown,
): T => {
  return { ...prevData, [field]: value };
};

/**
 * Manages dropdown open/close state
 */
export const createDropdownManager = () => {
  const toggleDropdown = (
    fieldName: string,
    setOpenDropdowns: React.Dispatch<
      React.SetStateAction<{ [key: string]: boolean }>
    >,
  ) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const closeAllDropdowns = (
    setOpenDropdowns: React.Dispatch<
      React.SetStateAction<{ [key: string]: boolean }>
    >,
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

/**
 * Navigate to section based on missing field type
 */
export const navigateToMissingFieldSection = (
  missingField: string,
  setActiveSection: (section: string) => void,
) => {
  if (
    missingField.includes("Age") ||
    missingField.includes("Gender") ||
    missingField.includes("Occupation") ||
    missingField.includes("Pet")
  ) {
    setActiveSection("demographics");
  } else if (
    missingField.includes("income") ||
    missingField.includes("budget") ||
    missingField.includes("credit") ||
    missingField.includes("payment")
  ) {
    setActiveSection("financial");
  } else if (
    missingField.includes("housing") ||
    missingField.includes("bedroom") ||
    missingField.includes("bathroom") ||
    missingField.includes("lot") ||
    missingField.includes("home") ||
    missingField.includes("renovation") ||
    missingField.includes("property")
  ) {
    setActiveSection("housing");
  } else if (
    missingField.includes("location") ||
    missingField.includes("walkability")
  ) {
    setActiveSection("location");
  } else if (
    missingField.includes("communication") ||
    missingField.includes("agent")
  ) {
    setActiveSection("communication");
  }
};
