import { DEFAULT_AUTHENTICATED_PATH } from "packages/navigation/types/routes";

/** Dashboard analytics shell; `/analytics` redirect drops query params. */
export const ANALYTICS_LEAKAGE_HREF = `${DEFAULT_AUTHENTICATED_PATH}?tab=leakage`;
