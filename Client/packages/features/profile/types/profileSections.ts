export type ProfileSectionId =
  | "demographics"
  | "availability"
  | "housing_essentials"
  | "housing_ranges"
  | "location"
  | "search_property"
  | "financial"
  | "agent_brokerage"
  | "agent_licensing"
  | "agent_profile";

export type ProfileSectionCompletionStatus = "empty" | "needs_attention" | "complete";

export type ProfileSectionCompletionMap = Record<ProfileSectionId, ProfileSectionCompletionStatus>;
