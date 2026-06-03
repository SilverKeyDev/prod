/**
 * User preferences blob (app-level, API-shaped).
 *
 * Flattened API shape of user preferences as sent/received from the server.
 * See `.cursor/rules/shared/user-preferences-schema.mdc` for the full schema contract.
 */
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
