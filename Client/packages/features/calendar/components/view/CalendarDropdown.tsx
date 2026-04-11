import { useEffect, useRef, useState } from "react";

import { Icon } from "@ui/icons";

import type { GoogleCalendar } from "packages/config/http/api";
import { Box } from "packages/ui/components/primitives";
import { getDocument } from "packages/utils/platform";

import { BodyText, Button, OliveCheckbox } from "@/components/ui";
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
  // Close dropdown when clicking outside (platform doc for RN parity)
  useEffect(() => {
    const doc = getDocument();
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen && doc)
      doc.addEventListener("mousedown", handleClickOutside);
    return () => {
      if (doc) doc.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);
  const handleToggleCalendar = (calendarId: string, enabled: boolean) => {
    onToggleCalendar(calendarId, enabled);
  };
  return (
    <Box className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="h-8 w-8 p-0"
        label="Calendar settings"
      >
        <Icon name="chevron-down" className="text-text-secondary h-4 w-4" />
      </Button>
      {isDropdownOpen && (
        <Box className="border-border bg-background-surface z-dropdown absolute right-0 top-full mt-1 w-64 rounded-lg border shadow-lg">
          <Box className="p-2">
            <Box className="text-text-secondary mb-2 px-2 text-xs font-semibold uppercase tracking-wide">
              Calendars
            </Box>
            <Box className="space-y-1">
              {calendars.length === 0 ? (
                <Box className="text-text-secondary px-2 py-4 text-center text-sm">
                  No calendars available
                </Box>
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
                      <Box
                        key={calendar.id}
                        className={`flex items-center justify-between gap-2 rounded px-2 py-2 ${
                          isDisabled
                            ? "cursor-not-allowed opacity-60"
                            : "hover:bg-primary-muted"
                        }`}
                      >
                        <BodyText
                          as="span"
                          size="sm"
                          className={`flex-1 truncate ${
                            isSilverKey
                              ? "font-medium text-amber-600"
                              : "text-text-primary"
                          }`}
                        >
                          {calendar.summary}
                          {isSilverKey && (
                            <BodyText
                              as="span"
                              size="xs"
                              className="ml-1 text-amber-500"
                            >
                              (Required)
                            </BodyText>
                          )}
                        </BodyText>
                        <Box
                          className={
                            isDisabled ? "cursor-not-allowed opacity-50" : ""
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
                        </Box>
                      </Box>
                    );
                  })
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
