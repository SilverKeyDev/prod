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
  getEvent: events.getEvent,
  createEvent: events.createEvent,
  updateEvent: events.updateEvent,
  deleteEvent: events.deleteEvent,
  queryFreebusy: scheduling.queryFreebusy,
  getClientAvailability: scheduling.getClientAvailability,
  getClientEvents: scheduling.getClientEvents,
  getPermissions: permissions.getPermissions,
};
