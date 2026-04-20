/** Calendar feature barrel. Other features must import from here, not from calendar internals. */
export { Calendar, CalendarConnectionPrompt, EventRequestCard, UpcomingEvents } from "./components";
export { CreateEventModal } from "./components/view/CreateEventModal";
export type { AgendaTodoDTO } from "./types/agenda";
export type { CreateEventModalAddWithoutSchedulePayload } from "./types/createEventModal";
export type { GoogleCalendarEventCreateBody, GoogleEvent } from "./types/googleEvent";
export { sortCompletedAgendaTodosForDisplay } from "./utils/agenda/mergeUpcomingAgenda";
export { buildAgentTodoGoogleEvent, parseAgendaDeadlineTime } from "./utils/core/agentTaskEvent";
export { getCalendarColorMap } from "./utils/core/calendar";
export {
  buildCreateEventGoogleStartEnd,
  googleAllDayEndExclusiveToInclusiveEndYmd,
  inclusiveRangeToGoogleAllDayDates,
  quantizeHourMinute,
} from "./utils/parsing/eventFormGooglePayload";
export {
  eventSpansMultipleLocalDays,
  getEventEndDate,
  getEventFirstLocalDayKey,
  getEventLocalDayKeys,
  getEventStartDate,
} from "./utils/parsing/eventParsing";
