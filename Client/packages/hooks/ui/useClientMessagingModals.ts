import { useState } from "react";

/**
 * Centralized modal and UI state for ClientMessaging (search, inbox, select home/document/calendar, sidebar).
 * Extracted to keep the main component under max-lines-per-function.
 */
export function useClientMessagingModals() {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showSelectHomeModal, setShowSelectHomeModal] = useState(false);
  const [showSelectDocumentModal, setShowSelectDocumentModal] = useState(false);
  const [showCalendarEventModal, setShowCalendarEventModal] = useState(false);
  const [acceptingEventRequestId, setAcceptingEventRequestId] = useState<
    string | null
  >(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  return {
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
}
