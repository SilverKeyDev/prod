/** User preferences blob (app-level, API-shaped). */
export type UserPreferences = {
  demographics?: unknown;
  financial_profile?: unknown;
  housing_preferences?: unknown;
  location_preferences?: unknown;
  lifestyle_preferences?: unknown;
  behavioral_patterns?: unknown;
  real_estate?: unknown;
  agent_preferences?: unknown;
  values?: unknown;
  emotional_signals?: unknown;
  [key: string]: unknown;
};
