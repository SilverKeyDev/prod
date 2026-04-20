/**
 * MIGRATION SHIM (DO NOT ADD NEW TYPES HERE)
 *
 * API types are now generated from openapi.yaml via api.generated.ts.
 * This file contains UI-level types that augment the API schema.
 *
 * For API contract types:
 * 1. Edit openapi.yaml
 * 2. Run `pnpm generate:api-types`
 * 3. Types auto-generated in packages/types/api.generated.ts
 *
 * User preferences blob (app-level, API-shaped).
 *
 * This type represents the flattened API shape of user preferences as sent/received
 * from the server. The server stores preferences in a normalized schema across
 * multiple tables (user_demographics, user_financials, user_search_intent, etc.)
 * but presents them as a single flattened object to the client.
 *
 * Sections:
 * - demographics: Age range, household size, income, move-in timeline
 * - financial_profile: Budget, down payment, credit score, loan pre-approval
 * - housing_preferences: Bedrooms, bathrooms, housing type, home age, sqft
 * - location_preferences: Important locations, commute tolerances
 * - lifestyle_preferences: Features, must-haves, deal-breakers
 * - behavioral_patterns: Search patterns, engagement history
 * - real_estate: Property preferences, listing types
 * - agent_preferences: Communication preferences, agent relationship
 * - values: Life values and priorities
 * - emotional_signals: Emotional state and motivations
 *
 * Server Field Mapping:
 * - See `Server/app/models/user/` for database models
 * - See `Server/app/services/aggregation/preferences_aggregation_write.py` for write pipeline
 * - See `.cursor/rules/shared/user-preferences-schema.mdc` for full schema contract
 *
 * Extensibility:
 * - Index signature allows additional fields for future expansion
 * - New fields added to `extended_buyer_preferences` JSON column on server
 * - Client remains backward-compatible (missing fields = defaults)
 *
 * Sync:
 * - Form state <-> API via `packages/features/profile/utils/onboarding/profileFormSync.ts`
 * - `syncApiToFormState`: API → structured form sections
 * - `syncFormStateToApi`: Form → flattened API payload
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
