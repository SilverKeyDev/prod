import type { Dispatch, SetStateAction } from "react";

import type { CreateEventModalAddWithoutSchedulePayload } from "packages/features/calendar";
import { Calendar, CreateEventModal } from "packages/features/calendar";

import type { Calendar as CalendarModel } from "@/features/calendar/types/calendar";

export type DashboardCalendarPanelProps = {
  showAddButton: boolean;
  createEventModalOpen: boolean;
  setCreateEventModalOpen: Dispatch<SetStateAction<boolean>>;
  scopedCalendars: CalendarModel[];
  defaultCalendarId: string | null;
  refreshEvents: () => Promise<unknown>;
  onAddWithoutSchedule: (payload: CreateEventModalAddWithoutSchedulePayload) => Promise<void>;
};

export default function DashboardCalendarPanel({
  showAddButton,
  createEventModalOpen,
  setCreateEventModalOpen,
  scopedCalendars,
  defaultCalendarId,
  refreshEvents,
  onAddWithoutSchedule,
}: DashboardCalendarPanelProps) {
  return (
    <>
      <Calendar />
      {showAddButton ? (
        <CreateEventModal
          isOpen={createEventModalOpen}
          onClose={() => setCreateEventModalOpen(false)}
          calendars={scopedCalendars}
          defaultCalendarId={defaultCalendarId}
          onEventCreated={() => void refreshEvents()}
          onAddWithoutSchedule={onAddWithoutSchedule}
        />
      ) : null}
    </>
  );
}
