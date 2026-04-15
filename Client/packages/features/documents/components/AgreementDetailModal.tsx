import { useState } from "react";

import { useDocusignActions } from "packages/features/documents/hooks/data/useDocusignActions";
import { useDocusignAgreement } from "packages/features/documents/hooks/data/useDocusignAgreement";
import { formatAgreementDate } from "packages/features/documents/utils/docusignHelpers";
import { useAuthStore } from "packages/store";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader.web";
import Button from "packages/ui/components/button/Button";
import CancelButton from "packages/ui/components/button/CancelButton";
import BaseModal from "packages/ui/components/modals/BaseModal";
import { Box } from "packages/ui/components/primitives";
import { getContextualAgreementStatus } from "packages/utils/agreement/contextualAgreementStatus";

import { BodyText } from "@/components/ui";

import { AgreementStatusBadge } from "./AgreementStatusBadge";
import EmbeddedSigning from "./EmbeddedSigning";

export type AgreementDetailModalProps = {
  agreementId: string | null;
  isOpen: boolean;
  onClose: () => void;
};

export function AgreementDetailModal({
  agreementId,
  isOpen,
  onClose,
}: AgreementDetailModalProps) {
  const idForQuery = isOpen && agreementId ? agreementId : undefined;
  const { agreement, isLoading, error } = useDocusignAgreement(idForQuery);
  const { sendAgreement, isSendingAgreement } = useDocusignActions();
  const user = useAuthStore((s) => s.user);
  const [showSigning, setShowSigning] = useState(false);

  const title = agreement?.title ?? "Agreement details";

  const handleSendAgreement = async () => {
    if (!agreementId) return;
    try {
      await sendAgreement({ agreementId });
      // Agreement status will update via React Query cache invalidation
    } catch {
      // Error already handled by mutation (toast shown)
    }
  };

  const handleSignNow = () => {
    setShowSigning(true);
  };

  const handleSigningComplete = () => {
    setShowSigning(false);
    // Agreement will refetch automatically via React Query
  };

  // Reset signing view when modal closes
  const handleClose = () => {
    setShowSigning(false);
    onClose();
  };

  const isOwnerAgent = Boolean(
    user && agreement && user.id === agreement.agent_id,
  );
  const canSend = isOwnerAgent && agreement?.status === "draft";
  const myParticipant = agreement?.participants?.find(
    (p) =>
      p.user_id === user?.id || Boolean(user?.email && p.email === user.email),
  );
  const contextualStatus =
    user?.id && agreement
      ? getContextualAgreementStatus(agreement, user.id, isOwnerAgent)
      : null;
  const showSignNowButton =
    contextualStatus === "sign_now" && Boolean(myParticipant);
  const awaitingSend = !isOwnerAgent && agreement?.status === "draft";

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title={title} size="lg">
      <Box className="min-h-32 py-2">
        {isLoading ? (
          <Box className="flex justify-center py-8">
            <KeyTurnLoader message="Loading agreement…" />
          </Box>
        ) : error ? (
          <BodyText size="sm" className="text-destructive">
            {error}
          </BodyText>
        ) : agreement ? (
          <>
            {showSigning && myParticipant ? (
              // Show embedded signing interface
              <EmbeddedSigning
                agreementId={agreement.id}
                participantId={myParticipant.id}
                onComplete={handleSigningComplete}
                height="600px"
                pdfViewerTitle={agreement.title}
              />
            ) : (
              // Show agreement details
              <Box className="space-y-3">
                <Box className="flex flex-wrap items-center gap-2">
                  <AgreementStatusBadge status={agreement.status} size="sm" />
                </Box>
                {agreement.buyer_name ? (
                  <Box className="flex flex-row flex-wrap items-baseline gap-1">
                    <BodyText
                      as="span"
                      size="sm"
                      className="text-text-primary font-medium"
                    >
                      Buyer:
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
                  Updated{" "}
                  {formatAgreementDate(
                    agreement.updated_at || agreement.created_at,
                  )}
                </BodyText>
              </Box>
            )}
          </>
        ) : (
          <BodyText size="sm" muted>
            Agreement not found.
          </BodyText>
        )}

        {/* Status message for buyers when agreement hasn't been sent yet */}
        {awaitingSend && !showSigning && (
          <Box className="border-border bg-background-base mt-3 rounded-md border px-4 py-3">
            <BodyText size="sm" muted>
              Your agent has not sent this agreement for signing yet. You will
              be able to sign once it has been sent.
            </BodyText>
          </Box>
        )}

        {/* Action buttons */}
        <Box className="mt-4 flex justify-end gap-2">
          {!showSigning && agreement && (
            <>
              {canSend && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSendAgreement}
                  disabled={isSendingAgreement}
                >
                  {isSendingAgreement ? "Sending..." : "Send Agreement"}
                </Button>
              )}
              {showSignNowButton && myParticipant && (
                <Button variant="primary" size="md" onClick={handleSignNow}>
                  Sign Now
                </Button>
              )}
            </>
          )}
          <CancelButton onClick={handleClose} size="md">
            {showSigning ? "Back" : "Close"}
          </CancelButton>
        </Box>
      </Box>
    </BaseModal>
  );
}
