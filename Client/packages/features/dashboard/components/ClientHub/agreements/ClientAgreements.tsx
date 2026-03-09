import { useMemo, useState } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import {
  AgreementDetailModal,
  AgreementListItem,
  CreateAgreementModal,
} from "packages/features/documents";
import { useUIStore } from "packages/store";
import type { Agreement } from "packages/types";

import { BodyText, Button, Title } from "@/components/ui";
import { KeyTurnLoader } from "@/components/ui";
type ClientAgreementsProps = {
  clientId: string;
};
/**
 * ClientAgreements Component
 *
 * Shows agreement-related information for a specific client in ClientHub.
 * The actual signing provider integration is temporarily disabled.
 * Grouped by status: Active, Completed, Voided
 */
export default function ClientAgreements({ clientId }: ClientAgreementsProps) {
  const { t } = useLocalization();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  const agreements = useMemo(() => [] as Agreement[], []);
  const isLoading = false;
  const error: unknown = null;
  const refetchAgreements = async () => {};
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
  const handleAgreementSend = async (_agreementId: string) => {
    enqueueToast({
      type: "info",
      message: "Agreement sending will be available soon.",
    });
  };
  const handleAgreementVoid = async (_agreementId: string) => {
    enqueueToast({
      type: "info",
      message: "Voiding agreements will be available soon.",
    });
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
            <Icon name="file-text" className="h-5 w-5 text-gray-600" />
            <Title size="md">{t("dashboard.agreements_title")}</Title>
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Icon name="plus" className="mr-1 h-4 w-4" />
            {t("dashboard.agreements_create")}
          </Button>
        </div>

        {/* Empty State */}
        {clientAgreements.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
            <Icon name="file-text" className="mx-auto mb-3 h-12 w-12 text-gray-400" />
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
