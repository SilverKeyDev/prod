import { useState, useMemo } from "react";
import { Plus, FileText } from "lucide-react";
import { useDocusignAgreements } from "../../../../../packages/hooks/data/documents/useDocusignAgreements";
import { Button, Title, BodyText } from "../../../components/ui";
import AgreementListItem from "../../documents/docusign/components/AgreementListItem";
import { CreateAgreementModal, AgreementDetailModal } from "../../documents/docusign/modals";
import { KeyTurnLoader } from "../../../components/ui";
import { useUIStore } from "../../../../../packages/store";
import { useDocusignActions } from "../../../../../packages/hooks/data/documents/useDocusignActions";

type ClientAgreementsProps = {
  clientId: string;
};

/**
 * ClientAgreements Component
 * 
 * Shows all DocuSign agreements for a specific client in ClientHub
 * Grouped by status: Active, Completed, Voided
 */
export default function ClientAgreements({ clientId }: ClientAgreementsProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);

  const { agreements, isLoading, error, refetchAgreements } = useDocusignAgreements();
  const { sendAgreement, voidAgreement } = useDocusignActions();
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  // Filter agreements for this client
  const clientAgreements = useMemo(() => {
    return agreements.filter((a) => a.buyer_id === clientId);
  }, [agreements, clientId]);

  // Group by status
  const groupedAgreements = useMemo(() => {
    const active = clientAgreements.filter(
      (a) =>
        a.status === "draft" ||
        a.status === "sent" ||
        a.status === "delivered" ||
        a.status === "signed"
    );
    const completed = clientAgreements.filter((a) => a.status === "completed");
    const voided = clientAgreements.filter(
      (a) => a.status === "voided" || a.status === "declined"
    );

    return { active, completed, voided };
  }, [clientAgreements]);

  const handleAgreementClick = (agreementId: string) => {
    setSelectedAgreementId(agreementId);
  };

  const handleAgreementSend = async (agreementId: string) => {
    try {
      await sendAgreement({
        agreementId,
        signingMethod: "embedded",
      });
      enqueueToast({
        type: "success",
        message: "Agreement sent for signature",
      });
      await refetchAgreements();
    } catch (err) {
      enqueueToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to send agreement",
      });
    }
  };

  const handleAgreementVoid = async (agreementId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to void this agreement? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      await voidAgreement({
        agreementId,
        reason: "Voided from ClientHub",
      });
      enqueueToast({
        type: "success",
        message: "Agreement voided successfully",
      });
      await refetchAgreements();
    } catch (err) {
      enqueueToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to void agreement",
      });
    }
  };

  const handleCreateSuccess = () => {
    refetchAgreements();
    setIsCreateModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="py-8 flex justify-center">
        <KeyTurnLoader message="Loading agreements..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <BodyText size="sm" className="text-red-600">
          Failed to load agreements: {error}
        </BodyText>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            <Title size="md">Agreements</Title>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Create Agreement
          </Button>
        </div>

        {/* Empty State */}
        {clientAgreements.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <BodyText size="md" className="text-gray-700 mb-2">
              No agreements yet
            </BodyText>
            <BodyText size="sm" muted className="mb-4">
              Create an agreement to get started
            </BodyText>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create Agreement
            </Button>
          </div>
        ) : (
          <>
            {/* Active Agreements */}
            {groupedAgreements.active.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Active ({groupedAgreements.active.length})
                </h3>
                <div className="space-y-3">
                  {groupedAgreements.active.map((agreement) => (
                    <AgreementListItem
                      key={agreement.id}
                      agreement={agreement}
                      onClick={() => handleAgreementClick(agreement.id)}
                      onSend={handleAgreementSend}
                      onVoid={handleAgreementVoid}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Agreements */}
            {groupedAgreements.completed.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Completed ({groupedAgreements.completed.length})
                </h3>
                <div className="space-y-3">
                  {groupedAgreements.completed.map((agreement) => (
                    <AgreementListItem
                      key={agreement.id}
                      agreement={agreement}
                      onClick={() => handleAgreementClick(agreement.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Voided Agreements */}
            {groupedAgreements.voided.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Voided ({groupedAgreements.voided.length})
                </h3>
                <div className="space-y-3">
                  {groupedAgreements.voided.map((agreement) => (
                    <AgreementListItem
                      key={agreement.id}
                      agreement={agreement}
                      onClick={() => handleAgreementClick(agreement.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <CreateAgreementModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        preselectedBuyerId={clientId}
        onSuccess={handleCreateSuccess}
      />
      <AgreementDetailModal
        agreementId={selectedAgreementId}
        isOpen={!!selectedAgreementId}
        onClose={() => setSelectedAgreementId(null)}
      />
    </>
  );
}
