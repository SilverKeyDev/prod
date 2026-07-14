import { lazy, type ReactNode, type RefObject, Suspense, type UIEvent } from "react";

import type { AgentConversation } from "packages/api";
import MessagingSidebarShell from "packages/features/messaging/components/layout/chrome/MessagingSidebarShell";
import UnifiedMessageInput from "packages/features/messaging/components/layout/input/UnifiedMessageInput";
import { loadUnifiedMessagesListModule } from "packages/features/messaging/components/layout/messagesList/unifiedMessagesListDynamicImport";
import { UnifiedMessagesListLoadingHistory } from "packages/features/messaging/components/layout/messagesList/UnifiedMessagesListEmptyStates";
import type { ChatMessage } from "packages/features/messaging/hooks/data/messaging/types";
import type { EventRequestPayload } from "packages/features/messaging/utils/eventRequestPayload";
import { Box } from "packages/ui/components/structure/primitives";
import { traceLazyImport } from "packages/utils/core/perf/shellRouteLoadTiming";

import { Region } from "@/components/ui";
import type { MessagingMode } from "@/features/agent/components/messaging/screen/messagingConfig";

const UnifiedMessagesList = lazy(
  traceLazyImport("MESSAGES", "lazy:UnifiedMessagesList(shell)", loadUnifiedMessagesListModule)
);

export type UnifiedMessagingShellProps = {
  mode: MessagingMode;
  isSidebarExpanded: boolean;
  onOverlayDismiss: () => void;
  sidebarHeader: ReactNode;
  sidebarContent: ReactNode;
  /** Desktop detail-column header. Pass null to omit. */
  detailHeader?: ReactNode | null;
  /** When true, only the sidebar is shown (e.g. connection-request inbox covering the thread). */
  hideThread?: boolean;
  canSendMessage: boolean;
  isLoadingHistory: boolean;
  localMessages: ChatMessage[];
  formatTime: (date: Date) => string;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onMessageListScroll?: (event: UIEvent<HTMLElement>) => void;
  onRetryMessage?: (messageId: string) => void;
  activeConversation?: AgentConversation | null;
  selectedClientName?: string;
  onSearchClick?: () => void;
  onAcceptEventRequest?: (messageId: string, payload: EventRequestPayload) => Promise<void>;
  onCancelEventRequest?: (messageId: string) => Promise<void>;
  acceptingEventRequestId?: string | null;
  hasMoreOlder?: boolean;
  isLoadingOlder?: boolean;
  message: string;
  setMessage: (text: string) => void;
  onSendMessage: () => void;
  inputDisabled?: boolean;
  inputPlaceholder?: string;
  onAttachmentHome?: () => void;
  onAttachmentDocument?: () => void;
  onAttachmentCalendar?: () => void;
  modals?: ReactNode;
};

/**
 * Shared messaging chrome used by buyer/client, agent, and brokerage surfaces.
 * Parents own data hooks + SSE; this shell owns sidebar + thread layout.
 */
export default function UnifiedMessagingShell({
  mode,
  isSidebarExpanded,
  onOverlayDismiss,
  sidebarHeader,
  sidebarContent,
  detailHeader = null,
  hideThread = false,
  canSendMessage,
  isLoadingHistory,
  localMessages,
  formatTime,
  messagesEndRef,
  onMessageListScroll,
  onRetryMessage,
  activeConversation = null,
  selectedClientName,
  onSearchClick,
  onAcceptEventRequest,
  onCancelEventRequest,
  acceptingEventRequestId = null,
  hasMoreOlder = false,
  isLoadingOlder = false,
  message,
  setMessage,
  onSendMessage,
  inputDisabled = false,
  inputPlaceholder,
  onAttachmentHome,
  onAttachmentDocument,
  onAttachmentCalendar,
  modals = null,
}: UnifiedMessagingShellProps) {
  return (
    <Box className="flex h-full w-full overflow-hidden">
      <Box className="relative flex h-full w-full overflow-hidden">
        <MessagingSidebarShell
          isSidebarExpanded={isSidebarExpanded}
          onOverlayDismiss={onOverlayDismiss}
          header={sidebarHeader}
        >
          {sidebarContent}
        </MessagingSidebarShell>
        {!hideThread ? (
          <section className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out">
            <Box className="flex min-h-0 flex-1 flex-col">
              {detailHeader ? (
                <Box className="hidden flex-shrink-0 md:block">{detailHeader}</Box>
              ) : null}
              <Box className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <Region
                  label="Message list"
                  className="scrollbar-hide min-h-0 min-w-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-2 py-3"
                  onScroll={onMessageListScroll}
                >
                  <Suspense fallback={<UnifiedMessagesListLoadingHistory />}>
                    <UnifiedMessagesList
                      mode={mode}
                      canSendMessage={canSendMessage}
                      isLoadingHistory={isLoadingHistory}
                      localMessages={localMessages}
                      isTyping={false}
                      formatTime={formatTime}
                      onSearchClick={onSearchClick}
                      messagesEndRef={messagesEndRef}
                      selectedClientName={selectedClientName}
                      onRetryMessage={onRetryMessage}
                      activeConversation={activeConversation}
                      onAcceptEventRequest={onAcceptEventRequest}
                      onCancelEventRequest={onCancelEventRequest}
                      acceptedEventRequestIds={new Set()}
                      acceptingEventRequestId={acceptingEventRequestId}
                      isLoadingOlder={isLoadingOlder}
                      hasMoreOlder={hasMoreOlder}
                    />
                  </Suspense>
                </Region>
              </Box>
              <UnifiedMessageInput
                mode={mode}
                message={message}
                setMessage={setMessage}
                isTyping={false}
                onSendMessage={onSendMessage}
                disabled={inputDisabled}
                placeholder={inputPlaceholder}
                selectedClientName={selectedClientName}
                onAttachmentHome={onAttachmentHome}
                onAttachmentDocument={onAttachmentDocument}
                onAttachmentCalendar={onAttachmentCalendar}
              />
            </Box>
          </section>
        ) : null}
      </Box>
      {modals}
    </Box>
  );
}
