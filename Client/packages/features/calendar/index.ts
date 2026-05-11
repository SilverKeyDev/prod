/** Calendar feature barrel. Other features must import from here, not from calendar internals. */
export { Calendar, CalendarConnectionPrompt, EventRequestCard, UpcomingEvents } from "./components";
export { TodoAgendaRow } from "./components/view/agenda/TodoAgendaRow";
export { CreateEventModal } from "./components/view/eventModal/CreateEventModal";
export type { AgendaTodoDTO } from "./types/agenda";
export type { CreateEventModalAddWithoutSchedulePayload } from "./types/createEventModal";
export type { GoogleCalendarEventCreateBody, GoogleEvent } from "./types/googleEvent";
export { sortCompletedAgendaTodosForDisplay } from "./utils/agenda/mergeUpcomingAgenda";
export { buildAgentTodoGoogleEvent, parseAgendaDeadlineTime } from "./utils/core/agentTaskEvent";
export { getCalendarColorMap } from "./utils/core/calendar";
export {
  eventSpansMultipleLocalDays,
  getEventEndDate,
  getEventFirstLocalDayKey,
  getEventLocalDayKeys,
  getEventStartDate,
} from "./utils/parsing/eventParsing";
export {
  buildCreateEventGoogleStartEnd,
  googleAllDayEndExclusiveToInclusiveEndYmd,
  inclusiveRangeToGoogleAllDayDates,
  quantizeHourMinute,
} from "packages/utils/calendar/eventFormGooglePayload";
