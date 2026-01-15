// Shared utility functions for onboarding and personalization

import { DEFAULT_REPORT_SECTIONS } from "./constants";
import type { OnboardingData } from "./types";
import { log, LOG_CATEGORIES } from "../../../../../logger";

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
 * Get ordered report sections based on user preferences
 */
export const getOrderedReportSections = (formData: OnboardingData) => {
  try {
    if (!formData || !DEFAULT_REPORT_SECTIONS) {
      return [];
    }

    const priorities = formData.report_section_priorities ?? [];
    const sections = [...DEFAULT_REPORT_SECTIONS];

    // Sort sections based on priorities - included items first in priority order, excluded items at end
    const orderedSections = sections.sort((a, b) => {
      if (!a || !b || !a.key || !b.key) return 0;

      const aIncluded = priorities.includes(a.key);
      const bIncluded = priorities.includes(b.key);

      // Excluded items go to the end
      if (aIncluded !== bIncluded) {
        return aIncluded ? -1 : 1;
      }

      // For included items, use priority order
      const aPriority = priorities.indexOf(a.key);
      const bPriority = priorities.indexOf(b.key);

      // Items not in priorities should come after items in priorities
      if (aPriority === -1 && bPriority === -1) return 0;
      if (aPriority === -1) return 1; // A comes after B
      if (bPriority === -1) return -1; // B comes after A

      return aPriority - bPriority;
    });

    return orderedSections;
  } catch (error: unknown) {
    log.error(LOG_CATEGORIES.ERRORS, "Error in getOrderedReportSections", error);
    return [];
  }
};

/**
 * Handle report section toggle for drag and drop lists
 */
export const handleReportSectionToggle = (
  sectionKey: string,
  checked: boolean,
  formData: OnboardingData,
  updateFormData: (field: keyof OnboardingData, value: unknown) => void,
) => {
  const currentPriorities = formData.report_section_priorities ?? [];

  if (!checked) {
    // Remove from priorities when unchecked
    const newPriorities = currentPriorities.filter((key) => key !== sectionKey);
    updateFormData("report_section_priorities", newPriorities);
  } else {
    // Add to last priority (bottom of list) when checked (if not already there)
    if (!currentPriorities.includes(sectionKey)) {
      // Add to the end of the list (last priority)
      updateFormData("report_section_priorities", [
        ...currentPriorities,
        sectionKey,
      ]);
    }
  }
};

/**
 * Navigate to section based on missing field type
 */
export const navigateToMissingFieldSection = (
  missingField: string,
  setActiveSection: (section: string) => void,
) => {
  if (missingField.includes("report")) {
    setActiveSection("reportcustomization");
  } else if (
    missingField.includes("Age") ??
    missingField.includes("Gender") ??
    missingField.includes("Occupation") ??
    missingField.includes("Pet")
  ) {
    setActiveSection("demographics");
  } else if (
    missingField.includes("income") ??
    missingField.includes("budget") ??
    missingField.includes("credit") ??
    missingField.includes("payment")
  ) {
    setActiveSection("financial");
  } else if (
    missingField.includes("housing") ??
    missingField.includes("bedroom") ??
    missingField.includes("bathroom") ??
    (missingField.includes("lot") ||
      missingField.includes("home") ||
      missingField.includes("renovation") ||
      missingField.includes("property"))
  ) {
    setActiveSection("housing");
  } else if (
    missingField.includes("location") ??
    missingField.includes("walkability")
  ) {
    setActiveSection("location");
  } else if (
    missingField.includes("communication") ??
    missingField.includes("agent")
  ) {
    setActiveSection("communication");
  }
};
