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
 * Google Calendar API client - handles OAuth and API operations.
 */

export type {
  DeleteEventResponse,
  GoogleCalendar,
  GoogleCalendarApiResponse,
  GoogleCalendarEventCreateBody,
  GoogleCalendarListResponse,
  GoogleCalendarPermission,
  GoogleCalendarPermissionsResponse,
  GoogleEvent,
  GoogleEventCreateResponse,
  GoogleEventListResponse,
} from "./types";

import * as calendars from "./calendars";
import * as events from "./events";
import * as oauth from "./oauth";
import * as permissions from "./permissions";
import * as scheduling from "./scheduling";
import * as viewings from "./viewings";

export const googleCalendarApi = {
  startOAuth: oauth.startOAuth,
  revokeAccess: oauth.revokeAccess,
  startOAuthWithFullScope: oauth.startOAuthWithFullScope,
  isConnected: oauth.isConnected,
  clearConnectionStatus: oauth.clearConnectionStatus,
  listCalendars: calendars.listCalendars,
  createCalendar: calendars.createCalendar,
  addCalendarAcl: calendars.addCalendarAcl,
  getOrCreateSilverKeyCalendar: calendars.getOrCreateSilverKeyCalendar,
  listEvents: events.listEvents,
  createEvent: events.createEvent,
  updateEvent: events.updateEvent,
  deleteEvent: events.deleteEvent,
  queryFreebusy: scheduling.queryFreebusy,
  getClientAvailability: scheduling.getClientAvailability,
  getClientEvents: scheduling.getClientEvents,
  getPermissions: permissions.getPermissions,
};

export const viewingsApi = viewings.viewingsApi;
