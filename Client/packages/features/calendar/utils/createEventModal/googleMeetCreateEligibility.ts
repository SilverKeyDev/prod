/**
 * Whether the virtual-meeting toggle should appear and `addGoogleMeet` may be sent.
 * Timed schedule only — not unscheduled, not all-day.
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
  return hasScheduleForMeetToggle && !params.isAllDay;
}
