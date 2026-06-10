import { useCallback, useMemo } from "react";

import type { ReactNode } from "react";

import type { ChecklistType, TaskChecklistItem } from "packages/features/checklists/api/checklists";
import { ChecklistStepSigningFooter } from "packages/features/checklists/components/shared/ChecklistStepSigningFooter";
import { signingTodosForChecklistStep } from "packages/features/checklists/hooks/data/agenda/signingTodosForChecklistStep";
import { useDocumentsDataIntegration } from "packages/features/documents";
import { useSigningTodos } from "packages/features/documents/hooks/data/agenda/useSigningTodos";
import { log } from "packages/logger";

type UseChecklistStepSigningFooterArgs = {
  checklistType: ChecklistType;
  activeItemIds: readonly number[];
  isAgent?: boolean;
};

export function useChecklistStepSigningFooter({
  checklistType,
  activeItemIds,
  isAgent = false,
}: UseChecklistStepSigningFooterArgs) {
  const signingTodos = useSigningTodos(isAgent);
  const {
    documents,
    signAgreementNow,
    agreementSigningSession,
    dismissAgreementSigning,
    onAgreementSigningComplete,
  } = useDocumentsDataIntegration();

  const handleSigningPress = useCallback(
    async (agreementId: string) => {
      const doc = documents.find((d) => d.id === agreementId && d.library_kind === "agreement");
      if (!doc) return;
      try {
        await signAgreementNow(doc);
      } catch (error) {
        log.error("ERRORS", "Checklist step DocuSign signing failed", error);
      }
    },
    [documents, signAgreementNow]
  );

  const renderSigningFooter = useCallback(
    (item: TaskChecklistItem): ReactNode => {
      if (!activeItemIds.includes(item.id)) return null;

      const stepSigningTodos = signingTodosForChecklistStep(
        signingTodos,
        documents,
        checklistType,
        item.id
      );

      return (
        <ChecklistStepSigningFooter
          item={item}
          stepSigningTodos={stepSigningTodos}
          onSigningPress={handleSigningPress}
        />
      );
    },
    [activeItemIds, signingTodos, documents, checklistType, handleSigningPress]
  );

  return useMemo(
    () => ({
      renderSigningFooter,
      agreementSigningSession,
      dismissAgreementSigning,
      onAgreementSigningComplete,
    }),
    [
      renderSigningFooter,
      agreementSigningSession,
      dismissAgreementSigning,
      onAgreementSigningComplete,
    ]
  );
}
