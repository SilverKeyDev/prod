import { useMemo, useState } from "react";

import { FileText, Plus } from "lucide-react";

import { useLocalization } from "packages/contexts";
import { useDocusignAgreements } from "packages/features/documents";
import {
  AgreementDetailModal,
  AgreementListItem,
  CreateAgreementModal,
  useDocusignActions,
} from "packages/features/documents";
import { useUIStore } from "packages/store";
import { BodyText, Button, Title } from "packages/ui/components/index.web";
import { KeyTurnLoader } from "packages/ui/components/index.web";
import { getWindow } from "packages/utils/platform";

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
  const { t } = useLocalization();
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
    const voided = clientAgreements.filter((a) => a.status === "voided" || a.status === "declined");

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
    const win = getWindow();
    const confirmed =
      win?.confirm?.(
        "Are you sure you want to void this agreement? This action cannot be undone."
      ) ?? false;
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
    void refetchAgreements();
    setIsCreateModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <KeyTurnLoader message="Loading agreements..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <BodyText size="sm" className="text-red-600">
          {t("dashboard.agreements_failed_load", { error })}
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
            <FileText className="h-5 w-5 text-gray-600" />
            <Title size="md">{t("dashboard.agreements_title")}</Title>
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            {t("dashboard.agreements_create")}
          </Button>
        </div>

        {/* Empty State */}
        {clientAgreements.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <BodyText size="md" className="mb-2 text-gray-700">
              {t("dashboard.agreements_no_yet")}
            </BodyText>
            <BodyText size="sm" muted className="mb-4">
              {t("dashboard.agreements_get_started")}
            </BodyText>
            <Button variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
              {t("dashboard.agreements_create")}
            </Button>
          </div>
        ) : (
          <>
            {/* Active Agreements */}
            {groupedAgreements.active.length > 0 && (
              <div>
                <Title as="h3" size="sm" className="mb-3 font-medium text-gray-700">
                  {t("dashboard.agreements_active")} ({groupedAgreements.active.length})
                </Title>
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
                <Title as="h3" size="sm" className="mb-3 font-medium text-gray-700">
                  {t("dashboard.agreements_completed")} ({groupedAgreements.completed.length})
                </Title>
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
                <Title as="h3" size="sm" className="mb-3 font-medium text-gray-700">
                  {t("dashboard.agreements_voided")} ({groupedAgreements.voided.length})
                </Title>
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
