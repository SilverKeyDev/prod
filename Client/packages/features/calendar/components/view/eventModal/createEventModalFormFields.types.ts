import type { ChangeEvent } from "react";

import type { ViewingStop } from "@/features/calendar/components/viewings/ViewingStopList";
import type { CreateEventMutualAvailability } from "@/features/calendar/hooks/data/createEvent/useCreateEventMutualAvailability";
import type { Calendar } from "@/features/calendar/types/calendar";
import type { CalendarEventKindOptionSlice } from "@/features/calendar/utils/createEventModal/calendarEventKindOptions";
import type { CalendarEventKindId } from "@/features/calendar/utils/createEventModal/calendarEventKinds";
import type {
  ViewingRouteEndMode,
  ViewingRouteEndpoint,
  ViewingTourAnchor,
  ViewingTourStartSelection,
} from "@/features/calendar/utils/viewing/viewingRoutePlan";

export type CreateEventModalFormFieldsProps = {
  mode: "create" | "edit";
  calendars: Calendar[];
  selectedCalendarId: string;
  onCalendarChange: (id: string) => void;
  hideCalendarPicker?: boolean;
  eventKindId: CalendarEventKindId;
  onEventKindIdChange: (id: CalendarEventKindId) => void;
  kindOptionSlice: CalendarEventKindOptionSlice;
  checklistProgressLoading?: boolean;
  eventTitle: string;
  onEventTitleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  isAllDay: boolean;
  onIsAllDayChange: (next: boolean) => void;
  startDate: string;
  endDate: string;
  onDateRangeChange: (startYmd: string, endYmd: string) => void;
  startTime: string;
  endTime: string;
  onStartTimeChange: (hhmm: string) => void;
  onEndTimeChange: (hhmm: string) => void;
  isPropertyViewing?: boolean;
  viewingStops?: ViewingStop[];
  onViewingStopsChange?: (next: ViewingStop[]) => void;
  viewingStartSelection?: ViewingTourStartSelection;
  onViewingStartSelectionChange?: (next: ViewingTourStartSelection) => void;
  viewingEndMode?: ViewingRouteEndMode;
  onViewingEndModeChange?: (next: ViewingRouteEndMode) => void;
  viewingEndFixed?: ViewingRouteEndpoint | null;
  onViewingEndFixedChange?: (next: ViewingRouteEndpoint | null) => void;
  viewingTourAnchors?: ViewingTourAnchor[];
  eventLocation: string;
  onEventLocationChange: (value: string) => void;
  locationScriptsReady: boolean;
  loadError: string | null;
  eventDescription: string;
  onEventDescriptionChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  addGoogleMeet: boolean;
  onAddGoogleMeetChange: (next: boolean) => void;
  showGoogleMeetOption: boolean;
  mutualSchedule: CreateEventMutualAvailability | null;
  registerOutsideClickSafeTarget?: (element: HTMLElement) => () => void;
  onCalendarTimedSlotPick: (payload: { startTime: string; endTime: string }) => void;
};
