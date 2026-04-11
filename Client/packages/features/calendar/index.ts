/** Calendar feature barrel. Other features must import from here, not from calendar internals. */
export {
  Calendar,
  CalendarConnectionPrompt,
  EventRequestCard,
  UpcomingEvents,
} from "./components";
export { CreateEventModal } from "./components/view/CreateEventModal";
export type { AgendaTodoDTO } from "./types/agenda";
export type { CreateEventModalAddWithoutSchedulePayload } from "./types/createEventModal";
export type {
  GoogleCalendarEventCreateBody,
  GoogleEvent,
} from "./types/googleEvent";
export {
  buildAgentTodoGoogleEvent,
  parseAgendaDeadlineTime,
} from "./utils/agentTaskEvent";
export {
  filterCalendarsToAgentOwned,
  findSilverKeyCalendar,
} from "./utils/calendar";
export {
  buildCreateEventGoogleStartEnd,
  googleAllDayEndExclusiveToInclusiveEndYmd,
  inclusiveRangeToGoogleAllDayDates,
  quantizeHourMinute,
} from "./utils/eventFormGooglePayload";
export {
  eventSpansMultipleLocalDays,
  getEventEndDate,
  getEventFirstLocalDayKey,
  getEventLocalDayKeys,
  getEventStartDate,
} from "./utils/eventParsing";
export { sortCompletedAgendaTodosForDisplay } from "./utils/mergeUpcomingAgenda";
