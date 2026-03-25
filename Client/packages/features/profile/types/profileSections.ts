export type ProfileSectionId =
  | "demographics"
  | "housing"
  | "location"
  | "financial"
  | "agent_brokerage"
  | "agent_licensing"
  | "agent_profile";

export type ProfileSectionCompletionStatus = "empty" | "needs_attention" | "complete";

export type ProfileSectionCompletionMap = Record<ProfileSectionId, ProfileSectionCompletionStatus>;
