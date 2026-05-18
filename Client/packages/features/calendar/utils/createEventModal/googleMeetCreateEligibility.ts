/**
 * Whether a Google Calendar create should attach Meet (`addGoogleMeet` on the insert body).
 * Timed schedule only — not unscheduled, not all-day. (The Add to Agenda UI shows the Meet
 * toggle whenever you are creating; submit uses this to decide when Meet actually applies.)
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
