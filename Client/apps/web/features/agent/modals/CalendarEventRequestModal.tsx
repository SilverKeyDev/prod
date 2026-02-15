import { Calendar, Share } from "lucide-react";
import { useState } from "react";

import BaseModal from "../../../components/modals/BaseModal";
import Button from "../../../components/ui/button/Button";
import CancelButton from "../../../components/ui/button/CancelButton";
import Input from "../../../components/ui/form/Input";
import Label from "../../../components/ui/text/Label";
import { Textarea } from "../../../components/ui/form/FormField";
import { useAgentChats } from "../../../../../packages/hooks/data/chat/useAgentChats";
import { useAgentClients } from "../../../../../packages/hooks/data/agent/useAgentClients";
import { useIsAgent } from "../../../../../packages/hooks/store/auth/useIsAgent";
import { log, LOG_CATEGORIES } from "../../../../../logger";

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
  const clientConversation =
    !isAgent && conversations.length > 0 ? conversations[0] : null;

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

    // Format the event request message
    const dateTime = new Date(`${eventDate}T${eventTime}`);
    const formattedDate = dateTime.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = dateTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    let message = `📅 Event Request: ${eventTitle}\n\n`;
    message += `Date: ${formattedDate}\n`;
    message += `Time: ${formattedTime}\n`;
    if (eventDescription.trim()) {
      message += `\n${eventDescription.trim()}`;
    }

    setIsSending(true);
    try {
      const clientIdToPass =
        isAgent && conversationId === "new" ? selectedClientId : undefined;
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
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      headerContent={
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 flex-shrink-0 text-gray-900" />
          <h3 className="truncate text-base font-medium text-gray-900 sm:text-lg">
            Request Calendar Event
          </h3>
        </div>
      }
      size="md"
    >
      <div className="space-y-4">
        {/* Client Selection (for agents) */}
        {isAgent && (
          <div>
            <Label>Send to client</Label>
            {isLoadingClients ? (
              <p className="text-sm text-gray-500">Loading clients...</p>
            ) : clients.length === 0 ? (
              <p className="text-sm text-gray-500">No clients available.</p>
            ) : (
              <div className="mt-2 max-h-48 space-y-2 overflow-y-auto">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      selectedClientId === client.id
                        ? "border-brown bg-beige/20"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-beige">
                        <Calendar className="h-4 w-4 text-black" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {client.name}
                        </p>
                        <p className="text-xs text-gray-500">{client.email}</p>
                      </div>
                      {selectedClientId === client.id && (
                        <div className="h-2 w-2 rounded-full bg-brown" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Event Title */}
        <div>
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
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="event-date" required>
              Date
            </Label>
            <Input
              id="event-date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              min={minDate}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="event-time" required>
              Time
            </Label>
            <Input
              id="event-time"
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Event Description */}
        <div>
          <Label htmlFor="event-description">Description (optional)</Label>
          <Textarea
            id="event-description"
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            placeholder="Add any additional details about the event..."
            rows={3}
            className="mt-1"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <CancelButton
            onClick={onClose}
            className="flex-1"
            disabled={isSending}
          >
            Cancel
          </CancelButton>
          <Button
            variant="olive"
            onClick={handleSend}
            disabled={!canSend || isSending}
            className="flex-1"
            icon={<Share className="h-4 w-4" />}
          >
            {isSending ? "Sending..." : "Send Request"}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}
