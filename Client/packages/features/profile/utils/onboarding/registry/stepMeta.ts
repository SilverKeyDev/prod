import type { ProfileStep } from "packages/features/profile/types/onboarding/onboarding";
import type { ProfileStepId } from "packages/features/profile/types/onboarding/profileStepIds";
import { SECTION_TITLES } from "packages/utils/product/domain/profile/labels";

const STEP_TITLES: Record<ProfileStepId, string> = {
  onboarding_role: SECTION_TITLES.ONBOARDING_ROLE,
  demographics: "About",
  housing_essentials: "Essentials",
  housing_ranges: "Size",
  location: "Location",
  search_property: "Features",
  financial: "Finance",
  agent_brokerage: "Brokerage",
  agent_licensing: "Licensing",
  agent_profile: "Territory",
  availability: SECTION_TITLES.AVAILABILITY,
  privacy_data: "Privacy & data",
  seller_shell_setup: "Seller setup",
  seller_property: "Property",
  seller_address: "Address",
  seller_timeline: "Timeline",
  seller_motivation: "Motivation",
  seller_pricing: "Pricing",
  seller_demographics: "About",
  renter_shell_setup: "Renter setup",
  brokerage_shell_setup: "Brokerage setup",
  integration_partner_shell_setup: "Partner setup",
  renter_budget: "Budget",
  renter_location: "Areas",
  renter_move_timeline: "Timeline",
  renter_household: "Household",
  renter_amenities: "Amenities",
  ip_org_details: "Organization",
  ip_integration_type: "Service type",
  ip_point_of_contact: "Contact",
  ip_service_area: "Service area",
  ip_agreement: "Agreement",
};

export function profileStepFromId(id: ProfileStepId): ProfileStep {
  return { id, title: STEP_TITLES[id] };
}

export function profileStepsFromIds(ids: readonly ProfileStepId[]): ProfileStep[] {
  return ids.map(profileStepFromId);
}