import { Icon } from "@ui/icons";

import { color } from "packages/design-tokens";
import Button from "packages/ui/components/button/Button";
import CancelButton from "packages/ui/components/button/CancelButton";
import Dropdown from "packages/ui/components/form/dropdown";
import { Box } from "packages/ui/components/primitives";

import { Textarea } from "@/components/form/FormField";
import { BodyText, Input } from "@/components/ui";
import Label from "@/components/ui/text/Label.web";
import {
  useCalendarEventRequestForm,
  type UseCalendarEventRequestFormParams,
} from "@/features/agent/hooks/data/useCalendarEventRequestForm";
import { ViewingStopList } from "@/features/calendar/components/viewings/ViewingStopList";
import type { CalendarEventKindId } from "@/features/calendar/utils/createEventModal/calendarEventKinds";
import { CALENDAR_EVENT_KINDS } from "@/features/calendar/utils/createEventModal/calendarEventKinds";

import { EventRequestDateDropdown } from "./EventRequestDateDropdown.web";
import { EventRequestTimeDropdown } from "./EventRequestTimeDropdown.web";

export type CalendarEventRequestFormCoreProps = UseCalendarEventRequestFormParams;

export function CalendarEventRequestFormCore(props: CalendarEventRequestFormCoreProps) {
  const {
    isAgent,
    clients,
    isLoadingClients,
    selectedClientId,
    setSelectedClientId,
    eventKindId,
    onEventKindIdChange,
    kindOptionSlice,
    checklistProgressLoading,
    eventTitle,
    setEventTitle,
    eventDescription,
    setEventDescription,
    eventLocation,
    setEventLocation,
    eventDate,
    setEventDate,
    eventTime,
    setEventTime,
    isSending,
    canSend,
    minDate,
    handleSend,
    isPropertyViewing,
    viewingStops,
    setViewingStops,
    eventRequestDateOptions,
    eventRequestTimeOptions,
  } = useCalendarEventRequestForm(props);

  const { onClose } = props;
  const showCustomTitle = eventKindId === "other";

  const kindDropdownOptions = kindOptionSlice.allowedKindIds.map((id) => ({
    value: id,
    label: CALENDAR_EVENT_KINDS[id].label,
    icon: (
      <BodyText
        as="span"
        className="mt-0.5 inline-block h-3 w-3 shrink-0 rounded-sm"
        style={{
          backgroundColor: color(CALENDAR_EVENT_KINDS[id].uiColorPath),
        }}
        aria-hidden
      >
        {"\u200b"}
      </BodyText>
    ),
  }));

  return (
    <Box className="space-y-4">
      {isAgent && (
        <Box>
          <Label>Send to client</Label>
          {isLoadingClients ? (
            <BodyText as="p" size="sm" className="text-text-secondary">
              Loading clients...
            </BodyText>
          ) : clients.length === 0 ? (
            <BodyText as="p" size="sm" className="text-text-secondary">
              No clients available.
            </BodyText>
          ) : (
            <Box className="mt-2 max-h-48 space-y-2 overflow-y-auto">
              {clients.map((client) => (
                <Button
                  key={client.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  contentAlign="start"
                  onClick={() => setSelectedClientId(client.id)}
                  className={`h-auto min-h-0 w-full justify-start rounded-lg border p-3 text-left ${
                    selectedClientId === client.id
                      ? "border-border bg-primary-muted"
                      : "border-border hover:border-border hover:bg-primary-muted"
                  }`}
                >
                  <Box className="flex w-full items-center gap-2">
                    <Box className="bg-accent-muted flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                      <Icon name="calendar" className="text-text-primary h-4 w-4" />
                    </Box>
                    <Box className="min-w-0 flex-1">
                      <BodyText as="p" size="sm" className="text-text-primary font-medium">
                        {client.name}
                      </BodyText>
                      <BodyText as="p" size="xs" className="text-text-secondary">
                        {client.email}
                      </BodyText>
                    </Box>
                    {selectedClientId === client.id && (
                      <Box className="bg-primary h-2 w-2 rounded-full" />
                    )}
                  </Box>
                </Button>
              ))}
            </Box>
          )}
        </Box>
      )}

      <Dropdown<CalendarEventKindId>
        label="Event type"
        options={kindDropdownOptions}
        value={eventKindId}
        onChange={onEventKindIdChange}
        disabled={checklistProgressLoading}
        menuInPortal
        menuPortalStack="modal"
      />

      {showCustomTitle ? (
        <Box>
          <Label htmlFor="event-title">Event title</Label>
          <Input
            id="event-title"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="e.g., Meet lender, Contractor walkthrough"
            className="mt-1"
          />
        </Box>
      ) : null}

      <Box className="grid grid-cols-2 gap-3">
        <EventRequestDateDropdown
          minDate={minDate}
          value={eventDate}
          onChange={setEventDate}
          options={eventRequestDateOptions}
        />
        <EventRequestTimeDropdown
          value={eventTime}
          onChange={setEventTime}
          options={eventRequestTimeOptions}
        />
      </Box>

      {isPropertyViewing ? (
        <ViewingStopList stops={viewingStops} onStopsChange={setViewingStops} />
      ) : (
        <Box>
          <Label htmlFor="event-location">Location (optional)</Label>
          <Input
            id="event-location"
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
            placeholder="e.g., 123 Main St or Zoom link"
            className="mt-1"
          />
        </Box>
      )}

      <Box>
        <Label htmlFor="event-description">Description (optional)</Label>
        <Textarea
          id="event-description"
          value={eventDescription}
          onChange={(e) => setEventDescription(e.target.value)}
          placeholder="Event details (optional)"
          rows={3}
          className="mt-1"
        />
      </Box>

      <Box className="flex gap-3 pt-2">
        <CancelButton onClick={onClose} className="flex-1" disabled={isSending}>
          Cancel
        </CancelButton>
        <Button
          variant="primary"
          onClick={() => void handleSend()}
          disabled={!canSend || isSending}
          className="flex-1"
          iconName="share"
        >
          {isSending ? "Sending..." : "Send Request"}
        </Button>
      </Box>
    </Box>
  );
}
