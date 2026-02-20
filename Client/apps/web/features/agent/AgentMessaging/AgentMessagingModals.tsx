import type { SavedHome } from "packages/schemas/search/property";

import type { DocumentData } from "@/components/cards/documents/DocumentCard";
import { ClientSearchModal } from "@/features/agent/modals";
import CalendarEventRequestModal from "@/features/agent/modals/CalendarEventRequestModal";
import SelectAgreementModal from "@/features/agent/modals/SelectAgreementModal";
import SelectDocumentModal from "@/features/agent/modals/SelectDocumentModal";
import SelectHomeModal from "@/features/agent/modals/SelectHomeModal";

type AgentMessagingModalsProps = {
  showSearchModal: boolean;
  setShowSearchModal: (v: boolean) => void;
  showSelectHomeModal: boolean;
  setShowSelectHomeModal: (v: boolean) => void;
  showSelectDocumentModal: boolean;
  setShowSelectDocumentModal: (v: boolean) => void;
  showSelectAgreementModal: boolean;
  setShowSelectAgreementModal: (v: boolean) => void;
  showCalendarEventModal: boolean;
  setShowCalendarEventModal: (v: boolean) => void;
  selectedClientId: string | null;
  onSelectHome: (home: SavedHome) => Promise<void>;
  onSelectDocument: (document: DocumentData) => Promise<void>;
  onSelectAgreement: (agreement: { title?: string }) => Promise<void>;
  onCalendarEventSuccess: () => void;
};

export function AgentMessagingModals({
  showSearchModal,
  setShowSearchModal,
  showSelectHomeModal,
  setShowSelectHomeModal,
  showSelectDocumentModal,
  setShowSelectDocumentModal,
  showSelectAgreementModal,
  setShowSelectAgreementModal,
  showCalendarEventModal,
  setShowCalendarEventModal,
  selectedClientId,
  onSelectHome,
  onSelectDocument,
  onSelectAgreement,
  onCalendarEventSuccess,
}: AgentMessagingModalsProps) {
  return (
    <>
      <ClientSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
      <SelectHomeModal
        isOpen={showSelectHomeModal}
        onClose={() => setShowSelectHomeModal(false)}
        onSelect={onSelectHome}
      />
      <SelectDocumentModal
        isOpen={showSelectDocumentModal}
        onClose={() => setShowSelectDocumentModal(false)}
        onSelect={onSelectDocument}
      />
      <SelectAgreementModal
        isOpen={showSelectAgreementModal}
        onClose={() => setShowSelectAgreementModal(false)}
        onSelect={onSelectAgreement}
        clientId={selectedClientId ?? undefined}
      />
      <CalendarEventRequestModal
        isOpen={showCalendarEventModal}
        onClose={() => setShowCalendarEventModal(false)}
        onSuccess={onCalendarEventSuccess}
      />
    </>
  );
}
