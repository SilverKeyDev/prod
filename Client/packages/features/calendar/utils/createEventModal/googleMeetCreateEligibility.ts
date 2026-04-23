/**
 * Whether the Add to Agenda (create) modal should show the Google Meet toggle:
 * timed schedule only — not unscheduled, not all-day.
 */
export function showGoogleMeetToggleForCreate(params: {
  mode: "create" | "edit";
  startDate: string;
  endDate: string;
  isAllDay: boolean;
}): boolean {
  const rawStart = params.startDate.trim();
  const rawEnd = params.endDate.trim();
  const scheduleStartYmd = rawStart || rawEnd;
  const scheduleEndYmd = rawEnd || rawStart || scheduleStartYmd;
  const hasScheduleForMeetToggle = Boolean(scheduleStartYmd && scheduleEndYmd);
  return params.mode === "create" && hasScheduleForMeetToggle && !params.isAllDay;
}
