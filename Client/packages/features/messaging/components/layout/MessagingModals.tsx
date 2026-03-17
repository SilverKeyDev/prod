import type { SavedHome } from "packages/types";
import type { DocumentData } from "packages/ui/components/cards/document/DocumentCard";

import {
  AgentSearchModal,
  CalendarEventRequestModal,
  ClientSearchModal,
  SelectAgreementModal,
  SelectDocumentModal,
  SelectHomeModal,
} from "@/features/agent/components/modals";

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
  onSelectHome: (home: SavedHome) => Promise<void>;
  onSelectDocument: (document: DocumentData) => Promise<void>;
  onCalendarEventSuccess: () => void;
  // Agent-only
  showSelectAgreementModal?: boolean;
  setShowSelectAgreementModal?: (v: boolean) => void;
  selectedClientId?: string | null;
  onSelectAgreement?: (agreement: { title?: string }) => Promise<void>;
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
  onSelectHome,
  onSelectDocument,
  onCalendarEventSuccess,
  showSelectAgreementModal,
  setShowSelectAgreementModal,
  selectedClientId,
  onSelectAgreement,
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
        onSelect={onSelectHome}
      />
      <SelectDocumentModal
        isOpen={showSelectDocumentModal}
        onClose={() => setShowSelectDocumentModal(false)}
        onSelect={onSelectDocument}
      />
      {mode === "agent" &&
        onSelectAgreement &&
        showSelectAgreementModal !== undefined &&
        setShowSelectAgreementModal && (
          <SelectAgreementModal
            isOpen={showSelectAgreementModal}
            onClose={() => setShowSelectAgreementModal(false)}
            onSelect={onSelectAgreement}
            clientId={selectedClientId ?? undefined}
          />
        )}
      <CalendarEventRequestModal
        isOpen={showCalendarEventModal}
        onClose={() => setShowCalendarEventModal(false)}
        onSuccess={onCalendarEventSuccess}
      />
    </>
  );
}
