import { useMemo, useState } from "react";

import { Icon } from "@ui/icons";

import { useFeature, useLocalization } from "packages/contexts";
import {
  AgreementDetailModal,
  AgreementListItem,
  CreateAgreementModal,
} from "packages/features/documents";
import { useUIStore } from "packages/store";
import type { Agreement } from "packages/types";
import Loading from "packages/ui/components/asset/loading/Loading";
import Button from "packages/ui/components/button/Button";
import { Box, Text } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";

// Feature flags for agreements functionality
const AGREEMENTS_WEB_CLICK_EVENTS = "agreements_web_click_events";
const AGREEMENTS_FULL_INTERFACE = "agreements_full_interface";

function useButtonPress(fn: () => void) {
  const webClickEvents = useFeature(AGREEMENTS_WEB_CLICK_EVENTS);
  return webClickEvents ? { onClick: fn } : { onPress: fn };
}

type ClientAgreementsProps = {
  clientId: string;
};

/**
 * ClientAgreements Component
 *
 * Shows agreement-related information for a specific client in ClientHub.
 * With full interface flag: complete list + modals. Without flag: placeholder message until signing is available.
 */
export default function ClientAgreements({ clientId }: ClientAgreementsProps) {
  const { t } = useLocalization();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);

  // Hook calls must be at the top level, before any conditional returns
  const createButtonProps = useButtonPress(() => setIsCreateModalOpen(true));
  const hasFullInterface = useFeature(AGREEMENTS_FULL_INTERFACE);
  const agreements = useMemo(() => [] as Agreement[], []);
  const isLoading = false;
  const error: unknown = null;
  const refetchAgreements = async () => {};
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  const clientAgreements = useMemo(() => {
    return agreements.filter((a) => a.buyer_id === clientId);
  }, [agreements, clientId]);

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

  if (!hasFullInterface) {
    return (
      <>
        <Box className="mb-3 flex-row items-center justify-between">
          <Text className="text-base font-semibold text-gray-900">
            {t("dashboard.agreements_title")}
          </Text>
        </Box>
        <Box className="items-center justify-center py-4">
          <Text className="mb-2 text-center text-sm text-gray-700">
            {t("dashboard.agreements_not_available", {
              defaultValue: "Agreements are not available yet.",
            })}
          </Text>
          <Text className="mb-4 text-center text-xs text-gray-600">
            {t("dashboard.agreements_not_available_body", {
              defaultValue:
                "We are migrating to a new signing provider. You can review agreements from the Documents section when available.",
            })}
          </Text>
        </Box>
        <CreateAgreementModal isOpen={false} onClose={() => {}} preselectedBuyerId={undefined} />
        <AgreementDetailModal agreementId={null} isOpen={false} onClose={() => {}} />
      </>
    );
  }

  if (isLoading) {
    return (
      <Box className="items-center justify-center py-8">
        <Loading message="Loading agreements..." />
      </Box>
    );
  }
  if (error) {
    return (
      <Box className="items-center justify-center py-8">
        <BodyText size="sm" className="text-red-600">
          {t("dashboard.agreements_failed_load", { error })}
        </BodyText>
      </Box>
    );
  }

  return (
    <>
      <Box className="gap-6">
        <Box className="flex-row items-center justify-between">
          <Box className="flex-row items-center gap-2">
            <Icon name="file-text" className="h-5 w-5 text-gray-600" />
            <Title size="md">{t("dashboard.agreements_title")}</Title>
          </Box>
          <Button variant="primary" size="sm" {...createButtonProps}>
            <Icon name="plus" className="mr-1 h-4 w-4" />
            {t("dashboard.agreements_create")}
          </Button>
        </Box>

        {clientAgreements.length === 0 ? (
          <Box className="rounded-lg border border-dashed border-gray-300 py-12">
            <Box className="items-center">
              <Icon name="file-text" className="mb-3 h-12 w-12 text-gray-400" />
              <BodyText size="md" className="mb-2 text-gray-700">
                {t("dashboard.agreements_no_yet")}
              </BodyText>
              <BodyText size="sm" muted className="mb-4">
                {t("dashboard.agreements_get_started")}
              </BodyText>
              <Button variant="primary" size="md" {...createButtonProps}>
                {t("dashboard.agreements_create")}
              </Button>
            </Box>
          </Box>
        ) : (
          <Box className="gap-6">
            {groupedAgreements.active.length > 0 && (
              <Box>
                <Title as="h3" size="sm" className="mb-3 font-medium text-gray-700">
                  {t("dashboard.agreements_active")} ({groupedAgreements.active.length})
                </Title>
                <Box className="gap-3">
                  {groupedAgreements.active.map((agreement) => (
                    <AgreementListItem
                      key={agreement.id}
                      agreement={agreement}
                      onClick={() => handleAgreementClick(agreement.id)}
                      onSend={handleAgreementSend}
                      onVoid={handleAgreementVoid}
                    />
                  ))}
                </Box>
              </Box>
            )}
            {groupedAgreements.completed.length > 0 && (
              <Box>
                <Title as="h3" size="sm" className="mb-3 font-medium text-gray-700">
                  {t("dashboard.agreements_completed")} ({groupedAgreements.completed.length})
                </Title>
                <Box className="gap-3">
                  {groupedAgreements.completed.map((agreement) => (
                    <AgreementListItem
                      key={agreement.id}
                      agreement={agreement}
                      onClick={() => handleAgreementClick(agreement.id)}
                    />
                  ))}
                </Box>
              </Box>
            )}
            {groupedAgreements.voided.length > 0 && (
              <Box>
                <Title as="h3" size="sm" className="mb-3 font-medium text-gray-700">
                  {t("dashboard.agreements_voided")} ({groupedAgreements.voided.length})
                </Title>
                <Box className="gap-3">
                  {groupedAgreements.voided.map((agreement) => (
                    <AgreementListItem
                      key={agreement.id}
                      agreement={agreement}
                      onClick={() => handleAgreementClick(agreement.id)}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>

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
