/** Optional user profile; when provided, name and roles sync from auth (source of truth). */
export type UserProfileForSync =
  | { name?: string | null; roles?: readonly string[] }
  | null
  | undefined;
