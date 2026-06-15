import { type MutableRefObject, type RefObject, useCallback, useRef } from "react";

import Loading from "@ui/asset/loading/Loading";
import { FlatList, View } from "react-native";

import type { EventRequestPayload } from "packages/features/messaging";
import { Box, Text } from "packages/ui/components/structure/primitives";

import { MessagingMessageRowNative } from "@/features/agent/components/messaging/messageRow/MessagingMessageRow.native";
import type { MessagingConfig } from "@/features/agent/components/messaging/screen/messagingConfig";
import type { ChatMessage } from "@/features/messaging/hooks/data/messaging/types";

type MessagingScreenNativeMessageListHandlers = {
  handleAcceptEventRequest: (messageId: string, payload: EventRequestPayload) => Promise<void>;
  handleCancelEventRequest: (messageId: string) => Promise<void>;
};

type MessagingScreenNativeMessageListProps = {
  listRef: RefObject<FlatList<ChatMessage> | null>;
  initialScrollSettledRef: MutableRefObject<boolean>;
  localMessages: ChatMessage[];
  isLoadingHistory: boolean;
  centeredStyle: object;
  listContentStyle: object;
  isAgent: boolean;
  formatTime: (date: Date) => string;
  retryMessage: (messageId: string) => void | Promise<void>;
  handlers: MessagingScreenNativeMessageListHandlers;
  acceptedEventRequestIds: Set<string>;
  acceptingEventRequestId: string | null;
  onAgreementViewDocument: (agreementId: string, documentName: string) => void;
  onAgreementSignNow: (agreementId: string) => void;
  emptyState: MessagingConfig["emptyStates"]["noMessages"];
  hasMoreOlder: boolean;
  isLoadingOlder: boolean;
  onLoadOlder: () => Promise<void>;
};

export function MessagingScreenNativeMessageList({
  listRef,
  initialScrollSettledRef,
  localMessages,
  isLoadingHistory,
  centeredStyle,
  listContentStyle,
  isAgent,
  formatTime,
  retryMessage,
  handlers,
  acceptedEventRequestIds,
  acceptingEventRequestId,
  onAgreementViewDocument,
  onAgreementSignNow,
  emptyState,
  hasMoreOlder,
  isLoadingOlder,
  onLoadOlder,
}: MessagingScreenNativeMessageListProps) {
  const loadOlderGuardRef = useRef(false);

  const handleStartReached = useCallback(() => {
    if (!initialScrollSettledRef.current) return;
    if (!hasMoreOlder || isLoadingOlder || loadOlderGuardRef.current) return;
    loadOlderGuardRef.current = true;
    void onLoadOlder().finally(() => {
      setTimeout(() => {
        loadOlderGuardRef.current = false;
      }, 400);
    });
  }, [hasMoreOlder, initialScrollSettledRef, isLoadingOlder, onLoadOlder]);

  if (isLoadingHistory) {
    return (
      <View style={centeredStyle}>
        <Loading />
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={localMessages}
      keyExtractor={(item) => item.id}
      contentContainerStyle={listContentStyle}
      ListHeaderComponent={
        isLoadingOlder ? (
          <Box className="items-center py-2">
            <Loading />
          </Box>
        ) : null
      }
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 48,
      }}
      onStartReached={handleStartReached}
      onStartReachedThreshold={0.15}
      ListEmptyComponent={
        <Box style={centeredStyle}>
          <Text className="text-text-primary text-base font-medium">{emptyState.title}</Text>
          <Text className="text-text-secondary mt-1 text-center text-sm">{emptyState.message}</Text>
        </Box>
      }
      renderItem={({ item, index }) => (
        <MessagingMessageRowNative
          message={item}
          previousMessage={index > 0 ? localMessages[index - 1] : null}
          mode={isAgent ? "agent" : "client"}
          formatTime={formatTime}
          isMostRecentMessage={index === localMessages.length - 1}
          onRetryMessage={retryMessage}
          onAcceptEventRequest={handlers.handleAcceptEventRequest}
          onCancelEventRequest={handlers.handleCancelEventRequest}
          acceptedEventRequestIds={acceptedEventRequestIds}
          acceptingEventRequestId={acceptingEventRequestId}
          onAgreementViewDocument={onAgreementViewDocument}
          onAgreementSignNow={onAgreementSignNow}
        />
      )}
    />
  );
}
