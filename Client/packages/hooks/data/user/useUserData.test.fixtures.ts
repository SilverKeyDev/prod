import type { UserPreferences, UserProfile } from "packages/types";

export const userProfileFull: UserProfile = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  has_preferences: true,
  is_agent: false,
  profile_picture_url: null,
  roles: [],
  brokerage_org_ids: null,
};

export const partialUserFromApi = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
};

export const userProfileForRefresh: UserProfile = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  has_preferences: false,
  is_agent: false,
  profile_picture_url: null,
  roles: [],
  brokerage_org_ids: null,
};

export const userPreferencesFull: UserPreferences = {
  budget_max: 500000,
  budget_min: 300000,
  preferred_bedrooms_min: 2,
  preferred_bedrooms_max: 4,
  preferred_bathrooms_min: 2,
  preferred_bathrooms_max: 3,
  important_locations: [{ address: "123 Main St", max_commute_minutes: 30 }],
};

export const userPreferencesForClient: UserPreferences = {
  budget_max: 400000,
  budget_min: 200000,
  preferred_bedrooms_min: 2,
  preferred_bedrooms_max: 4,
  preferred_bathrooms_min: 2,
  preferred_bathrooms_max: 3,
};

export const initialPreferencesForUpdate: UserPreferences = {
  budget_max: 500000,
  budget_min: 300000,
  preferred_bedrooms_min: 2,
  preferred_bedrooms_max: 4,
  preferred_bathrooms_min: 2,
  preferred_bathrooms_max: 3,
};

export const updatedPreferencesAfterMutation: UserPreferences = {
  budget_max: 600000,
  budget_min: 350000,
  preferred_bedrooms_min: 2,
  preferred_bedrooms_max: 4,
  preferred_bathrooms_min: 2,
  preferred_bathrooms_max: 3,
};
