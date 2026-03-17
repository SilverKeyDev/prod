import { useState } from "react";

/**
 * Centralized modal and UI state for messaging (client and agent).
 * Extracted to keep the main component under max-lines-per-function.
 */
export function useMessagingModals(mode: "agent" | "client" = "client") {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showSelectHomeModal, setShowSelectHomeModal] = useState(false);
  const [showSelectDocumentModal, setShowSelectDocumentModal] = useState(false);
  const [showCalendarEventModal, setShowCalendarEventModal] = useState(false);
  const [acceptingEventRequestId, setAcceptingEventRequestId] = useState<string | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const [showSelectAgreementModal, setShowSelectAgreementModal] = useState(false);

  const base = {
    showSearchModal,
    setShowSearchModal,
    showInbox,
    setShowInbox,
    showSelectHomeModal,
    setShowSelectHomeModal,
    showSelectDocumentModal,
    setShowSelectDocumentModal,
    showCalendarEventModal,
    setShowCalendarEventModal,
    acceptingEventRequestId,
    setAcceptingEventRequestId,
    isSidebarExpanded,
    setIsSidebarExpanded,
  };

  if (mode === "agent") {
    return {
      ...base,
      showSelectAgreementModal,
      setShowSelectAgreementModal,
    };
  }

  return base;
}
