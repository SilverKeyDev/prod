import { useState } from "react";

import { useLocalization } from "packages/contexts";
import EmbeddedSigning from "packages/features/documents/components/docusign/EmbeddedSigning";
import { useDocusignActions } from "packages/features/documents/hooks/data/docusign/useDocusignActions";
import { useDocusignAgreement } from "packages/features/documents/hooks/data/docusign/useDocusignAgreement";
import type { AgreementStatus } from "packages/features/documents/types/docusign";
import { formatAgreementDate } from "packages/features/documents/utils/docusignHelpers";
import { useAuthStore } from "packages/store";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader.web";
import Button from "packages/ui/components/button/Button";
import CancelButton from "packages/ui/components/button/CancelButton";
import BaseModal from "packages/ui/components/modals/BaseModal";
import { Box } from "packages/ui/components/primitives";
import { getContextualAgreementStatus } from "packages/utils/agreement/contextualAgreementStatus";

import { BodyText } from "@/components/ui";

import {
  AgreementDetailInFlightEnvelopePanel,
  AgreementDetailSendOptionsPanel,
} from "./AgreementDetailModalAgentPanels";
import {
  buildEnvelopeNotificationForSend,
  buildUpdateNotificationBody,
  participantCanResend,
} from "./agreementDetailModalSendHelpers";
import { AgreementStatusBadge } from "./AgreementStatusBadge";

const IN_FLIGHT_STATUSES: AgreementStatus[] = ["sent", "delivered", "signed"];

export type AgreementDetailModalProps = {
  agreementId: string | null;
  isOpen: boolean;
  onClose: () => void;
};

