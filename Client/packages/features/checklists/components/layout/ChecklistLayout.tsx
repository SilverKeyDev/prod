import React from "react";

import { ChecklistUpdatePendingProvider } from "packages/features/checklists/components/roadmap/ChecklistUpdatePendingProvider";
import { ChecklistSigningModals } from "packages/features/checklists/components/shared/ChecklistSigningModals";
import { useChecklistLayoutController } from "packages/features/checklists/hooks/useChecklistLayoutController";
import type { CloseLayoutProps } from "packages/features/checklists/types/checklistCloseLayout";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText } from "@/components/ui";

import { ChecklistLayoutDisclosureSections } from "./ChecklistLayoutDisclosureSections";

export default function CloseLayout({
  title,
  subtitle,
  sectionTitle: sectionTitleText,
  checklistType: checklistTypeProp,
  apiEndpoint,
  children,
  showLoadingScreen = false,
  containerClassName = "py-0",
  showMinLoadingText = false,
  setClosePageHeaderData,
  transactionId: transactionIdProp,
}: CloseLayoutProps) {
  const controller = useChecklistLayoutController({
    checklistType: checklistTypeProp,
    apiEndpoint,
    transactionId: transactionIdProp,
    setClosePageHeaderData,
    title,
    subtitle,
  });

  const {
    checkedIds,
    activeItemIds,
    loading,
    isChecklistUpdatePending,
    displaySortedItems,
    checkedById,
    toggle,
    toggleItem,
    toggleExpand,
    isExpanded,
    getItemToggleEligibility,
    roadmapTab,
    disclosure,
    setTypeDisclosure,
    segments,
    futureHidden,
    useProgressive,
    effectiveTransactionId,
    renderSigningFooter,
    agreementSigningSession,
    dismissAgreementSigning,
    onAgreementSigningComplete,
  } = controller;

  if (showLoadingScreen && loading && checkedIds.length === 0) {
    return (
      <Box className="bg-background-base text-text-primary flex flex-row items-center justify-center">
        <BodyText as="p" size="sm">
          Loading checklist…
        </BodyText>
      </Box>
    );
  }

  return (
    <ChecklistUpdatePendingProvider value={isChecklistUpdatePending}>
      <Box className="bg-background-base">
        {children ? <Box className="mb-responsive-sm">{children}</Box> : null}

        <Box className={containerClassName}>
          {loading && showMinLoadingText ? (
            <BodyText size="sm" className="mb-responsive-sm">
              Loading checklist…
            </BodyText>
          ) : null}

          <ChecklistLayoutDisclosureSections
            sectionTitleText={sectionTitleText}
            useProgressive={useProgressive}
            segments={segments}
            displaySortedItems={displaySortedItems}
            disclosure={disclosure}
            setTypeDisclosure={setTypeDisclosure}
            futureHidden={futureHidden}
            checkedById={checkedById}
            activeItemIds={[...activeItemIds]}
            roadmapTab={roadmapTab}
            getItemToggleEligibility={getItemToggleEligibility}
            onToggleItem={toggle}
            commitToggleItem={toggleItem}
            toggleExpand={toggleExpand}
            isExpanded={isExpanded}
            effectiveTransactionId={effectiveTransactionId}
            renderItemFooter={renderSigningFooter}
          />
        </Box>
      </Box>
      <ChecklistSigningModals
        agreementSigningSession={agreementSigningSession}
        dismissAgreementSigning={dismissAgreementSigning}
        onAgreementSigningComplete={onAgreementSigningComplete}
      />
    </ChecklistUpdatePendingProvider>
  );
}
