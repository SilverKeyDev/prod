export type ProfileSectionId =
  | "demographics"
  | "housing_essentials"
  | "housing_ranges"
  | "location"
  | "search_property"
  | "financial"
  | "agent_brokerage"
  | "agent_licensing"
  | "agent_profile"
  | "availability"
  | "privacy_data";

export type ProfileSectionCompletionStatus = "empty" | "needs_attention" | "complete";

export type ProfileSectionCompletionMap = Record<ProfileSectionId, ProfileSectionCompletionStatus>;
