import { Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import React from "react";

import Button from "../../components/ui/button/Button";
import { SectionBox, SectionTitle } from "../negotiate";
import type { GoogleCalendar } from "../../core/config/api";

interface CalendarListCardProps {
  calendars: GoogleCalendar[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const CalendarListCard: React.FC<CalendarListCardProps> = ({
  calendars,
  isLoading,
  error,
  onRefresh,
}) => {
  return (
    <SectionBox>
      <SectionTitle
        icon={<CalendarIcon className="mobile-icon-sm text-brown" />}
      >
        Your Calendars
      </SectionTitle>

      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw className="mobile-icon-xs" />}
          onClick={onRefresh}
          loading={isLoading}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brown"></div>
            <span className="text-responsive-sm text-gray-600">
              Loading calendars...
            </span>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-3">
          <p className="text-responsive-sm text-red-600">
            Error loading calendars: {error}
          </p>
        </div>
      ) : calendars.length > 0 ? (
        <div className="space-y-2">
          {calendars.map((calendar) => (
            <div
              key={calendar.id}
              className="flex items-center justify-between rounded-lg border border-beige p-3 hover:bg-brown/5 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{
                    backgroundColor: calendar.backgroundColor || "#4285f4",
                  }}
                />
                <div>
                  <div className="font-medium text-navy">
                    {calendar.summary}
                  </div>
                  {calendar.description && (
                    <div className="text-responsive-sm text-gray-600">
                      {calendar.description}
                    </div>
                  )}
                </div>
              </div>
              {calendar.primary && (
                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-responsive-sm text-gray-600">
            No calendars found.
          </p>
        </div>
      )}
    </SectionBox>
  );
};

export default CalendarListCard;
