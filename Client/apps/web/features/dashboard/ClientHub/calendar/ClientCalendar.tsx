import { Calendar } from "@/features/dashboard/calendar/Calendar";

type ClientCalendarProps = {
  userId: string;
};

export default function ClientCalendar({
  userId: _userId,
}: ClientCalendarProps) {
  // Note: Calendar component currently works with the authenticated user's data.
  // Backend API needs to support userId parameter to fetch calendar events for a specific user
  return (
    <div className="mt-4">
      <Calendar />
    </div>
  );
}
