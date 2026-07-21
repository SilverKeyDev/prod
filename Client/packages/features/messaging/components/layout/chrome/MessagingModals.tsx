import CalendarEventRequestModal from "packages/features/agent/components/modals/calendarEventRequest/CalendarEventRequestModal";
import AgentSearchModal from "packages/features/agent/components/modals/search/AgentSearchModal";
import ClientSearchModal from "packages/features/agent/components/modals/search/ClientSearchModal";
import SelectDocumentModal from "packages/features/agent/components/modals/search/SelectDocumentModal";
import SelectHomeModal from "packages/features/agent/components/modals/search/SelectHomeModal";
import type { MessagingSendMessageOptions } from "packages/features/messaging/hooks/data/messaging/types";
import type { SavedHome } from "packages/types";
import type { DocumentData } from "packages/ui/components/surfaces/cards/document/DocumentCard";

type MessagingModalsProps = {
  mode: "agent" | "client";
  showSearchModal: boolean;
  setShowSearchModal: (v: boolean) => void;
  showSelectHomeModal: boolean;
  setShowSelectHomeModal: (v: boolean) => void;
  showSelectDocumentModal: boolean;
  setShowSelectDocumentModal: (v: boolean) => void;
  showCalendarEventModal: boolean;
  setShowCalendarEventModal: (v: boolean) => void;
  onSelectHomes: (homes: SavedHome[]) => Promise<void>;
  onSelectDocument: (document: DocumentData) => Promise<void>;
  onCalendarEventSuccess: () => void;
  /** When set, calendar requests use optimistic messaging (conversation list updates while sending). */
  sendCalendarEventMessage?: (
    message: string,
    options: MessagingSendMessageOptions & { conversationId: string }
  ) => Promise<void>;
  /** Agent: prefill Client in the calendar request modal from the open thread. */
  initialClientId?: string | null;
  /** Active messaging conversation id (buyer submit routing / recipient ready). */
  activeConversationId?: string | null;
};

export default function MessagingModals({
  mode,
  showSearchModal,
  setShowSearchModal,
  showSelectHomeModal,
  setShowSelectHomeModal,
  showSelectDocumentModal,
  setShowSelectDocumentModal,
  showCalendarEventModal,
  setShowCalendarEventModal,
  onSelectHomes,
  onSelectDocument,
  onCalendarEventSuccess,
  sendCalendarEventMessage,
  initialClientId = null,
  activeConversationId = null,
}: MessagingModalsProps) {
  return (
    <>
      {mode === "agent" ? (
        <ClientSearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
      ) : (
        <AgentSearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
      )}
      <SelectHomeModal
        isOpen={showSelectHomeModal}
        onClose={() => setShowSelectHomeModal(false)}
        onSelect={onSelectHomes}
      />
      <SelectDocumentModal
        isOpen={showSelectDocumentModal}
        onClose={() => setShowSelectDocumentModal(false)}
        onSelect={onSelectDocument}
      />
      <CalendarEventRequestModal
        isOpen={showCalendarEventModal}
        onClose={() => setShowCalendarEventModal(false)}
        onSuccess={onCalendarEventSuccess}
        sendCalendarEventMessage={sendCalendarEventMessage}
        initialClientId={initialClientId}
        activeConversationId={activeConversationId}
      />
    </>
  );
}
