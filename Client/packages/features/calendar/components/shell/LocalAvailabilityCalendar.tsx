import { spacing } from "packages/design-tokens";
import { CalendarToolbar } from "packages/features/calendar/components/view/CalendarToolbar";
import { CreateEventModal } from "packages/features/calendar/components/view/CreateEventModal";
import { EventList } from "packages/features/calendar/components/view/EventList";
import { QuickEventPopover } from "packages/features/calendar/components/view/QuickEventPopover";
import type { BuyerPreferenceExtensions } from "packages/features/profile/types/buyerPreferenceExtensions";
import { useLocalAvailabilityCalendarScreen } from "packages/hooks/data/calendar/useLocalAvailabilityCalendarScreen";
import Button from "packages/ui/components/button/Button";
import Card from "packages/ui/components/cards/Card";
import { Box } from "packages/ui/components/primitives";

import { CalendarMonthBody } from "./CalendarMonthBody";
import { buildCalendarMonthGridStyles } from "./calendarMonthGridStyles";
import { CalendarWeekView } from "./CalendarWeekView";

type LocalAvailabilityCalendarProps = {
  sectionTitle?: string;
  buyerPreferenceExtensions: BuyerPreferenceExtensions | undefined;
  patchBuyerPreferenceExtensions: (
    fn: (prev: BuyerPreferenceExtensions | undefined) => BuyerPreferenceExtensions
  ) => void;
  showSelectedDayEventList?: boolean;
  /** When false, grid interactions and list edit/delete are disabled (view-only). */
  isInteractionEnabled?: boolean;
};

export function LocalAvailabilityCalendar({
  sectionTitle,
  buyerPreferenceExtensions,
  patchBuyerPreferenceExtensions,
  showSelectedDayEventList = true,
  isInteractionEnabled = true,
}: LocalAvailabilityCalendarProps) {
  const screen = useLocalAvailabilityCalendarScreen({
    buyerPreferenceExtensions,
    patchBuyerPreferenceExtensions,
    showSelectedDayEventList,
  });

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
              paddingTop: spacing(3),
              marginBottom: spacing(3),
              width: "100%",
            }}
          >
            <EventList
              events={screen.selectedEvents}
              title={selectedDayListHeading.title}
              subtitle={selectedDayListHeading.subtitle}
              emptyMessage="No availability for this day"
              silverKeyCalendarId={screen.silverKeyCalendarId}
              refreshEvents={screen.refetchEvents}
              updateEvent={isInteractionEnabled ? screen.updateEvent : undefined}
              deleteEvent={isInteractionEnabled ? screen.deleteEvent : undefined}
              calendars={screen.gridCalendars}
              border="light"
              density="compact"
              headerActions={
                isInteractionEnabled ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={screen.addAvailabilityForSelectedDay}
                  >
                    Add
                  </Button>
                ) : null
              }
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
                onDayDoubleTap={
                  isInteractionEnabled ? screen.handleMonthQuickCreateDoubleTap : undefined
                }
                onMonthEventPress={isInteractionEnabled ? screen.handleMonthEventPress : undefined}
                quickCreateDraftId={screen.quickCreateDraftIdForAnchor}
                quickCreateDayKey={screen.quickCreateDayKey}
                isLargeScreen={screen.isLargeScreen}
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
                  isInteractionEnabled ? screen.handleWeekTimeSlotDoubleClick : undefined
                }
                weekInteractionEnabled={isInteractionEnabled}
                weekSelectedEventId={screen.weekSelectedEventId}
                onWeekEventSelect={
                  isInteractionEnabled
                    ? (ev) => {
                        if (ev.id) {
                          screen.setWeekSelectedEventId(String(ev.id));
                        }
                      }
                    : undefined
                }
                onWeekEventOpenEdit={
                  isInteractionEnabled ? (ev) => screen.setEditEvent(ev) : undefined
                }
                onWeekTimeColumnBackgroundPress={
                  isInteractionEnabled ? () => screen.setWeekSelectedEventId(null) : undefined
                }
                onWeekTimedResizeCommit={
                  isInteractionEnabled ? screen.handleWeekTimedResizeCommit : undefined
                }
              />
            ) : null}
          </Box>
        </CalendarToolbar>
      </Box>

      {q && isInteractionEnabled ? (
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
          hideCalendarPicker
          showAgentClientPicker={false}
          selectedClientId={q.selectedClientId}
          onSelectedClientIdChange={(selectedClientId) =>
            screen.updateQuickCreate({ selectedClientId })
          }
          isSubmitting={screen.isCreatingQuickEvent}
          onCommit={() => void screen.commitQuickCreate()}
          onDismiss={screen.discardQuickCreate}
          registerOutsideClickSafeTarget={screen.registerQuickCreateOutsideSafeTarget}
          showWeeklyRepeatToggle={q.source === "week"}
          repeatWeekly={q.repeatWeekly ?? false}
          onRepeatWeeklyChange={(next) => screen.updateQuickCreate({ repeatWeekly: next })}
        />
      ) : null}

      {isInteractionEnabled ? (
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
      ) : null}
    </Card>
  );
}
