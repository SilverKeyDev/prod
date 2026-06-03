/** Optional user profile; when provided, name is synced from profile (auth source of truth). */
export type UserProfileForSync = { name?: string | null } | null | undefined;
