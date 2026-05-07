import { color, spacing } from "packages/design-tokens";
import { CalendarConnectionPrompt } from "packages/features/calendar/components/view/CalendarConnectionPrompt";
import { CalendarToolbar } from "packages/features/calendar/components/view/CalendarToolbar";
import { CreateEventModal } from "packages/features/calendar/components/view/CreateEventModal";
import { EventList } from "packages/features/calendar/components/view/EventList";
import { QuickEventPopover } from "packages/features/calendar/components/view/QuickEventPopover";
import Card from "packages/ui/components/cards/Card";
import { Box, Text } from "packages/ui/components/primitives";

import type { GoogleCalendar } from "@/features/calendar/api/types";
import { useCalendarScreen } from "@/features/calendar/hooks/data/core/useCalendarScreen";

import { CalendarMonthBody } from "./CalendarMonthBody";
import { buildCalendarMonthGridStyles } from "./calendarMonthGridStyles";
import { CalendarWeekView } from "./CalendarWeekView";

type CalendarProps = {
  sectionTitle?: string;
  clientUserId?: string;
  showSelectedDayEventList?: boolean;
};

export function Calendar({
  sectionTitle,
  clientUserId,
  showSelectedDayEventList = true,
}: CalendarProps) {
  const screen = useCalendarScreen({
    clientUserId,
    showSelectedDayEventList,
  });

  if (!screen.permissionsReady) {
    return (
      <Card border="light" className="w-full" padding="md" hover={false}>
        <Text
          style={{
            textAlign: "center",
            fontSize: 14,
            color: color("neutral.500"),
          }}
        >
          Loading calendar permissions…
        </Text>
      </Card>
    );
  }

  if (screen.isClientView && screen.clientEventsQuery.isLoading) {
    return (
      <Card border="light" className="w-full" padding="md" hover={false}>
        <Text
          style={{
            textAlign: "center",
            fontSize: 14,
            color: color("neutral.500"),
          }}
        >
          Loading client calendar…
        </Text>
      </Card>
    );
  }

  if (screen.isClientView && screen.clientEventsQuery.isError) {
    const message =
      screen.clientEventsQuery.error instanceof Error
        ? screen.clientEventsQuery.error.message
        : "Could not load this client’s calendar.";
    return (
      <Card border="light" className="w-full" padding="md" hover={false}>
        <Text
          style={{
            textAlign: "center",
            fontSize: 14,
            color: color("neutral.500"),
          }}
        >
          {message}
        </Text>
      </Card>
    );
  }

  if (screen.shouldShowConnectionPrompt) {
    return (
      <Card border="light" className="w-full" padding="md" hover={false}>
        <CalendarConnectionPrompt
          onConnect={screen.handleConnect}
          isLoading={screen.calendarsLoading}
        />
      </Card>
    );
  }

  const styles = buildCalendarMonthGridStyles(spacing);

  const q = screen.quickCreate;

  const selectedDayListHeading =
    showSelectedDayEventList && screen.selectedDayKey !== null
      ? screen.getSelectedDayListHeading(screen.selectedDayKey)
      : null;
  return (
    <Card border="none" className="w-full" padding="none" hover={false}>
      <Box ref={screen.calendarShellRef} style={styles.container}>
        {showSelectedDayEventList && screen.selectedDayKey !== null && selectedDayListHeading ? (
          <Box
            style={{
              paddingHorizontal: spacing(3),
              width: "100%",
            }}
          >
            <EventList
              events={screen.selectedEvents}
              title={selectedDayListHeading.title}
              subtitle={selectedDayListHeading.subtitle}
              emptyMessage="No events for this day"
              silverKeyCalendarId={screen.silverKeyCalendarId}
              refreshEvents={
                screen.isClientView
                  ? async () => {
                      await screen.clientEventsQuery.refetch();
                    }
                  : screen.refetchEvents
              }
              updateEvent={screen.isClientView ? undefined : screen.updateEvent}
              deleteEvent={screen.isClientView ? undefined : screen.deleteEvent}
              calendars={screen.gridCalendars}
              border="light"
              density="compact"
            />
          </Box>
        ) : null}

        <CalendarToolbar
          sectionTitle={sectionTitle}
          toolbarLabel={screen.toolbarLabel}
          viewMode={screen.viewMode}
          onViewModeChange={screen.setViewMode}
          onPrev={screen.handlePrev}
          onNext={screen.handleNext}
        >
          <Box {...screen.swipeHandlers}>
            {screen.viewMode === "month" ? (
              <CalendarMonthBody
                styles={styles}
                days={screen.days}
                eventsByDay={screen.eventsByDay}
                selectedDayKey={screen.bodySelectedKey}
                onSelectDay={(key) => screen.setSelectedDayKey(key)}
                onDayNumberPress={screen.handleJumpToDayFromDate}
                onDayDoubleTap={screen.handleMonthQuickCreateDoubleTap}
                onMonthEventPress={screen.handleMonthEventPress}
                quickCreateDraftId={screen.quickCreateDraftIdForAnchor}
                quickCreateDayKey={screen.quickCreateDayKey}
                isLargeScreen={screen.isLargeScreen}
                calendars={screen.gridCalendars as GoogleCalendar[]}
              />
            ) : null}
            {screen.viewMode === "week" ? (
              <CalendarWeekView
                focusedDate={screen.focusedDate}
                events={screen.visibleEvents}
                calendars={screen.gridCalendars}
                onDayHeaderPress={screen.handleDayHeaderPress}
                onDayHeaderDoubleTap={screen.handleJumpToDayFromDate}
                onWeekTimeSlotDoubleClick={
                  screen.isClientView ? undefined : screen.handleWeekTimeSlotDoubleClick
                }
                weekInteractionEnabled={!screen.isClientView}
                weekSelectedEventId={screen.weekSelectedEventId}
                onWeekEventSelect={(ev) => {
                  if (ev.id) {
                    screen.setWeekSelectedEventId(String(ev.id));
                  }
                }}
                onWeekEventOpenEdit={(ev) => screen.setEditEvent(ev)}
                onWeekTimeColumnBackgroundPress={() => screen.setWeekSelectedEventId(null)}
                onWeekTimedResizeCommit={
                  screen.isClientView ? undefined : screen.handleWeekTimedResizeCommit
                }
              />
            ) : null}
          </Box>
        </CalendarToolbar>
      </Box>

      {q && !screen.isClientView ? (
        <QuickEventPopover
          anchorRect={screen.quickCreateAnchorRect}
          eventTitle={q.eventTitle}
          onEventTitleChange={(eventTitle) => screen.updateQuickCreate({ eventTitle })}
          eventDescription={q.eventDescription}
          onEventDescriptionChange={(eventDescription) =>
            screen.updateQuickCreate({ eventDescription })
          }
          eventLocation={q.eventLocation}
          onEventLocationChange={(eventLocation) => screen.updateQuickCreate({ eventLocation })}
          isAllDay={q.isAllDay}
          onIsAllDayChange={(isAllDay) => screen.updateQuickCreate({ isAllDay })}
          startDate={q.startDate}
          endDate={q.endDate}
          onDateRangeChange={(startDate, endDate) =>
            screen.updateQuickCreate({ startDate, endDate })
          }
          startTime={q.startTime}
          endTime={q.endTime}
          onStartTimeChange={(startTime) => screen.updateQuickCreate({ startTime })}
          onEndTimeChange={(endTime) => screen.updateQuickCreate({ endTime })}
          calendars={screen.gridCalendars}
          selectedCalendarId={q.selectedCalendarId}
          onCalendarChange={(selectedCalendarId) =>
            screen.updateQuickCreate({ selectedCalendarId })
          }
          hideCalendarPicker={false}
          showAgentClientPicker={screen.isAgentUser}
          selectedClientId={q.selectedClientId}
          onSelectedClientIdChange={(selectedClientId) =>
            screen.updateQuickCreate({ selectedClientId })
          }
          isSubmitting={screen.isCreatingQuickEvent}
          onCommit={() => void screen.commitQuickCreate()}
          onDismiss={screen.discardQuickCreate}
          registerOutsideClickSafeTarget={screen.registerQuickCreateOutsideSafeTarget}
          onEditDetails={screen.handleEditDetailsFromQuickCreate}
        />
      ) : null}

      <CreateEventModal
        isOpen={Boolean(screen.editEvent)}
        onClose={() => screen.setEditEvent(null)}
        mode="edit"
        existingEvent={screen.editEvent ?? undefined}
        calendars={screen.gridCalendars}
        defaultCalendarId={screen.defaultCalendarId}
        updateEvent={screen.updateEvent}
        onEventCreated={() => {
          void screen.refetchEvents();
        }}
      />

      <CreateEventModal
        isOpen={screen.fullCreateFromQuickOpen}
        onClose={() => screen.setFullCreateFromQuickOpen(false)}
        mode="create"
        calendars={screen.gridCalendars}
        defaultCalendarId={screen.defaultCalendarId}
        prefilledCreateSnapshot={screen.fullCreatePrefill}
        prefilledCreateKey={screen.fullCreateKey}
        onEventCreated={() => {
          void screen.refetchEvents();
        }}
      />
    </Card>
  );
}
