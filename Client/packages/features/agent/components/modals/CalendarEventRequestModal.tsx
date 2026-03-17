import { useState } from "react";

import { Icon } from "@ui/icons";

import { useAgentChats } from "packages/hooks/data/chat/useAgentChats";
import { useIsAgent } from "packages/hooks/store";
import { log, LOG_CATEGORIES } from "packages/logger";
import Button from "packages/ui/components/button/Button";
import CancelButton from "packages/ui/components/button/CancelButton";
import { Box } from "packages/ui/components/primitives";
import { dateNow, dateParseISO } from "packages/utils/date";

import { Textarea } from "@/components/form/FormField";
import BaseModal from "@/components/modals/BaseModal";
import { BodyText, DateInput, Input, TimeInput, Title } from "@/components/ui";
import Label from "@/components/ui/text/Label.web";
import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";
import {
  buildEventRequestMessage,
  type EventRequestPayload,
} from "@/features/messaging/utils/eventRequestPayload";
type CalendarEventRequestModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};
export default function CalendarEventRequestModal({
  isOpen,
  onClose,
  onSuccess,
}: CalendarEventRequestModalProps) {
  const isAgent = useIsAgent();
  const { clients, isLoading: isLoadingClients } = useAgentClients();
  const { conversations, sendMessage } = useAgentChats();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [isSending, setIsSending] = useState(false);
  // Get conversation ID for selected client (for agents)
  const getConversationId = (clientId: string): string | null => {
    const conversation = conversations.find((c) => c.client_id === clientId);
    return conversation?.id ?? null;
  };
  // For clients: get their agent conversation
  const clientConversation = !isAgent && conversations.length > 0 ? conversations[0] : null;
  const handleSend = async () => {
    if (!eventTitle.trim() || !eventDate || !eventTime) {
      return;
    }
    let conversationId: string | null = null;
    if (isAgent) {
      if (!selectedClientId) return;
      conversationId = getConversationId(selectedClientId);
      if (!conversationId) {
        conversationId = "new";
      }
    } else {
      if (!clientConversation) return;
      conversationId = clientConversation.id;
    }
    // Build structured payload with default duration (30 minutes)
    const dateTime = dateParseISO(`${eventDate}T${eventTime}`);
    const endTime = dateTime.add(30, "minute");
    const payload: EventRequestPayload = {
      title: eventTitle.trim(),
      start: dateTime.toISOString(),
      end: endTime.toISOString(),
      description: eventDescription.trim() || undefined,
    };
    const message = buildEventRequestMessage(payload);
    setIsSending(true);
    try {
      const clientIdToPass = isAgent && conversationId === "new" ? selectedClientId : undefined;
      await sendMessage(conversationId, message, clientIdToPass ?? undefined);
      // Reset form
      setEventTitle("");
      setEventDescription("");
      setEventDate("");
      setEventTime("");
      setSelectedClientId(null);
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      log.error(LOG_CATEGORIES.CALENDAR, "Error sending event request", error);
    } finally {
      setIsSending(false);
    }
  };
  const canSend =
    eventTitle.trim() &&
    eventDate &&
    eventTime &&
    (isAgent ? selectedClientId !== null : clientConversation !== null);
  // Get tomorrow's date as minimum date
  const tomorrow = dateNow().add(1, "day");
  const minDate = tomorrow.format("YYYY-MM-DD");
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      headerContent={
        <Box className="flex items-center gap-2">
          <Icon name="calendar" className="text-text-primary h-5 w-5 flex-shrink-0" />
          <Title as="h3" size="lg" className="text-text-primary truncate font-medium sm:text-lg">
            Request Calendar Event
          </Title>
        </Box>
      }
      size="md"
    >
      <Box className="space-y-4">
        {/* Client Selection (for agents) */}
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
                    onClick={() => setSelectedClientId(client.id)}
                    className={`h-auto min-h-0 w-full justify-start rounded-lg border p-3 text-left ${
                      selectedClientId === client.id
                        ? "border-primary bg-primary-muted"
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

        {/* Event Title */}
        <Box>
          <Label htmlFor="event-title" required>
            Event Title
          </Label>
          <Input
            id="event-title"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="e.g., Property Viewing, Home Inspection"
            className="mt-1"
          />
        </Box>

        {/* Date and Time */}
        <Box className="grid grid-cols-2 gap-3">
          <DateInput
            id="event-date"
            label="Date"
            required
            value={eventDate}
            min={minDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
          <TimeInput
            id="event-time"
            label="Time"
            required
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
          />
        </Box>

        {/* Event Description */}
        <Box>
          <Label htmlFor="event-description">Description (optional)</Label>
          <Textarea
            id="event-description"
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            placeholder="Add any additional details about the event..."
            rows={3}
            className="mt-1"
          />
        </Box>

        {/* Actions */}
        <Box className="flex gap-3 pt-2">
          <CancelButton onClick={onClose} className="flex-1" disabled={isSending}>
            Cancel
          </CancelButton>
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={!canSend || isSending}
            className="flex-1"
            iconName="share"
          >
            {isSending ? "Sending..." : "Send Request"}
          </Button>
        </Box>
      </Box>
    </BaseModal>
  );
}
