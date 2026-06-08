import React from "react";

import { CommonActions, useNavigation } from "@react-navigation/native";
import Loading from "@ui/asset/loading/Loading";
import { KeyboardAvoidingView, Platform, View } from "react-native";

import { useLocalization } from "packages/contexts";
import { messagingScreenNativeStyles } from "packages/features/agent/components/messaging/screenNative/MessagingScreen.native.styles";
import { MessagingScreenNativeComposer } from "packages/features/agent/components/messaging/screenNative/MessagingScreenNativeComposer.native";
import { MessagingScreenNativeHeader } from "packages/features/agent/components/messaging/screenNative/MessagingScreenNativeHeader.native";
import { MessagingScreenNativeMessageList } from "packages/features/agent/components/messaging/screenNative/MessagingScreenNativeMessageList.native";
import { MessagingScreenNativeOverlays } from "packages/features/agent/components/messaging/screenNative/MessagingScreenNativeOverlays.native";
import { useMessagingScreenNativeController } from "packages/features/agent/hooks/ui/useMessagingScreenNativeController";

import { MessagingAgentListSubview } from "./MessagingAgentListSubview.native";
import { MessagingClientEmptyState } from "./MessagingClientEmptyState.native";

const styles = messagingScreenNativeStyles;

export function MessagingScreenNative() {
  const navigation = useNavigation();
  const { t } = useLocalization();
  const c = useMessagingScreenNativeController();

  if (!c.authReady) {
    return (
      <View style={styles.centered}>
        <Loading />
      </View>
    );
  }

  if (c.isAgentWithoutSelection) {
    return (
      <MessagingAgentListSubview
        config={c.config}
        clients={c.clients}
        isLoadingClients={c.isLoadingClients}
        refreshChats={c.refreshChats}
        setSelectedClientId={c.setSelectedClientId}
        conversationMap={c.conversationMap}
        listContentStyle={styles.listContent}
        centeredStyle={styles.centered}
        containerStyle={styles.container}
      />
    );
  }

  if (!c.isAgent && !c.canSendMessage) {
    return (
      <MessagingClientEmptyState
        title={c.config.emptyStates.noAgent.title}
        message={c.config.emptyStates.noAgent.message}
        actionLabel={c.config.emptyStates.noAgent.actionLabel}
        onAction={() => c.setShowSearchModal(true)}
        secondaryActionLabel={t("agent.discovery_browse_full")}
        onSecondaryAction={() =>
          navigation.dispatch(CommonActions.navigate({ name: "FindAgents" }))
        }
        centeredStyle={styles.centered}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      /* eslint-disable-next-line silverkey/no-platform-feature-check -- Keyboard behavior differs by platform; useFeature is for product rollout, not layout */
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <MessagingScreenNativeHeader
        config={c.config}
        isAgent={c.isAgent}
        selectedClient={c.selectedClient}
        selectedClientId={c.selectedClientId}
        activeConversation={c.activeConversation}
        onRefreshChats={c.refreshChats}
        onBackToConversations={() => c.setSelectedClientId(null)}
      />

      <MessagingScreenNativeMessageList
        listRef={c.listRef}
        initialScrollSettledRef={c.initialScrollSettledRef}
        localMessages={c.localMessages}
        isLoadingHistory={c.isLoadingHistory}
        centeredStyle={styles.centered}
        listContentStyle={styles.listContent}
        isAgent={c.isAgent}
        formatTime={c.formatTime}
        retryMessage={c.retryMessage}
        handlers={c.handlers}
        acceptedEventRequestIds={c.acceptedEventRequestIds}
        acceptingEventRequestId={c.acceptingEventRequestId}
        onAgreementViewDocument={c.handleMessagingAgreementView}
        onAgreementSignNow={c.handleMessagingAgreementSignNow}
        emptyState={c.config.emptyStates.noMessages}
        hasMoreOlder={c.hasMoreOlder}
        isLoadingOlder={c.isLoadingOlder}
        onLoadOlder={c.loadOlderMessages}
      />

      <MessagingScreenNativeComposer
        inputText={c.inputText}
        onInputTextChange={c.setInputText}
        canSendMessage={c.canSendMessage}
        config={c.config}
        onSend={c.handleSend}
        onOpenAttachmentMenu={() => c.setShowAttachmentMenu(true)}
        inputRowStyle={styles.inputRow}
      />

      <MessagingScreenNativeOverlays
        showAttachmentMenu={c.showAttachmentMenu}
        onCloseAttachmentMenu={() => c.setShowAttachmentMenu(false)}
        onShareHome={() => c.setShowSelectHomeModal(true)}
        onShareDocument={() => c.setShowSelectDocumentModal(true)}
        onCalendarEvent={() => c.setShowCalendarEventModal(true)}
        showSearchModal={c.showSearchModal}
        onCloseSearchModal={() => c.setShowSearchModal(false)}
        showSelectHomeModal={c.showSelectHomeModal}
        onCloseSelectHomeModal={() => c.setShowSelectHomeModal(false)}
        onSelectHomes={c.handlers.handleSelectHomes}
        showSelectDocumentModal={c.showSelectDocumentModal}
        onCloseSelectDocumentModal={() => c.setShowSelectDocumentModal(false)}
        onSelectDocument={c.handlers.handleSelectDocument}
        showCalendarEventModal={c.showCalendarEventModal}
        onCloseCalendarEventModal={() => c.setShowCalendarEventModal(false)}
        onCalendarEventSuccess={c.handlers.handleCalendarEventSuccess}
        sendMessage={c.sendMessage}
        currentPdf={c.currentPdf}
        currentDocumentId={c.currentDocumentId}
        currentDocumentName={c.currentDocumentName}
        onClosePdfModal={c.closePdfModal}
        agreementSigningSession={c.agreementSigningSession}
        onDismissAgreementSigning={c.dismissAgreementSigning}
        onAgreementSigningComplete={c.onAgreementSigningComplete}
        viewSignedAgreement={c.viewSignedAgreement}
        onDismissViewSignedAgreement={c.dismissViewSignedAgreement}
      />
    </KeyboardAvoidingView>
  );
}
