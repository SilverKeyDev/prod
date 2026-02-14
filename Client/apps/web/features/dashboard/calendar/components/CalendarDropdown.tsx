import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Button, OliveCheckbox } from "../../../../components/ui";
import type { GoogleCalendar } from "../../../../../../packages/config/api";

type CalendarDropdownProps = {
  calendars: GoogleCalendar[];
  enabledCalendarIds: Set<string>;
  onToggleCalendar: (calendarId: string, enabled: boolean) => void;
  silverKeyCalendarId?: string | null;
};

export function CalendarDropdown({
  calendars,
  enabledCalendarIds,
  onToggleCalendar,
  silverKeyCalendarId,
}: CalendarDropdownProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleToggleCalendar = (calendarId: string, enabled: boolean) => {
    onToggleCalendar(calendarId, enabled);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="h-8 w-8 p-0"
        aria-label="Calendar settings"
      >
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </Button>
      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-1 w-64 rounded-lg border border-gray-300 bg-white shadow-lg z-[100]">
          <div className="p-2">
            <div className="mb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Calendars
            </div>
            <div className="space-y-1">
              {calendars.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-gray-500">
                  No calendars available
                </div>
              ) : (
                // Sort calendars to put SilverKey first
                [...calendars]
                  .sort((a, b) => {
                    const aIsSilverKey = silverKeyCalendarId === a.id;
                    const bIsSilverKey = silverKeyCalendarId === b.id;
                    if (aIsSilverKey && !bIsSilverKey) return -1;
                    if (!aIsSilverKey && bIsSilverKey) return 1;
                    return 0;
                  })
                  .map((calendar) => {
                    const isEnabled = enabledCalendarIds.has(calendar.id);
                    const isSilverKey = silverKeyCalendarId === calendar.id;
                    const isDisabled = isSilverKey; // SilverKey calendar cannot be disabled

                    return (
                      <div
                        key={calendar.id}
                        className={`flex items-center justify-between gap-2 rounded px-2 py-2 ${
                          isDisabled
                            ? "opacity-60 cursor-not-allowed"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`flex-1 text-sm truncate ${
                            isSilverKey
                              ? "text-amber-600 font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          {calendar.summary}
                          {isSilverKey && (
                            <span className="ml-1 text-xs text-amber-500">
                              (Required)
                            </span>
                          )}
                        </span>
                        <div
                          className={
                            isDisabled ? "opacity-50 cursor-not-allowed" : ""
                          }
                        >
                          <OliveCheckbox
                            checked={isEnabled}
                            onToggle={() => {
                              if (!isDisabled) {
                                handleToggleCalendar(calendar.id, !isEnabled);
                              }
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
