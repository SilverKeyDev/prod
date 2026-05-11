import { useCallback, useMemo, useState } from "react";

import { Linking } from "react-native";

import { viewingsApi } from "packages/api/viewings";
import { CreateEventModal } from "packages/features/calendar/components/view/eventModal/CreateEventModal";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { UIState } from "packages/store";
import { useUIStore } from "packages/store";
import { Button, CancelButton } from "packages/ui";
import DeleteModal from "packages/ui/components/modals/standalone/DeleteModal";
import { Box, Text, TouchableBox } from "packages/ui/components/primitives";
import {
  formatLocaleTime12HourEnUs,
  formatLocaleWeekdayShortMonthDayEnUs,
} from "packages/utils/date";
import { getWindow } from "packages/utils/platform";

import type { GoogleCalendar } from "@/features/calendar/api/types";
import type { Calendar, ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import type { GoogleEvent } from "@/features/calendar/types/googleEvent";
import { calendarColorForEvent } from "@/features/calendar/utils/createEventModal/calendarEventColors";
import { getEventEndDate, getEventStartDate } from "@/features/calendar/utils/parsing/eventParsing";
import {
  formatViewingItinerarySummaryLines,
  itineraryCanOpenNavigation,
} from "@/features/calendar/utils/viewing/viewingRoutePlan";

type EventCardProps = {
  event: ExtendedGoogleEvent;
  silverKeyCalendarId?: string | null;
  refreshEvents?: () => Promise<void>;
  updateEvent?: (eventId: string, event: GoogleEvent, calendarId?: string) => Promise<unknown>;
  deleteEvent?: (eventId: string, calendarId?: string) => Promise<void>;
  calendars?: Calendar[];
  onClick?: () => void;
};

function formatDate(date: Date) {
  return formatLocaleWeekdayShortMonthDayEnUs(date);
}

function formatTime(date: Date) {
  return formatLocaleTime12HourEnUs(date);
}

export function EventCard({
  event,
  silverKeyCalendarId: _silverKeyCalendarId = null,
  refreshEvents,
  updateEvent,
  deleteEvent,
  calendars = [],
  onClick,
}: EventCardProps) {
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [isOpeningNavigation, setIsOpeningNavigation] = useState(false);

  const handleEdit = useCallback(() => {
    setEditModalOpen(true);
  }, []);

  const handleCancel = useCallback(() => {
    setCancelConfirmOpen(true);
  }, []);

  const handleEditClose = useCallback(() => {
    setEditModalOpen(false);
  }, []);

  const handleCancelConfirmClose = useCallback(() => {
    setCancelConfirmOpen(false);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!event.id || !deleteEvent) return;
    await deleteEvent(event.id, event.calendarId);
    setCancelConfirmOpen(false);
    await refreshEvents?.();
  }, [event.id, event.calendarId, deleteEvent, refreshEvents]);

  const handleEventUpdated = useCallback(() => {
    setEditModalOpen(false);
    void refreshEvents?.();
  }, [refreshEvents]);

  const showStartViewingNavigation = useMemo(
    () => itineraryCanOpenNavigation(event.itinerary),
    [event.itinerary]
  );

  const stripeColor = useMemo(
    () => calendarColorForEvent(event, calendars as GoogleCalendar[]),
    [event, calendars]
  );

  const handleStartViewingNavigation = useCallback(async () => {
    if (!event.itinerary || !itineraryCanOpenNavigation(event.itinerary)) {
      return;
    }
    setIsOpeningNavigation(true);
    try {
      const res = await viewingsApi.navigateLink(event.itinerary);
      if (res.success && res.data?.url) {
        const win = getWindow();
        if (win) {
          win.open(res.data.url, "_blank", "noopener,noreferrer");
        } else {
          await Linking.openURL(res.data.url);
        }
      } else {
        enqueueToast({
          type: "error",
          message: res.error ?? "Could not open maps",
        });
      }
    } catch (error) {
      log.error(LOG_CATEGORIES.CALENDAR, "Viewing navigation link failed", error);
      enqueueToast({
        type: "error",
        message: error instanceof Error ? error.message : "Could not open maps",
      });
    } finally {
      setIsOpeningNavigation(false);
    }
  }, [enqueueToast, event.itinerary]);

  const dateRange = useMemo(() => {
    try {
      const start = getEventStartDate(event);
      const end = getEventEndDate(event);

      if (!start || !end) {
        return "";
      }

      if (start.toDateString() === end.toDateString()) {
        return `${formatDate(start)} • ${formatTime(start)} - ${formatTime(end)}`;
      }

      return `${formatDate(start)} ${formatTime(start)} - ${formatDate(end)} ${formatTime(end)}`;
    } catch {
      return "";
    }
  }, [event]);

  /** Callers pass update/delete only when edits are allowed (e.g. omit for client calendar or view-only). */
  const showEditActions = Boolean(updateEvent && deleteEvent);

  const itineraryLines = event.itinerary ? formatViewingItinerarySummaryLines(event.itinerary) : [];

  const eventBody = (
    <>
      <Text className="text-text-primary text-left text-sm font-semibold">
        {event.summary || "Untitled Event"}
      </Text>
      {dateRange ? (
        <Text className="text-text-secondary text-left text-xs sm:text-sm">{dateRange}</Text>
      ) : null}
      {event.location ? (
        <Text className="text-text-secondary text-left text-xs sm:text-sm">{event.location}</Text>
      ) : null}
      {itineraryLines.length > 0 ? (
        <Text className="text-text-secondary line-clamp-4 text-left text-xs sm:text-sm">
          {itineraryLines.join(" · ")}
        </Text>
      ) : null}
      {event.description ? (
        <Text className="text-text-secondary line-clamp-2 text-left text-xs sm:text-sm">
          {event.description}
        </Text>
      ) : null}
    </>
  );

  return (
    <>
      <Box className="mb-2 w-full max-w-full pl-2">
        <Box className="border-border bg-background-surface w-full overflow-hidden rounded-xl border transition-shadow hover:shadow-md">
          <Box className="flex flex-row items-stretch">
            <Box className="w-1 shrink-0" style={{ backgroundColor: stripeColor }} />
            <Box className="min-w-0 flex-1 p-3 text-left">
              <Box className="flex flex-row items-start gap-2">
                <Box className="min-w-0 flex-1">
                  {onClick ? (
                    <TouchableBox onPress={onClick} className="space-y-1 text-left outline-none">
                      {eventBody}
                    </TouchableBox>
                  ) : (
                    <Box className="space-y-1">{eventBody}</Box>
                  )}
                </Box>
                {showEditActions || showStartViewingNavigation ? (
                  <Box className="flex flex-shrink-0 flex-row flex-wrap justify-end gap-2">
                    {showStartViewingNavigation ? (
                      <Button
                        variant="outline"
                        size="sm"
                        loading={isOpeningNavigation}
                        disabled={isOpeningNavigation}
                        onPress={() => void handleStartViewingNavigation()}
                        iconName="map-pin"
                      >
                        Start navigation
                      </Button>
                    ) : null}
                    {showEditActions ? (
                      <>
                        <Button variant="outline" size="sm" onPress={handleEdit} iconName="pencil">
                          Edit
                        </Button>
                        <CancelButton size="sm" onPress={handleCancel}>
                          Cancel
                        </CancelButton>
                      </>
                    ) : null}
                  </Box>
                ) : null}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {showEditActions && (
        <>
          <CreateEventModal
            isOpen={editModalOpen}
            onClose={handleEditClose}
            mode="edit"
            existingEvent={event}
            calendars={calendars}
            defaultCalendarId={event.calendarId}
            onEventCreated={handleEventUpdated}
            updateEvent={updateEvent}
          />
          <DeleteModal
            isOpen={cancelConfirmOpen}
            onClose={handleCancelConfirmClose}
            onConfirm={handleDeleteConfirm}
            title="Cancel Event"
            message="Are you sure you want to cancel this event? This action cannot be undone."
            confirmText="Cancel Event"
          />
        </>
      )}
    </>
  );
}
