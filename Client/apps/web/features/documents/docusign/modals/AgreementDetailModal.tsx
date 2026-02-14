import { useState } from "react";
import { Tab } from "@headlessui/react";
import { Title, BodyText, CloseButton } from "../../../../components/ui";
import BaseModal from "../../../../components/modals/BaseModal";
import AgreementStatusBadge from "../components/AgreementStatusBadge";
import AgreementOverviewTab from "../components/AgreementOverviewTab";
import AgreementRevisionsTab from "../components/AgreementRevisionsTab";
import ParticipantsList from "../components/ParticipantsList";
import EmbeddedSigning from "../components/EmbeddedSigning";
import { useDocusignAgreement } from "../../../../../../packages/hooks/data/documents/useDocusignAgreement";
import { useDocusignActions } from "../../../../../../packages/hooks/data/documents/useDocusignActions";
import { useAuthStore } from "../../../../../../packages/store/auth.slice";
import { useUIStore } from "../../../../../../packages/store";
import {
  getAgreementTypeLabel,
  canUserSign,
  canUserSend,
  canUserVoid,
  canUserCreateRevision,
} from "../../../../../../packages/utils/documents/docusignHelpers";
import { KeyTurnLoader } from "../../../../components/ui";

type AgreementDetailModalProps = {
  agreementId: string | null;
  isOpen: boolean;
  onClose: () => void;
};

/**
 * AgreementDetailModal Component
 *
 * Full agreement management modal with tabs:
 * - Overview: metadata and status
 * - Revisions: version history
 * - Participants: signing status
 * - Sign: embedded signing (if applicable)
 */
export default function AgreementDetailModal({
  agreementId,
  isOpen,
  onClose,
}: AgreementDetailModalProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [showRevisionUpload, setShowRevisionUpload] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);

  const user = useAuthStore((s) => s.user);
  const isAgent = user?.user_type === "agent";
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  const { agreement, isLoading, error, refetchAgreement } =
    useDocusignAgreement(agreementId ?? undefined);
  const {
    sendAgreement,
    voidAgreement,
    isSendingAgreement,
    isVoidingAgreement,
  } = useDocusignActions();

  const userCanSign =
    agreement && user ? canUserSign(agreement, user.id) : false;
  const userCanSend =
    agreement && user ? canUserSend(agreement, user.id, isAgent) : false;
  const userCanVoid =
    agreement && user ? canUserVoid(agreement, user.id, isAgent) : false;
  const userCanCreateRevision =
    agreement && user
      ? canUserCreateRevision(agreement, user.id, isAgent)
      : false;

  // Find user's participant record for signing
  const userParticipant = agreement?.participants?.find(
    (p) => p.user_id === user?.id,
  );

  const handleSend = async () => {
    if (!agreement) return;

    try {
      await sendAgreement({
        agreementId: agreement.id,
        signingMethod: "embedded",
      });

      enqueueToast({
        type: "success",
        message: "Agreement sent for signature",
      });

      await refetchAgreement();
    } catch (error) {
      enqueueToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to send agreement",
      });
    }
  };

  const handleVoid = async () => {
    if (!agreement) return;

    try {
      await voidAgreement({
        agreementId: agreement.id,
        reason: voidReason.trim() || undefined,
      });

      enqueueToast({
        type: "success",
        message: "Agreement voided successfully",
      });

      setShowVoidConfirm(false);
      setVoidReason("");
      await refetchAgreement();
    } catch (error) {
      enqueueToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to void agreement",
      });
    }
  };

  const handleRevisionSuccess = async () => {
    setShowRevisionUpload(false);
    await refetchAgreement();
  };

  const handleSigningComplete = async () => {
    await refetchAgreement();
    setActiveTab(0); // Return to overview
  };

  const handleDownloadRevision = (revisionId: string) => {
    enqueueToast({
      type: "info",
      message: "Download feature coming soon",
    });
  };

  if (!isOpen) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1 min-w-0 mr-4">
            {isLoading ? (
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
            ) : agreement ? (
              <>
                <Title size="lg" className="truncate">
                  {agreement.title}
                </Title>
                <BodyText size="sm" muted className="mt-1">
                  {getAgreementTypeLabel(agreement.agreement_type)}
                </BodyText>
              </>
            ) : (
              <Title size="lg">Agreement Details</Title>
            )}
          </div>
          {agreement && (
            <AgreementStatusBadge status={agreement.status} size="md" />
          )}
          <CloseButton onClick={onClose} className="ml-4" />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <KeyTurnLoader message="Loading agreement..." />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <BodyText size="md" className="text-red-600 mb-2">
                Failed to load agreement
              </BodyText>
              <BodyText size="sm" muted>
                {error}
              </BodyText>
            </div>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && agreement && (
          <>
            {/* Tabs */}
            <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
              <Tab.List className="flex border-b border-gray-200 px-6">
                <Tab
                  className={({ selected }) =>
                    `px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      selected
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    }`
                  }
                >
                  Overview
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      selected
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    }`
                  }
                >
                  Revisions ({agreement.revisions?.length || 0})
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      selected
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    }`
                  }
                >
                  Participants ({agreement.participants?.length || 0})
                </Tab>
                {userCanSign && (
                  <Tab
                    className={({ selected }) =>
                      `px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        selected
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-600 hover:text-gray-900"
                      }`
                    }
                  >
                    Sign
                  </Tab>
                )}
              </Tab.List>

              <Tab.Panels className="flex-1 overflow-y-auto p-6">
                {/* Overview Tab */}
                <Tab.Panel>
                  <AgreementOverviewTab
                    agreement={agreement}
                    userCanSend={userCanSend}
                    userCanVoid={userCanVoid}
                    isSendingAgreement={isSendingAgreement}
                    isVoidingAgreement={isVoidingAgreement}
                    showVoidConfirm={showVoidConfirm}
                    voidReason={voidReason}
                    onSend={handleSend}
                    onVoidClick={() => setShowVoidConfirm(true)}
                    onVoidConfirm={handleVoid}
                    onVoidCancel={() => {
                      setShowVoidConfirm(false);
                      setVoidReason("");
                    }}
                    onVoidReasonChange={setVoidReason}
                  />
                </Tab.Panel>

                {/* Revisions Tab */}
                <Tab.Panel>
                  <AgreementRevisionsTab
                    agreementId={agreement.id}
                    revisions={agreement.revisions || []}
                    userCanCreateRevision={userCanCreateRevision}
                    showRevisionUpload={showRevisionUpload}
                    onUploadClick={() => setShowRevisionUpload(true)}
                    onUploadSuccess={handleRevisionSuccess}
                    onUploadCancel={() => setShowRevisionUpload(false)}
                    onDownloadClick={handleDownloadRevision}
                  />
                </Tab.Panel>

                {/* Participants Tab */}
                <Tab.Panel>
                  <ParticipantsList
                    participants={agreement.participants || []}
                    showOrder={true}
                    compact={false}
                  />
                </Tab.Panel>

                {/* Sign Tab */}
                {userCanSign && (
                  <Tab.Panel>
                    {userParticipant ? (
                      <EmbeddedSigning
                        agreementId={agreement.id}
                        participantId={userParticipant.id}
                        onComplete={handleSigningComplete}
                        height="500px"
                      />
                    ) : (
                      <div className="text-center py-8">
                        <BodyText size="sm" muted>
                          Unable to load signing interface
                        </BodyText>
                      </div>
                    )}
                  </Tab.Panel>
                )}
              </Tab.Panels>
            </Tab.Group>
          </>
        )}
      </div>
    </BaseModal>
  );
}
