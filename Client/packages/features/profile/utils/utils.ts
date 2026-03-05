// Shared utility functions for onboarding and personalization

import { DEFAULT_REPORT_SECTIONS } from "./constants";
import type { OnboardingData } from "./types";

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

/**
 * Navigate to section based on missing field type
 */
export const navigateToMissingFieldSection = (
  missingField: string,
  setActiveSection: (section: string) => void
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
  } else if (missingField.includes("location") || missingField.includes("walkability")) {
    setActiveSection("location");
  } else if (missingField.includes("communication") || missingField.includes("agent")) {
    setActiveSection("communication");
  }
};

export type ProfileSectionId =
  | "demographics"
  | "housing"
  | "location"
  | "financial"
  | "communication";

export type ProfileSectionCompletionStatus = "empty" | "needs_attention" | "complete";

export type ProfileSectionCompletionMap = Record<ProfileSectionId, ProfileSectionCompletionStatus>;

export const getProfileSectionCompletion = (
  formData: OnboardingData
): ProfileSectionCompletionMap => {
  const name = (formData.name ?? "").toString().trim();

  const hasDemographicsAny =
    name.length > 0 ||
    formData.is_agent != null ||
    formData.age != null ||
    (formData.marital_status ?? "").toString().trim().length > 0;
  const hasDemographicsComplete = name.length > 0 && Boolean(formData.is_agent);

  const hasHousingAny =
    formData.preferred_bedrooms != null ||
    formData.preferred_bathrooms != null ||
    formData.preferred_sqft_min != null ||
    formData.preferred_sqft_max != null ||
    formData.preferred_lot_size_min != null ||
    formData.preferred_lot_size_max != null ||
    formData.preferred_home_age_max != null;
  const hasHousingComplete =
    formData.preferred_bedrooms != null ||
    formData.preferred_bathrooms != null ||
    formData.preferred_sqft_min != null ||
    formData.preferred_sqft_max != null;

  const hasLocationAny =
    Array.isArray(formData.important_locations) &&
    formData.important_locations.some((loc) => (loc?.address ?? "").toString().trim().length > 0);

  const idealZip =
    typeof formData.ideal_zip_code === "string" ? formData.ideal_zip_code.trim() : "";
  const hasFinancialAny =
    formData.gross_income != null ||
    formData.down_payment != null ||
    idealZip.length > 0 ||
    formData.credit_score_range != null;
  const hasFinancialComplete =
    formData.gross_income != null && formData.down_payment != null && idealZip.length > 0;

  const communicationFrequency =
    typeof formData.communication_frequency === "string"
      ? formData.communication_frequency.trim()
      : "";
  const informationDetailLevel =
    typeof formData.information_detail_level === "string"
      ? formData.information_detail_level.trim()
      : "";

  const hasCommunicationAny =
    communicationFrequency.length > 0 || informationDetailLevel.length > 0;
  const hasCommunicationComplete =
    communicationFrequency.length > 0 && informationDetailLevel.length > 0;

  const statusFor = (hasAny: boolean, isComplete: boolean): ProfileSectionCompletionStatus => {
    if (!hasAny) return "empty";
    if (isComplete) return "complete";
    return "needs_attention";
  };

  return {
    demographics: statusFor(hasDemographicsAny, hasDemographicsComplete),
    housing: statusFor(hasHousingAny, hasHousingComplete),
    location: statusFor(hasLocationAny, hasLocationAny),
    financial: statusFor(hasFinancialAny, hasFinancialComplete),
    communication: statusFor(hasCommunicationAny, hasCommunicationComplete),
  };
};
