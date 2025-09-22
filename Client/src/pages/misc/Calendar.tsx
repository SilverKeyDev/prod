import React, { useState } from "react";
import { useGoogleCalendarStoreIntegration } from "../../core/hooks/store/useGoogleCalendarStoreIntegration";
import { useAuth } from "../../core/contexts";
import Title from "../../components/ui/text/Title";
import { Loading } from "../../components/ui/loading/Loading";
import {
  CalendarConnectionCard,
  CalendarListCard,
  EventsListCard,
  CreateEventModal,
} from "../../features/calendar";
import type { GoogleEvent } from "../../core/config/api";

const Calendar: React.FC = () => {
  const { isAuthenticated, authReady } = useAuth();
  const {
    isConnected,
    calendars,
    calendarsLoading,
    calendarsError,
    refreshCalendars,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    events,
    eventsLoading,
    eventsError,
    refreshEvents,
    createEvent,
    isCreatingEvent,
  } = useGoogleCalendarStoreIntegration();

  const [showCreateEvent, setShowCreateEvent] = useState(false);

  const handleCreateEvent = async (event: GoogleEvent) => {
    try {
      await createEvent(event);
      setShowCreateEvent(false);
    } catch (error) {
      console.error("Failed to create event:", error);
    }
  };

  if (!authReady) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loading message="Loading calendar..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mobile-container py-8">
        <div className="text-center">
          <Title size="lg" className="mb-4">
            Calendar
          </Title>
          <p className="text-gray-600">
            Please log in to access your calendar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container py-responsive-md space-y-responsive-md">
      {/* Header */}
      <div className="text-center">
        <Title size="lg" className="mb-2">
          Calendar
        </Title>
        <p className="text-responsive-sm text-gray-600">
          Manage your Google Calendar integration and view upcoming events.
        </p>
      </div>

      {/* Google Calendar Connection Status */}
      <CalendarConnectionCard
        isConnected={isConnected}
        isLoading={calendarsLoading}
        onConnect={connectGoogleCalendar}
        onDisconnect={disconnectGoogleCalendar}
        onRefresh={refreshCalendars}
      />

      {/* Calendars List */}
      {isConnected && (
        <CalendarListCard
          calendars={calendars}
          isLoading={calendarsLoading}
          error={calendarsError}
          onRefresh={refreshCalendars}
        />
      )}

      {/* Events List */}
      {isConnected && (
        <EventsListCard
          events={events}
          isLoading={eventsLoading}
          error={eventsError}
          onCreateEvent={() => setShowCreateEvent(true)}
          onRefresh={refreshEvents}
        />
      )}

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
        onSubmit={handleCreateEvent}
        isLoading={isCreatingEvent}
      />
    </div>
  );
};

export default Calendar;
