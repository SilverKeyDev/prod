/** Calendar feature barrel. Other features must import from here, not from calendar internals. */
export { Calendar, CalendarConnectionPrompt, EventRequestCard, UpcomingEvents } from "./components";
export { CreateEventModal } from "./components/view/CreateEventModal";
export type { AgendaTodoDTO, AgendaTodoPriority } from "./types/agenda";
export type { GoogleEvent } from "./types/googleEvent";
export { findSilverKeyCalendar } from "./utils/calendar";
