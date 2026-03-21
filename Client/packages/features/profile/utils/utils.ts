// Shared utility functions for onboarding and personalization

import { DEFAULT_REPORT_SECTIONS } from "./constants";
import type { OnboardingData } from "./types";

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
    setOpenDropdowns: Dispatch<SetStateAction<{ [key: string]: boolean }>>,
  ) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const closeAllDropdowns = (
    setOpenDropdowns: Dispatch<SetStateAction<{ [key: string]: boolean }>>,
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
  const lower = missingField.toLowerCase();
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
  } else if (lower.includes("real estate agent")) {
    setActiveSection("demographics");
  } else if (
    lower.includes("brokerage") ||
    lower.includes("physical mailing") ||
    (lower.includes("bic") && lower.includes("brokerage"))
  ) {
    setActiveSection("agent_brokerage");
  } else if (
    lower.includes("licensed state") ||
    lower.includes("license number") ||
    lower.includes("license type") ||
    lower.includes("license expiration")
  ) {
    setActiveSection("agent_licensing");
  } else if (
    lower.includes("bio") ||
    lower.includes("specialt") ||
    lower.includes("primary service")
  ) {
    setActiveSection("agent_profile");
  } else if (
    lower.includes("communication") ||
    lower.includes("information detail") ||
    lower.includes("buyer") ||
    lower.includes("looking for")
  ) {
    setActiveSection("demographics");
  }
};

export type ProfileSectionId =
  | "demographics"
  | "housing"
  | "location"
  | "financial"
  | "agent_brokerage"
  | "agent_licensing"
  | "agent_profile";

export type ProfileSectionCompletionStatus =
  | "empty"
  | "needs_attention"
  | "complete";

export type ProfileSectionCompletionMap = Record<
  ProfileSectionId,
  ProfileSectionCompletionStatus
>;

export const getProfileSectionCompletion = (
  formData: OnboardingData,
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
    formData.preferred_home_age_min != null ||
    formData.preferred_home_age_max != null;
  const hasHousingComplete =
    formData.preferred_bedrooms != null ||
    formData.preferred_bathrooms != null ||
    formData.preferred_sqft_min != null ||
    formData.preferred_sqft_max != null;

  const hasLocationAny =
    Array.isArray(formData.important_locations) &&
    formData.important_locations.some(
      (loc) => (loc?.address ?? "").toString().trim().length > 0,
    );

  const idealZip =
    typeof formData.ideal_zip_code === "string"
      ? formData.ideal_zip_code.trim()
      : "";
  const hasFinancialAny =
    formData.gross_income != null ||
    formData.down_payment != null ||
    idealZip.length > 0 ||
    formData.credit_score_range != null;
  const hasFinancialComplete =
    formData.gross_income != null &&
    formData.down_payment != null &&
    idealZip.length > 0;

  const isAgent = isAgentFormSelection(formData.is_agent);

  const nonEmptyStr = (v: unknown): boolean =>
    typeof v === "string" && v.trim().length > 0;
  const tagArrayAny = (v: unknown): boolean =>
    Array.isArray(v) &&
    v.some((x) => typeof x === "string" && x.trim().length > 0);

  const hasBrokerageAny =
    isAgent &&
    (nonEmptyStr(formData.agent_brokerage_name) ||
      nonEmptyStr(formData.agent_brokerage_bic_name) ||
      nonEmptyStr(formData.agent_brokerage_address) ||
      nonEmptyStr(formData.agent_brokerage_email) ||
      nonEmptyStr(formData.agent_brokerage_phone) ||
      nonEmptyStr(formData.agent_physical_mailing_address));
  const hasBrokerageComplete =
    isAgent && nonEmptyStr(formData.agent_brokerage_name);

  const hasLicensingAny =
    isAgent &&
    (tagArrayAny(formData.agent_licensed_states) ||
      tagArrayAny(formData.agent_license_numbers) ||
      tagArrayAny(formData.agent_license_types) ||
      tagArrayAny(formData.agent_license_expiration_dates));
  const hasLicensingComplete =
    isAgent && tagArrayAny(formData.agent_license_numbers);

  const hasProfileAny =
    isAgent &&
    (nonEmptyStr(formData.agent_bio) ||
      tagArrayAny(formData.agent_primary_service_zips) ||
      tagArrayAny(formData.agent_specialties));
  const hasProfileComplete = hasProfileAny;

  const statusFor = (
    hasAny: boolean,
    isComplete: boolean,
  ): ProfileSectionCompletionStatus => {
    if (!hasAny) return "empty";
    if (isComplete) return "complete";
    return "needs_attention";
  };

  const base: ProfileSectionCompletionMap = {
    demographics: statusFor(hasDemographicsAny, hasDemographicsComplete),
    housing: statusFor(hasHousingAny, hasHousingComplete),
    location: statusFor(hasLocationAny, hasLocationAny),
    financial: statusFor(hasFinancialAny, hasFinancialComplete),
    agent_brokerage: statusFor(hasBrokerageAny, hasBrokerageComplete),
    agent_licensing: statusFor(hasLicensingAny, hasLicensingComplete),
    agent_profile: statusFor(hasProfileAny, hasProfileComplete),
  };
  return base;
};
