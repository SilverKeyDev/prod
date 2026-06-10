/** Calendar feature barrel. Other features must import from here, not from calendar internals. */
export { Calendar, CalendarConnectionPrompt, EventRequestCard, UpcomingEvents } from "./components";
export type { AgendaTodoFormSubmitPayload } from "./components/view/agenda/AgendaTodoModal";
export { AgendaTodoModal } from "./components/view/agenda/AgendaTodoModal";
export { TodoAgendaRow } from "./components/view/agenda/TodoAgendaRow";
export { CreateEventModal } from "./components/view/eventModal/CreateEventModal";
export type { AgendaTodoDTO } from "./types/agenda";
export type { CreateEventModalAddWithoutSchedulePayload } from "./types/createEventModal";
export type { GoogleCalendarEventCreateBody, GoogleEvent } from "./types/googleEvent";
export { sortCompletedAgendaTodosForDisplay } from "./utils/agenda/mergeUpcomingAgenda";
export { getCalendarColorMap } from "./utils/core/calendar";
export {
  CALENDAR_EVENT_KIND_ORDER,
  CALENDAR_EVENT_KINDS,
  type CalendarEventKindId,
} from "./utils/createEventModal/calendarEventKinds";
export { defaultCreateEventTimedRange } from "./utils/createEventModal/createEventModalDefaults";
export { defaultGoogleMeetForCreate } from "./utils/createEventModal/defaultGoogleMeetForCreate";
export {
  buildCreateEventGoogleStartEnd,
  googleAllDayEndExclusiveToInclusiveEndYmd,
  inclusiveRangeToGoogleAllDayDates,
  quantizeHourMinute,
} from "packages/utils/comms/calendar/createEvent/eventFormGooglePayload";
export {
  eventSpansMultipleLocalDays,
  getEventEndDate,
  getEventFirstLocalDayKey,
  getEventLocalDayKeys,
  getEventStartDate,
} from "packages/utils/comms/calendar/parsing/eventParsing";
