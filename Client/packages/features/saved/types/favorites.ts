/**
 * Re-exports favorite-homes API types from the shared API barrel (`packages/api`).
 */
export type {
  AddFavoriteRequest as AddFavoriteHomeRequest,
  FavoriteHomesReplaceResponse as FavoriteHomeMutationResponse,
  FavoriteHomesResponse,
  RemoveFavoriteRequest as RemoveFavoriteHomeRequest,
} from "packages/api";
