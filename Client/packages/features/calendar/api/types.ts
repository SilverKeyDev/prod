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

// Re-export GoogleEvent from its shim (types/googleEvent is also shimmed)
export type {
  GoogleCalendarEventCreateBody,
  GoogleEvent,
} from "packages/features/calendar/types/googleEvent";

// Re-export types from generated schema
export type GoogleCalendar = components["schemas"]["GoogleCalendar"];
export type GoogleCalendarListResponse = components["schemas"]["GoogleCalendarListResponse"];
export type GoogleEventListResponse = components["schemas"]["GoogleEventListResponse"];
export type GoogleEventCreateResponse = components["schemas"]["GoogleEventCreateResponse"];
export type DeleteEventResponse = components["schemas"]["DeleteEventResponse"];
export type GoogleCalendarApiResponse<T = unknown> = Omit<
  components["schemas"]["GoogleCalendarApiResponse"],
  "data"
> & { data?: T };
export type GoogleCalendarPermission = components["schemas"]["GoogleCalendarPermission"];
export type GoogleCalendarPermissionsResponse =
  components["schemas"]["GoogleCalendarPermissionsResponse"];
