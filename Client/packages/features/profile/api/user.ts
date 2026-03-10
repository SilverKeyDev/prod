/**
 * Profile user/preferences API - thin re-export from config for architecture boundary.
 * Only feature api/ may import packages/config/api.
 */
export { preferencesApi, userApi } from "packages/config/http/api";
