export type CalendarQuickCreatePointerHit =
  | { kind: "popover" }
  | { kind: "week-event"; id: string }
  | { kind: "month-event"; id: string }
  | { kind: "week-empty"; column: Element; ymd: string }
  | { kind: "month-day"; dayKey: string; el: Element }
  | { kind: "other" };

export function classifyQuickCreatePointerTarget(
  target: EventTarget | null
): CalendarQuickCreatePointerHit {
  if (!(target instanceof Node)) {
    return { kind: "other" };
  }
  if (
    target instanceof Element &&
    (target.closest("[data-silverkey-quick-event-popover]") ||
      target.closest("[data-silverkey-create-event-form-popover]"))
  ) {
    return { kind: "popover" };
  }
  const weekEvent = target instanceof Element ? target.closest("[data-calendar-week-event]") : null;
  const weekEventId = weekEvent?.getAttribute("data-calendar-week-event-id");
  const weekCol =
    target instanceof Element ? target.closest("[data-calendar-week-time-column]") : null;
  const monthEvent =
    target instanceof Element ? target.closest("[data-calendar-month-event]") : null;
  const monthEventId = monthEvent?.getAttribute("data-calendar-month-event-id");
  const monthDay = target instanceof Element ? target.closest("[data-calendar-month-day]") : null;

  if (weekEventId) {
    return { kind: "week-event", id: weekEventId };
  }
  if (monthEventId) {
    return { kind: "month-event", id: monthEventId };
  }
  if (weekCol) {
    const ymd = weekCol.getAttribute("data-calendar-week-ymd");
    if (ymd) {
      return { kind: "week-empty", column: weekCol, ymd };
    }
  }
  if (monthDay) {
    const key = monthDay.getAttribute("data-calendar-month-day");
    if (key) {
      return { kind: "month-day", dayKey: key, el: monthDay };
    }
  }
  return { kind: "other" };
}
