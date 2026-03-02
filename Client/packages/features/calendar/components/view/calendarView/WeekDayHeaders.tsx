const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WeekDayHeaders() {
  return (
    <div className="mb-2 grid grid-cols-7 gap-1">
      {WEEK_DAYS.map((day) => (
        <div key={day} className="py-2 text-center text-xs font-semibold text-gray-600 sm:text-sm">
          {day}
        </div>
      ))}
    </div>
  );
}
