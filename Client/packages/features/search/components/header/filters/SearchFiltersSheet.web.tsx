import React from "react";

import { useLocalization } from "packages/contexts";
import type { PatchBuyerPreferenceExtensions } from "packages/features/profile";
import type { OnboardingData } from "packages/features/profile";
import { SearchDisplayPanelWeb } from "packages/features/search/components/header/display/SearchDisplayPanel.web";
import { Box } from "packages/ui/components/structure/primitives";
import { Transition } from "packages/ui/components/system/adapters/headless";
import { TOUR_TARGETS_MOBILE } from "packages/utils/transaction/tour/tourTargets";

import { AccessibleDialog, CloseButton, Title } from "@/components/ui";
import SearchPreferencesContent from "@/features/search/components/filters/SearchPreferencesContent.web";

export type SearchFiltersSheetProps = {
  open: boolean;
  onClose: () => void;
  formData: Partial<OnboardingData>;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
  scriptsReady: boolean;
  selectedClientId?: string | null;
  onClientChange?: (clientId: string | null) => void;
  patchBuyerPreferenceExtensions: PatchBuyerPreferenceExtensions;
  onAgentSyncPreferencesFetched?: (onboarding: Partial<OnboardingData>) => void;
  onClientChange?: (clientId: string | null) => void;
  replaceFormData?: (next: Partial<OnboardingData>) => void;
  cancelPendingSave?: () => void;
  onAfterClear?: () => void | Promise<void>;
};

export default function SearchFiltersSheet({
  open,
  onClose,
  formData,
  updateFormData,
  scriptsReady,
  selectedClientId,
  patchBuyerPreferenceExtensions,
  onAgentSyncPreferencesFetched,
  onClientChange,
  replaceFormData,
  cancelPendingSave,
  onAfterClear,
}: SearchFiltersSheetProps): React.ReactElement {
  const { t } = useLocalization();

  return (
    <Transition show={open} as="div">
      <AccessibleDialog onClose={onClose} className="z-modal relative" label={t("search.filters")}>
        <Transition.Child
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Box className="bg-overlay-backdrop fixed inset-0" aria-hidden onClick={onClose} />
        </Transition.Child>
        <Box className="pointer-events-none fixed inset-0 flex items-end justify-center p-0">
          <Transition.Child
            enter="ease-out duration-200"
            enterFrom="translate-y-full"
            enterTo="translate-y-0"
            leave="ease-in duration-150"
            leaveFrom="translate-y-0"
            leaveTo="translate-y-full"
          >
            <AccessibleDialog.Panel
              className="bg-background-surface pointer-events-auto flex h-[75dvh] max-h-[75dvh] w-full flex-col rounded-t-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Box className="border-border flex shrink-0 flex-col items-center border-b pt-2">
                <Box className="bg-border mb-2 h-1 w-10 rounded-full" aria-hidden />
                <Box className="flex w-full items-center justify-between gap-2 px-4 pb-3">
                  <Box className="w-9 shrink-0" aria-hidden />
                  <Title size="sm" as="h2" className="flex-1 text-center">
                    {t("search.filters")}
                  </Title>
                  <Box className="flex w-9 shrink-0 justify-end">
                    <CloseButton onClick={onClose} size="sm" label={t("search.close_filters")} />
                  </Box>
                </Box>
              </Box>

              <Box className="scrollbar-styled min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <SearchPreferencesContent
                  formData={formData}
                  updateFormData={updateFormData}
                  patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
                  scriptsReady={scriptsReady}
                  viewingClientId={selectedClientId ?? null}
                  onAgentSyncPreferencesFetched={onAgentSyncPreferencesFetched}
                  onClientChange={onClientChange}
                  replaceFormData={replaceFormData}
                  cancelPendingSave={cancelPendingSave}
                  onAfterClear={onAfterClear}
                />
                <Box
                  id={TOUR_TARGETS_MOBILE.displayControl}
                  className="border-border mt-6 border-t pt-6"
                >
                  <Title size="sm" as="h3" className="mb-4">
                    {t("search.display")}
                  </Title>
                  <SearchDisplayPanelWeb menuPortalStack="modal" />
                </Box>
              </Box>
            </AccessibleDialog.Panel>
          </Transition.Child>
        </Box>
      </AccessibleDialog>
    </Transition>
  );
}