export function AgreementDetailModal({ agreementId, isOpen, onClose }: AgreementDetailModalProps) {
  const { t } = useLocalization();
  const idForQuery = isOpen && agreementId ? agreementId : undefined;
  const { agreement, isLoading, error } = useDocusignAgreement(idForQuery);
  const {
    sendAgreement,
    isSendingAgreement,
    resendAgreementRecipient,
    isResendingAgreementRecipient,
    updateAgreementEnvelopeNotification,
    isUpdatingAgreementEnvelopeNotification,
  } = useDocusignActions();
  const user = useAuthStore((s) => s.user);
  const [showSigning, setShowSigning] = useState(false);

  const [advancedSendOpen, setAdvancedSendOpen] = useState(false);
  const [sendRemDelay, setSendRemDelay] = useState("");
  const [sendRemFreq, setSendRemFreq] = useState("");
  const [sendExpAfter, setSendExpAfter] = useState("");
  const [sendExpWarn, setSendExpWarn] = useState("");

  const [resendNotes, setResendNotes] = useState<Record<string, string>>({});
  const [resendingParticipantId, setResendingParticipantId] = useState<string | null>(null);

  const [notifUseAccountDefaults, setNotifUseAccountDefaults] = useState(false);
  const [notifRemDelay, setNotifRemDelay] = useState("");
  const [notifRemFreq, setNotifRemFreq] = useState("");
  const [notifExpAfter, setNotifExpAfter] = useState("");
  const [notifExpWarn, setNotifExpWarn] = useState("");

  const title = agreement?.title ?? t("docusign.detail_title_fallback");

  const handleSendAgreement = async () => {
    if (!agreementId) return;
    try {
      const envelope_notification = buildEnvelopeNotificationForSend({
        advancedOpen: advancedSendOpen,
        remDelay: sendRemDelay,
        remFreq: sendRemFreq,
        expAfter: sendExpAfter,
        expWarn: sendExpWarn,
      });
      await sendAgreement({
        agreementId,
        ...(envelope_notification ? { envelope_notification } : {}),
      });
    } catch {
      // Error already handled by mutation (toast shown)
    }
  };

  const handleResend = async (participantId: string) => {
    if (!agreementId) return;
    setResendingParticipantId(participantId);
    try {
      await resendAgreementRecipient({
        agreementId,
        participantId,
        note: resendNotes[participantId],
      });
    } catch {
      // Error already handled by mutation (toast shown)
    } finally {
      setResendingParticipantId(null);
    }
  };

  const handleSaveNotification = async () => {
    if (!agreementId) return;
    try {
      await updateAgreementEnvelopeNotification({
        agreementId,
        body: buildUpdateNotificationBody({
          useAccountDefaults: notifUseAccountDefaults,
          remDelay: notifRemDelay,
          remFreq: notifRemFreq,
          expAfter: notifExpAfter,
          expWarn: notifExpWarn,
        }),
      });
    } catch {
      // Error already handled by mutation (toast shown)
    }
  };

  const handleClose = () => {
    setShowSigning(false);
    onClose();
  };

  const isOwnerAgent = Boolean(user && agreement && user.id === agreement.agent_id);
  const canSend = isOwnerAgent && agreement?.status === "draft";
  const myParticipant = agreement?.participants?.find(
    (p) => p.user_id === user?.id || Boolean(user?.email && p.email === user.email)
  );
  const contextualStatus =
    user?.id && agreement
      ? getContextualAgreementStatus(agreement, user.id, isOwnerAgent, user.email)
      : null;
  const showSignNowButton = contextualStatus === "sign_now" && Boolean(myParticipant);
  const awaitingSend = !isOwnerAgent && agreement?.status === "draft";

  const canManageInFlightEnvelope =
    isOwnerAgent &&
    agreement &&
    IN_FLIGHT_STATUSES.includes(agreement.status) &&
    Boolean(agreement.docusign_envelope_id);

  const pendingResendParticipants = agreement?.participants?.filter(participantCanResend) ?? [];

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title={title} size="lg">
      <Box className="min-h-32 py-2">
        {isLoading ? (
          <Box className="flex justify-center py-8">
            <KeyTurnLoader message={t("docusign.detail_loading")} />
          </Box>
        ) : error ? (
          <BodyText size="sm" className="text-destructive">
            {error}
          </BodyText>
        ) : agreement ? (
          <>
            {showSigning && myParticipant ? (
              <EmbeddedSigning
                agreementId={agreement.id}
                participantId={myParticipant.id}
                onComplete={() => setShowSigning(false)}
                height="600px"
                pdfViewerTitle={agreement.title}
              />
            ) : (
              <Box className="space-y-3">
                <Box className="flex flex-wrap items-center gap-2">
                  <AgreementStatusBadge status={agreement.status} size="sm" />
                </Box>
                {agreement.buyer_name ? (
                  <Box className="flex flex-row flex-wrap items-baseline gap-1">
                    <BodyText as="span" size="sm" className="text-text-primary font-medium">
                      {t("docusign.detail_buyer_label")}
                    </BodyText>
                    <BodyText as="span" size="sm">
                      {agreement.buyer_name}
                    </BodyText>
                  </Box>
                ) : null}
                {agreement.property_address ? (
                  <BodyText size="sm" muted>
                    {agreement.property_address}
                  </BodyText>
                ) : null}
                <BodyText size="xs" muted>
                  {t("docusign.detail_updated_prefix")}{" "}
                  {formatAgreementDate(agreement.updated_at || agreement.created_at)}
                </BodyText>

                {canSend ? (
                  <AgreementDetailSendOptionsPanel
                    t={t}
                    advancedSendOpen={advancedSendOpen}
                    onToggleAdvanced={() => setAdvancedSendOpen((o) => !o)}
                    sendRemDelay={sendRemDelay}
                    setSendRemDelay={setSendRemDelay}
                    sendRemFreq={sendRemFreq}
                    setSendRemFreq={setSendRemFreq}
                    sendExpAfter={sendExpAfter}
                    setSendExpAfter={setSendExpAfter}
                    sendExpWarn={sendExpWarn}
                    setSendExpWarn={setSendExpWarn}
                  />
                ) : null}

                {canManageInFlightEnvelope ? (
                  <AgreementDetailInFlightEnvelopePanel
                    t={t}
                    pendingSigners={pendingResendParticipants}
                    resendNotes={resendNotes}
                    setResendNotes={setResendNotes}
                    onResend={(id) => void handleResend(id)}
                    isResendingAgreementRecipient={isResendingAgreementRecipient}
                    resendingParticipantId={resendingParticipantId}
                    notifUseAccountDefaults={notifUseAccountDefaults}
                    setNotifUseAccountDefaults={setNotifUseAccountDefaults}
                    notifRemDelay={notifRemDelay}
                    setNotifRemDelay={setNotifRemDelay}
                    notifRemFreq={notifRemFreq}
                    setNotifRemFreq={setNotifRemFreq}
                    notifExpAfter={notifExpAfter}
                    setNotifExpAfter={setNotifExpAfter}
                    notifExpWarn={notifExpWarn}
                    setNotifExpWarn={setNotifExpWarn}
                    onSaveNotification={() => void handleSaveNotification()}
                    isUpdatingAgreementEnvelopeNotification={
                      isUpdatingAgreementEnvelopeNotification
                    }
                  />
                ) : null}
              </Box>
            )}
          </>
        ) : (
          <BodyText size="sm" muted>
            {t("docusign.detail_not_found")}
          </BodyText>
        )}

        {awaitingSend && !showSigning && (
          <Box className="border-border bg-background-base mt-3 rounded-md border px-4 py-3">
            <BodyText size="sm" muted>
              {t("docusign.detail_awaiting_send_buyer")}
            </BodyText>
          </Box>
        )}

        <Box className="mt-4 flex justify-end gap-2">
          {!showSigning && agreement && (
            <>
              {canSend && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => void handleSendAgreement()}
                  disabled={isSendingAgreement}
                  iconName="send"
                >
                  {isSendingAgreement
                    ? t("docusign.detail_send_sending")
                    : t("docusign.detail_send_button")}
                </Button>
              )}
              {showSignNowButton && myParticipant && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setShowSigning(true)}
                  iconName="file-signature"
                >
                  {t("docusign.detail_sign_now")}
                </Button>
              )}
            </>
          )}
          <CancelButton onClick={handleClose} size="md">
            {showSigning ? t("docusign.detail_back") : t("docusign.detail_close")}
          </CancelButton>
        </Box>
      </Box>
    </BaseModal>
  );
}
