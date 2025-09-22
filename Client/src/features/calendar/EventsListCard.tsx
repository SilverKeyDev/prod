import { Calendar, Clock, MapPin, Plus, RefreshCw } from "lucide-react";
import React from "react";

import Button from "../../components/ui/button/Button";
import { SectionBox, SectionTitle } from "../negotiate";
import type { GoogleEvent } from "../../core/config/api";

interface EventsListCardProps {
  events: GoogleEvent[];
  isLoading: boolean;
  error: string | null;
  onCreateEvent: () => void;
  onRefresh: () => void;
}

const EventsListCard: React.FC<EventsListCardProps> = ({
  events,
  isLoading,
  error,
  onCreateEvent,
  onRefresh,
}) => {
  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  return (
    <SectionBox>
      <SectionTitle icon={<Calendar className="mobile-icon-sm text-brown" />}>
        Upcoming Events
      </SectionTitle>

      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-responsive-sm">
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
          <Button
            variant="olive"
            size="sm"
            icon={<Plus className="mobile-icon-xs" />}
            onClick={onCreateEvent}
          >
            Create Event
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brown"></div>
            <span className="text-responsive-sm text-gray-600">
              Loading events...
            </span>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-3">
          <p className="text-responsive-sm text-red-600">
            Error loading events: {error}
          </p>
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-3">
          {events.slice(0, 10).map((event) => (
            <div
              key={event.id}
              className="rounded-lg border border-beige p-3 hover:bg-brown/5 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-navy truncate">
                    {event.summary}
                  </h4>
                  {event.description && (
                    <p className="text-responsive-sm text-gray-600 mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-responsive-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="mobile-icon-xs" />
                      <span>
                        {formatDateTime(event.start.dateTime)} -{" "}
                        {formatDateTime(event.end.dateTime)}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="mobile-icon-xs" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-responsive-sm text-gray-600">
            No upcoming events found.
          </p>
          <Button
            variant="olive"
            size="sm"
            className="mt-4"
            onClick={onCreateEvent}
          >
            Create Your First Event
          </Button>
        </div>
      )}
    </SectionBox>
  );
};

export default EventsListCard;
