/**
 * MIGRATION SHIM (DO NOT ADD NEW TYPES HERE)
 *
 * This file re-exports types from the generated API contract (api.generated.ts).
 * All type definitions have been moved to openapi.yaml.
 *
 * To add/modify API types:
 * 1. Edit openapi.yaml
 * 2. Run `pnpm generate:api-types`
 * 3. Types will be auto-generated in packages/types/api.generated.ts
 *
 * This shim maintains backward compatibility for existing imports.
 */

import type { components } from "packages/types/api.generated";

// Re-export types from generated schema
export type User = components["schemas"]["User"];
export type UserResponse = components["schemas"]["UserResponse"];
export type FavoriteHomesResponse =
  components["schemas"]["FavoriteHomesResponse"];
export type FavoriteHomesReplaceResponse =
  components["schemas"]["FavoriteHomesReplaceResponse"];
export type NotInterestedHomeItem =
  components["schemas"]["NotInterestedHomeItem"];
export type NotInterestedHomesResponse =
  components["schemas"]["NotInterestedHomesResponse"];
export type AddFavoriteRequest = components["schemas"]["AddFavoriteRequest"];
export type RemoveFavoriteRequest =
  components["schemas"]["RemoveFavoriteRequest"];
export type AddNotInterestedRequest =
  components["schemas"]["AddNotInterestedRequest"];
export type RemoveNotInterestedRequest =
  components["schemas"]["RemoveNotInterestedRequest"];
export type UpdateNotInterestedRequest =
  components["schemas"]["UpdateNotInterestedRequest"];
