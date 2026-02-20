import type { SavedHome } from "packages/schemas/property";

import type { DocumentData } from "@/components/cards/documents/DocumentCard";
import { ClientSearchModal } from "@/features/agent/modals";
import CalendarEventRequestModal from "@/features/agent/modals/CalendarEventRequestModal";
import SelectDocumentModal from "@/features/agent/modals/SelectDocumentModal";
import SelectHomeModal from "@/features/agent/modals/SelectHomeModal";

type ClientMessagingModalsProps = {
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
};

export function ClientMessagingModals({
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
}: ClientMessagingModalsProps) {
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
      <CalendarEventRequestModal
        isOpen={showCalendarEventModal}
        onClose={() => setShowCalendarEventModal(false)}
        onSuccess={onCalendarEventSuccess}
      />
    </>
  );
}
