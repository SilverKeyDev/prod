/* eslint-disable silverkey/max-lines-hard, max-lines-per-function -- TODO: split into subcomponents (SavedHomesList, SavedDocumentsList, etc.) */
import React, { useCallback, useMemo } from "react";

import { Linking, RefreshControl } from "react-native";

import { getEnv } from "packages/config";
import { useLocalization } from "packages/contexts";
import type { Agreement, DocumentData } from "packages/features/documents";
import type { SavedHome } from "packages/types";
import { BaseModal, PdfModal } from "packages/ui/components/modals";
import { Box, Button, PrimitiveInput, ScrollView, Text } from "packages/ui/components/primitives";
import { dateParseISO } from "packages/utils/date";

import type { SavedPageLayoutProps } from "./SavedPageLayout";

type _SavedPageViewType = "homes" | "documents";
type _EventTypeFilter = "listed" | "price_change" | "sold" | "withdrawn" | "";

type CombinedItem =
  | { type: "document"; data: DocumentData }
  | { type: "agreement"; data: Agreement };

function formatPrice(value: string | number | null | undefined): string {
  if (value == null) return "Price N/A";
  const asNumber =
    typeof value === "string"
      ? Number(value.replace(/[^0-9.-]/g, ""))
      : typeof value === "number"
        ? value
        : Number.NaN;
  if (!Number.isFinite(asNumber)) return String(value);
  return `$${asNumber.toLocaleString()}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const parsed = dateParseISO(value);
  if (Number.isNaN(parsed.valueOf())) return "";
  return parsed.toLocaleDateString();
}

export function SavedPageLayout(nativeProps: SavedPageLayoutProps) {
  const {
    viewType,
    searchTerm,
    setSearchTerm,
    selectedClientId,
    setSelectedClientId: _setSelectedClientId,
    eventTypeFilter: _eventTypeFilter,
    setEventTypeFilter: _setEventTypeFilter,
    setViewType,
    filteredHomes,
    filteredDocuments,
    loading,
    documentsLoadingState,
    agreements,
    agreementsLoading,
    selectedHomesForComparison,
    selectedHomesData,
    selectedProperty,
    isLoadingPropertyDetails: _isLoadingPropertyDetails,
    isCompareModalOpen,
    setIsCompareModalOpen,
    isNegotiationModalOpen,
    selectedHomeForNegotiation,
    isDocumentUploadModalOpen,
    setIsDocumentUploadModalOpen,
    isCreateAgreementModalOpen,
    setIsCreateAgreementModalOpen,
    selectedAgreementId,
    setSelectedAgreementId,
    isAgent,
    homes,
    currentPdf,
    currentDocumentId,
    currentDocumentName,
    closePdfModal,
    onViewDocument,
    onDownloadDocument,
    onShareDocument,
    onToggleHomeSelection,
    onUnlockHome,
    onOpenNegotiation,
    onDocumentDelete,
    onAgreementClick,
    onAgreementSend,
    onAgreementVoid,
    onRemoveFromComparison,
    onCloseNegotiation,
    onCompare,
    onClearComparison,
    clearSelectedProperty,
    refetchDocuments: _refetchDocuments,
    onCreateAgreementSuccess,
    refresh,
    refreshing,
  } = nativeProps;

  const { t } = useLocalization();

  const isHomesView = viewType === "homes";
  const isDocumentsView = viewType === "documents";

  const documentsLoadingCombined = documentsLoadingState;
  const agreementsLoadingCombined = agreementsLoading;

  const combinedItems: CombinedItem[] = useMemo(() => {
    const items: CombinedItem[] = [];

    (filteredDocuments as DocumentData[]).forEach((doc) => {
      items.push({ type: "document", data: doc });
    });

    (agreements as Agreement[]).forEach((agreement) => {
      items.push({ type: "agreement", data: agreement });
    });

    const toMs = (v: number | string | null | undefined) =>
      typeof v === "number" ? v : v ? dateParseISO(v).valueOf() : 0;

    items.sort((a, b) => {
      const dateA =
        a.type === "document"
          ? toMs(a.data.created_at ?? a.data.updated_at)
          : toMs(a.data.created_at);
      const dateB =
        b.type === "document"
          ? toMs(b.data.created_at ?? b.data.updated_at)
          : toMs(b.data.created_at);
      return dateB - dateA;
    });

    return items;
  }, [filteredDocuments, agreements]);

  const handleRefresh = useCallback(() => {
    if (!refresh) return;
    void refresh();
  }, [refresh]);

  const handleOpenSavedOnWeb = useCallback(() => {
    const base = getEnv().isDevelopment ? "http://localhost:5173" : "https://usesilverkey.com";
    void Linking.openURL(`${base}/saved`);
  }, []);

  const homesCount = filteredHomes.length;
  const documentsCount = (filteredDocuments as DocumentData[]).length;

  const isRefreshing = Boolean(refresh && refreshing);

  const renderHomeCard = useCallback(
    (home: SavedHome) => {
      const isSelected = selectedHomesForComparison.has(home.home_id);
      return (
        <Box
          key={home.home_id}
          className="mb-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
        >
          <Text className="text-sm font-medium text-gray-500">
            {home.address ??
              home.description ??
              t("saved.unknown_address", { defaultValue: "Address unknown" })}
          </Text>
          <Text className="mt-1 text-base font-semibold text-gray-900">
            {formatPrice(home.price as string | number | null | undefined)}
          </Text>
          <Text className="mt-1 text-xs text-gray-600">
            {[
              home.bedrooms != null ? `${home.bedrooms} bed` : null,
              home.bathrooms != null ? `${home.bathrooms} bath` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
          {isSelected && (
            <Text className="mt-1 text-xs font-semibold text-emerald-700">
              {t("saved.selected_for_comparison", { defaultValue: "Selected for comparison" })}
            </Text>
          )}

          <Box className="mt-3 flex flex-row gap-2">
            <Button
              variant={isSelected ? "secondary" : "outline"}
              size="sm"
              onPress={() => onToggleHomeSelection(home.home_id)}
              className="flex-1"
            >
              <Text className="text-sm font-medium">
                {isSelected
                  ? t("saved.remove_from_compare", { defaultValue: "Remove from compare" })
                  : t("saved.add_to_compare", { defaultValue: "Add to compare" })}
              </Text>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => onUnlockHome(home)}
              className="flex-1"
            >
              <Text className="text-sm font-medium">
                {t("saved.unlock_home", { defaultValue: "Unlock" })}
              </Text>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onPress={() => onOpenNegotiation(home)}
              className="flex-1"
            >
              <Text className="text-sm font-medium">
                {t("saved.negotiate", { defaultValue: "Negotiate" })}
              </Text>
            </Button>
          </Box>
        </Box>
      );
    },
    [onOpenNegotiation, onToggleHomeSelection, onUnlockHome, selectedHomesForComparison, t]
  );

  const renderDocumentOrAgreement = useCallback(
    (item: CombinedItem) => {
      if (item.type === "document") {
        const doc = item.data;
        return (
          <Box
            key={`doc-${doc.id}`}
            className="mb-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
          >
            <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>
              {doc.address || doc.filename}
            </Text>
            <Text className="mt-1 text-xs text-gray-600">
              {formatDate(doc.created_at)} · {doc.document_type ?? "Document"}
            </Text>
            <Box className="mt-3 flex flex-row flex-wrap gap-2">
              {onViewDocument && (
                <Button
                  variant="primary"
                  size="sm"
                  onPress={() => onViewDocument(doc.id, doc.filename)}
                  className="min-w-[30%] flex-1"
                >
                  <Text className="text-sm font-medium">
                    {t("saved.view_document", { defaultValue: "View" })}
                  </Text>
                </Button>
              )}
              {onDownloadDocument && (
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => onDownloadDocument(doc.id, doc.filename)}
                  className="min-w-[30%] flex-1"
                >
                  <Text className="text-sm font-medium">
                    {t("saved.download_document", { defaultValue: "Download" })}
                  </Text>
                </Button>
              )}
              {onShareDocument && (
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => onShareDocument(doc.id, doc.filename)}
                  className="min-w-[30%] flex-1"
                >
                  <Text className="text-sm font-medium">
                    {t("saved.share_document", { defaultValue: "Share" })}
                  </Text>
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onPress={() => onDocumentDelete(doc.id)}
                className="min-w-[30%] flex-1"
              >
                <Text className="text-sm font-medium text-red-700">
                  {t("saved.delete_document", { defaultValue: "Delete" })}
                </Text>
              </Button>
            </Box>
          </Box>
        );
      }

      const agreement = item.data;
      return (
        <Box
          key={`agreement-${agreement.id}`}
          className="mb-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
        >
          <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>
            {agreement.title}
          </Text>
          {agreement.property_address && (
            <Text className="mt-1 text-xs text-gray-600" numberOfLines={1}>
              {agreement.property_address}
            </Text>
          )}
          <Text className="mt-1 text-xs font-medium text-gray-700">
            {t("saved.agreement_status", {
              defaultValue: "Status: {{status}}",
              status: agreement.status,
            })}
          </Text>
          <Box className="mt-3 flex flex-row flex-wrap gap-2">
            <Button
              variant="primary"
              size="sm"
              onPress={() => onAgreementClick(agreement.id)}
              className="min-w-[30%] flex-1"
            >
              <Text className="text-sm font-medium">
                {t("saved.view_agreement", { defaultValue: "Details" })}
              </Text>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => onAgreementSend(agreement.id)}
              className="min-w-[30%] flex-1"
            >
              <Text className="text-sm font-medium">
                {t("saved.send_agreement", { defaultValue: "Send" })}
              </Text>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => onAgreementVoid(agreement.id)}
              className="min-w-[30%] flex-1"
            >
              <Text className="text-sm font-medium text-red-700">
                {t("saved.void_agreement", { defaultValue: "Void" })}
              </Text>
            </Button>
          </Box>
        </Box>
      );
    },
    [
      onAgreementClick,
      onAgreementSend,
      onAgreementVoid,
      onDocumentDelete,
      onDownloadDocument,
      onShareDocument,
      onViewDocument,
      t,
    ]
  );

  const headerRightText =
    viewType === "homes"
      ? t("saved.homes_count", {
          defaultValue: "{{count}} saved",
          count: homesCount,
        })
      : t("saved.documents_count", {
          defaultValue: "{{count}} documents",
          count: documentsCount,
        });

  const showEmptyHomes =
    isHomesView && !loading && filteredHomes.length === 0 && homes.length === 0;
  const showEmptyDocuments =
    isDocumentsView &&
    !documentsLoadingCombined &&
    !agreementsLoadingCombined &&
    combinedItems.length === 0;

  return (
    <>
      <PdfModal
        currentPdf={currentPdf}
        currentReportAddress={currentDocumentName}
        reportId={currentDocumentId}
        onClose={closePdfModal}
      />

      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={
          refresh ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          ) : undefined
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {/* Header */}
        <Box className="mb-4">
          <Text className="text-xl font-semibold text-gray-900">
            {t("saved.title_mobile", { defaultValue: "Saved" })}
          </Text>
          <Text className="mt-1 text-sm text-gray-600">
            {t("saved.subtitle_mobile", {
              defaultValue:
                "Review your saved homes and documents, manage DocuSign agreements, and compare options.",
            })}
          </Text>
        </Box>

        {/* View toggle + search */}
        <Box className="mb-4 rounded-lg border border-gray-200 bg-white p-3">
          <Box className="mb-3 flex flex-row rounded-full bg-gray-100 p-1">
            <Button
              variant={isHomesView ? "primary" : "secondary"}
              size="sm"
              onPress={() => setViewType("homes")}
              className={`flex-1 rounded-full ${isHomesView ? "" : "bg-transparent"}`}
            >
              <Text className="text-sm font-medium">
                {t("saved.tab_homes", { defaultValue: "Homes" })}
              </Text>
            </Button>
            <Button
              variant={isDocumentsView ? "primary" : "secondary"}
              size="sm"
              onPress={() => setViewType("documents")}
              className={`flex-1 rounded-full ${isDocumentsView ? "" : "bg-transparent"}`}
            >
              <Text className="text-sm font-medium">
                {t("saved.tab_documents", { defaultValue: "Documents" })}
              </Text>
            </Button>
          </Box>

          <Box className="mb-2">
            <PrimitiveInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder={
                viewType === "homes"
                  ? t("saved.search_homes_placeholder", {
                      defaultValue: "Search saved homes…",
                    })
                  : t("saved.search_documents_placeholder", {
                      defaultValue: "Search documents…",
                    })
              }
              className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm"
            />
          </Box>

          {/* Client selector (agents only) */}
          <Box className="mt-1 flex flex-row items-center justify-between">
            <Text className="text-xs text-gray-600" numberOfLines={1}>
              {headerRightText}
            </Text>
            {selectedClientId ? (
              <Text className="text-xs font-medium text-gray-700" numberOfLines={1}>
                {t("saved.client_selected", {
                  defaultValue: "Client selected",
                })}
              </Text>
            ) : null}
          </Box>
        </Box>

        {/* Agent-only actions for documents view */}
        {isDocumentsView && isAgent && (
          <Box className="mb-4 flex flex-row gap-2">
            <Button
              variant="primary"
              size="sm"
              onPress={() => setIsCreateAgreementModalOpen(true)}
              className="flex-1"
            >
              <Text className="text-sm font-medium">
                {t("saved.create_agreement", { defaultValue: "Create agreement" })}
              </Text>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => setIsDocumentUploadModalOpen(true)}
              className="flex-1"
            >
              <Text className="text-sm font-medium">
                {t("saved.upload_document", { defaultValue: "Upload document" })}
              </Text>
            </Button>
          </Box>
        )}

        {/* Homes view content */}
        {isHomesView && (
          <>
            {loading && filteredHomes.length === 0 ? (
              <Box className="py-8">
                <Text className="text-center text-sm text-gray-600">
                  {t("saved.loading_homes", { defaultValue: "Loading saved homes…" })}
                </Text>
              </Box>
            ) : null}

            {showEmptyHomes ? (
              <Box className="py-8">
                <Text className="text-center text-sm text-gray-600">
                  {t("saved.no_homes_yet", {
                    defaultValue: "No saved homes yet. Save homes from Search to see them here.",
                  })}
                </Text>
              </Box>
            ) : null}

            {filteredHomes.map((home) => renderHomeCard(home))}
          </>
        )}

        {/* Documents + agreements content */}
        {isDocumentsView && (
          <>
            {documentsLoadingCombined || agreementsLoadingCombined ? (
              <Box className="py-8">
                <Text className="text-center text-sm text-gray-600">
                  {t("saved.loading_documents", { defaultValue: "Loading documents…" })}
                </Text>
              </Box>
            ) : null}

            {showEmptyDocuments ? (
              <Box className="py-8">
                <Text className="text-center text-sm text-gray-600">
                  {t("saved.no_documents_yet", {
                    defaultValue:
                      "No documents or agreements yet. Upload documents or create DocuSign agreements to see them here.",
                  })}
                </Text>
              </Box>
            ) : null}

            {combinedItems.map((item) => renderDocumentOrAgreement(item))}
          </>
        )}

        {/* Compare selection bar */}
        {isHomesView && selectedHomesData.length >= 1 && (
          <Box className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
            <Text className="text-sm font-medium text-gray-900">
              {t("saved.compare_bar_title", {
                defaultValue: "Compare selected homes",
              })}
            </Text>
            <Text className="mt-1 text-xs text-gray-600">
              {t("saved.compare_bar_subtitle", {
                defaultValue: "{{count}} selected",
                count: selectedHomesData.length,
              })}
            </Text>
            <Box className="mt-3 flex flex-row gap-2">
              <Button variant="primary" size="sm" onPress={onCompare} className="flex-1">
                <Text className="text-sm font-medium">
                  {t("saved.compare_now", { defaultValue: "Compare now" })}
                </Text>
              </Button>
              <Button variant="secondary" size="sm" onPress={onClearComparison} className="flex-1">
                <Text className="text-sm font-medium">
                  {t("saved.clear_selection", { defaultValue: "Clear" })}
                </Text>
              </Button>
            </Box>
          </Box>
        )}

        {/* Subtle web link */}
        <Box className="mt-8">
          <Text className="text-center text-xs text-gray-500">
            {t("saved.web_cta_caption", {
              defaultValue: "Need desktop tools like detailed PDF viewing? Open Saved on the web.",
            })}
          </Text>
          <Button
            variant="ghost"
            size="sm"
            onPress={handleOpenSavedOnWeb}
            className="mt-2 self-center"
          >
            <Text className="text-sm font-medium text-emerald-700">
              {t("saved.open_on_web", { defaultValue: "Open Saved on web" })}
            </Text>
          </Button>
        </Box>
      </ScrollView>

      {/* Property details modal stub (mobile keeps this minimal; full details on web) */}
      {selectedProperty && (
        <BaseModal
          isOpen={true}
          onClose={clearSelectedProperty}
          title={t("saved.property_details_title", { defaultValue: "Property details" })}
        >
          <Text className="text-sm text-gray-700">
            {t("saved.property_details_body", {
              defaultValue:
                "Full property details are best viewed on the web app. For now, use the Unlock action to open a rich details view.",
            })}
          </Text>
        </BaseModal>
      )}

      {/* Compare modal */}
      <BaseModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        title={t("saved.compare_modal_title", { defaultValue: "Compare homes" })}
      >
        {selectedHomesData.length === 0 ? (
          <Text className="text-sm text-gray-600">
            {t("saved.compare_modal_empty", {
              defaultValue: "Select at least two homes to compare.",
            })}
          </Text>
        ) : (
          <>
            {selectedHomesData.map((home) => (
              <Box
                key={home.home_id}
                className="mb-3 rounded-md border border-gray-200 bg-white p-3"
              >
                <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>
                  {home.address ?? home.description ?? ""}
                </Text>
                <Text className="mt-1 text-xs text-gray-600">
                  {formatPrice(home.price as string | number | null | undefined)}
                </Text>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => onRemoveFromComparison(home.home_id)}
                  className="mt-2 self-start"
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

      {/* Negotiation modal (simplified for mobile) */}
      <BaseModal
        isOpen={isNegotiationModalOpen}
        onClose={onCloseNegotiation}
        title={t("saved.negotiate_modal_title", { defaultValue: "Negotiate" })}
      >
        {selectedHomeForNegotiation ? (
          <>
            <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>
              {selectedHomeForNegotiation.address ?? selectedHomeForNegotiation.description ?? ""}
            </Text>
            <Text className="mt-1 text-xs text-gray-600">
              {formatPrice(selectedHomeForNegotiation.price as string | number | null | undefined)}
            </Text>
            <Text className="mt-3 text-sm text-gray-700">
              {t("saved.negotiate_modal_body", {
                defaultValue:
                  "We’ll generate a negotiation strategy for this home in the web app. For now, you can start the conversation with your agent directly from messaging.",
              })}
            </Text>
          </>
        ) : (
          <Text className="text-sm text-gray-600">
            {t("saved.negotiate_modal_empty", {
              defaultValue: "Select a home to start negotiation.",
            })}
          </Text>
        )}
      </BaseModal>

      {/* Document upload modal (stubbed for now) */}
      <BaseModal
        isOpen={isDocumentUploadModalOpen}
        onClose={() => setIsDocumentUploadModalOpen(false)}
        title={t("saved.upload_document_title", { defaultValue: "Upload document" })}
      >
        <Text className="text-sm text-gray-700">
          {t("saved.upload_document_body", {
            defaultValue:
              "Mobile document uploads are coming soon. For now, you can upload documents from the web app, and they’ll appear here automatically.",
          })}
        </Text>
        <Button
          variant="primary"
          size="sm"
          onPress={() => {
            handleOpenSavedOnWeb();
            setIsDocumentUploadModalOpen(false);
          }}
          className="mt-3 self-start"
        >
          <Text className="text-sm font-medium text-white">
            {t("saved.open_on_web", { defaultValue: "Open Saved on web" })}
          </Text>
        </Button>
      </BaseModal>

      {/* Create agreement modal (stubbed for now) */}
      {isAgent && (
        <BaseModal
          isOpen={isCreateAgreementModalOpen}
          onClose={() => setIsCreateAgreementModalOpen(false)}
          title={t("saved.create_agreement_title", { defaultValue: "Create agreement" })}
        >
          <Text className="text-sm text-gray-700">
            {t("saved.create_agreement_body", {
              defaultValue:
                "Creating new DocuSign agreements is currently optimized for the web app. Use the web Saved page to create agreements; they’ll sync back here automatically.",
            })}
          </Text>
          <Button
            variant="primary"
            size="sm"
            onPress={() => {
              handleOpenSavedOnWeb();
              setIsCreateAgreementModalOpen(false);
              onCreateAgreementSuccess();
            }}
            className="mt-3 self-start"
          >
            <Text className="text-sm font-medium text-white">
              {t("saved.open_on_web", { defaultValue: "Open Saved on web" })}
            </Text>
          </Button>
        </BaseModal>
      )}

      {/* Agreement detail modal (simplified summary) */}
      {selectedAgreementId && (
        <BaseModal
          isOpen={true}
          onClose={() => setSelectedAgreementId(null)}
          title={t("saved.agreement_details_title", { defaultValue: "Agreement details" })}
        >
          {(() => {
            const agreement = (agreements as Agreement[]).find((a) => a.id === selectedAgreementId);
            if (!agreement) {
              return (
                <Text className="text-sm text-gray-600">
                  {t("saved.agreement_details_missing", {
                    defaultValue: "Unable to load agreement details.",
                  })}
                </Text>
              );
            }
            return (
              <>
                <Text className="text-sm font-semibold text-gray-900" numberOfLines={2}>
                  {agreement.title}
                </Text>
                {agreement.property_address && (
                  <Text className="mt-1 text-xs text-gray-600" numberOfLines={2}>
                    {agreement.property_address}
                  </Text>
                )}
                <Text className="mt-2 text-xs text-gray-700">
                  {t("saved.agreement_status", {
                    defaultValue: "Status: {{status}}",
                    status: agreement.status,
                  })}
                </Text>
                <Text className="mt-2 text-xs text-gray-700">
                  {t("saved.agreement_participants", {
                    defaultValue: "Participants: {{count}}",
                    count: agreement.participants?.length ?? 0,
                  })}
                </Text>
              </>
            );
          })()}
        </BaseModal>
      )}
    </>
  );
}
