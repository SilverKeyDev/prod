import React from "react";

import Button from "@ui/button/Button";

import { useLocalization } from "packages/contexts";
import { useAgentClients } from "packages/features/agent";
import { PdfModal } from "packages/features/documents/components/pdf/PdfModalBridge";
import type { SavedPageLayoutProps } from "packages/features/saved/components/layout/SavedPageLayout";
import DocumentUploadModal from "packages/features/saved/components/upload/DocumentUploadModal";
import type { SavedHome } from "packages/types";
import { BaseModal } from "packages/ui/components/modals";
import { Box, Text } from "packages/ui/components/primitives";
import { displayListingPriceForCard } from "packages/utils/search/pricing/formatPropertySearchListingPrice";

type SavedPageNativeModalsProps = Pick<
  SavedPageLayoutProps,
  | "currentPdf"
  | "currentDocumentId"
  | "currentDocumentName"
  | "closePdfModal"
  | "isCompareModalOpen"
  | "setIsCompareModalOpen"
  | "isNegotiationModalOpen"
  | "selectedHomeForNegotiation"
  | "onCloseNegotiation"
  | "selectedHomesData"
  | "onRemoveFromComparison"
  | "isDocumentUploadModalOpen"
  | "setIsDocumentUploadModalOpen"
  | "refetchDocuments"
  | "isAgent"
  | "selectedClientId"
  | "setSelectedClientId"
> & {
  isClientSelectorOpen: boolean;
  onCloseClientSelector: () => void;
};

export function SavedPageNativeModals({
  currentPdf,
  currentDocumentId,
  currentDocumentName,
  closePdfModal,
  isCompareModalOpen,
  setIsCompareModalOpen,
  isNegotiationModalOpen,
  selectedHomeForNegotiation,
  onCloseNegotiation,
  selectedHomesData,
  onRemoveFromComparison,
  isDocumentUploadModalOpen,
  setIsDocumentUploadModalOpen,
  refetchDocuments,
  isAgent,
  selectedClientId,
  setSelectedClientId,
  isClientSelectorOpen,
  onCloseClientSelector,
}: SavedPageNativeModalsProps) {
  const { t } = useLocalization();
  const { clients, isLoading: isLoadingClients } = useAgentClients();

  return (
    <>
      <PdfModal
        currentPdf={currentPdf}
        currentReportAddress={currentDocumentName}
        reportId={currentDocumentId}
        onClose={closePdfModal}
      />

      <BaseModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        title={t("saved.compare_modal_title", {
          defaultValue: "Compare homes",
        })}
      >
        {selectedHomesData.length === 0 ? (
          <Text className="text-text-secondary text-sm">
            {t("saved.compare_modal_empty", {
              defaultValue: "Select at least two homes to compare.",
            })}
          </Text>
        ) : (
          <>
            {selectedHomesData.map((home: SavedHome) => (
              <Box
                key={home.home_id}
                className="border-border bg-background-surface mb-3 rounded-md border p-3"
              >
                <Text className="text-text-primary text-sm font-semibold" numberOfLines={2}>
                  {home.address ?? home.description ?? ""}
                </Text>
                <Text className="text-text-secondary mt-1 text-xs">
                  {displayListingPriceForCard(home.price, { unavailableLabel: "Price N/A" })}
                </Text>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => onRemoveFromComparison(home.home_id)}
                  className="mt-2 self-start"
                  iconName="trash-2"
                >
                  <Text className="text-xs font-medium">
                    {t("saved.remove_from_compare", { defaultValue: "Remove" })}
                  </Text>
                </Button>
              </Box>
            ))}
          </>
        )}
      </BaseModal>

      <BaseModal
        isOpen={isNegotiationModalOpen}
        onClose={onCloseNegotiation}
        title={t("saved.negotiate_modal_title", { defaultValue: "Negotiate" })}
      >
        {selectedHomeForNegotiation ? (
          <>
            <Text className="text-text-primary text-sm font-semibold" numberOfLines={2}>
              {selectedHomeForNegotiation.address ?? selectedHomeForNegotiation.description ?? ""}
            </Text>
            <Text className="text-text-secondary mt-1 text-xs">
              {displayListingPriceForCard(selectedHomeForNegotiation.price, {
                unavailableLabel: "Price N/A",
              })}
            </Text>
            <Text className="text-text-secondary mt-3 text-sm">
              {t("saved.negotiate_modal_body", {
                defaultValue:
                  "Start the conversation with your agent from Messaging to discuss this home.",
              })}
            </Text>
          </>
        ) : (
          <Text className="text-text-secondary text-sm">
            {t("saved.negotiate_modal_empty", {
              defaultValue: "Select a home to start negotiation.",
            })}
          </Text>
        )}
      </BaseModal>

      <DocumentUploadModal
        isOpen={isDocumentUploadModalOpen}
        onClose={() => setIsDocumentUploadModalOpen(false)}
        onUploadSuccess={refetchDocuments}
      />

      {isAgent && (
        <BaseModal
          isOpen={isClientSelectorOpen}
          onClose={onCloseClientSelector}
          title={t("saved.select_client_modal_title", {
            defaultValue: "Select client",
          })}
        >
          {isLoadingClients ? (
            <Text className="text-text-secondary text-sm">
              {t("client_selector.loading_clients", {
                defaultValue: "Loading clients…",
              })}
            </Text>
          ) : clients.length === 0 ? (
            <Box className="gap-1">
              <Text className="text-text-primary text-sm font-medium">
                {t("client_selector.no_clients_found", {
                  defaultValue: "No clients found",
                })}
              </Text>
              <Text className="text-text-secondary text-xs">
                {t("client_selector.no_clients_hint", {
                  defaultValue:
                    "Clients you work with will appear here once they are added to your workspace.",
                })}
              </Text>
            </Box>
          ) : (
            <>
              <Button
                variant={selectedClientId === null ? "primary" : "secondary"}
                size="sm"
                onPress={() => {
                  setSelectedClientId(null);
                  onCloseClientSelector();
                }}
                className="mb-2 w-full"
              >
                <Text className="text-sm font-medium">
                  {t("client_selector.me", { defaultValue: "Me" })}
                </Text>
              </Button>
              {clients.map((client) => (
                <Button
                  key={client.id}
                  variant={selectedClientId === client.id ? "primary" : "secondary"}
                  size="sm"
                  onPress={() => {
                    setSelectedClientId(client.id);
                    onCloseClientSelector();
                  }}
                  className="mb-2 w-full"
                >
                  <Text className="text-sm font-medium">{client.name}</Text>
                </Button>
              ))}
            </>
          )}
        </BaseModal>
      )}
    </>
  );
}
