import React from "react";

import { useLocalization } from "packages/contexts";
import { Transition } from "packages/ui/components/adapters/headless";

import { AccessibleDialog, Button, CloseButton, Title } from "@/components/ui";
import type { OnboardingData } from "@/features/profile/utils";
import SearchFiltersPanel from "@/features/search/components/filters/SearchFiltersPanel.web";

export type SearchFiltersSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Called when user taps Apply (run search and close) */
  onApply: () => void;
  formData: Partial<OnboardingData>;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
  saveStatus?: "idle" | "saving" | "saved";
};

export default function SearchFiltersSheet({
  open,
  onClose,
  onApply,
  formData,
  updateFormData,
  saveStatus = "idle",
}: SearchFiltersSheetProps): React.ReactElement {
  const { t } = useLocalization();
  const handleApply = () => {
    onApply();
    onClose();
  };

  return (
    <Transition show={open} as="div">
      <AccessibleDialog onClose={onClose} className="relative z-50" label={t("search.filters")}>
        <Transition.Child
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="bg-overlay-backdrop fixed inset-0" aria-hidden onClick={onClose} />
        </Transition.Child>
        <div className="pointer-events-none fixed inset-0 flex items-end justify-center p-0">
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
              <div className="border-border flex shrink-0 flex-col items-center border-b pt-2">
                <div className="bg-border mb-2 h-1 w-10 rounded-full" aria-hidden />
                <div className="flex w-full items-center justify-between gap-2 px-4 pb-3">
                  <div className="w-9 shrink-0" aria-hidden />
                  <Title size="sm" as="h2" className="flex-1 text-center">
                    {t("search.filters")}
                  </Title>
                  <div className="flex w-9 shrink-0 justify-end">
                    <CloseButton onClick={onClose} size="sm" label={t("search.close_filters")} />
                  </div>
                </div>
              </div>

              <div className="scrollbar-styled min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-16">
                <SearchFiltersPanel
                  formData={formData}
                  updateFormData={updateFormData}
                  saveStatus={saveStatus}
                />
              </div>

              <div className="border-border flex shrink-0 items-center gap-2 border-t px-4 py-3">
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={handleApply}
                  className="touch-friendly"
                >
                  {t("search.apply")}
                </Button>
              </div>
            </AccessibleDialog.Panel>
          </Transition.Child>
        </div>
      </AccessibleDialog>
    </Transition>
  );
}
