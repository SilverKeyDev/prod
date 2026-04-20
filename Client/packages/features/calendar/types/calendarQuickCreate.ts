export type CalendarQuickCreateState = {
  draftId: string;
  eventTitle: string;
  eventDescription: string;
  eventLocation: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  selectedCalendarId: string;
  selectedClientId: string | null;
  source: "week" | "month";
  /** Profile availability: when true, commit as a weekly recurring block. */
  repeatWeekly?: boolean;
};

export type CalendarQuickCreateAnchorRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};
