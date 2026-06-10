/**
 * Embedded preferences form with autosave for checklists, search filters, and modals.
 * For full profile/settings with explicit save, use PersonalizationSettingsScreen or ProfileScreen
 * via renderProfileSectionContent + useProfilePersonalizationModel.
 */
import React from "react";

import { useLocalization } from "packages/contexts";
import HousingSection from "packages/features/profile/components/formSections/housing/HousingSection";
import LocationSection from "packages/features/profile/components/formSections/LocationSection";
import { useEmbeddedPreferencesForm } from "packages/features/profile/hooks/useEmbeddedPreferencesForm";
import type { BuyerPreferenceExtensions } from "packages/features/profile/types/sections/buyerPreferenceExtensions";
import type { OnboardingData } from "packages/features/profile/utils";
import { useResponsive } from "packages/hooks/ui";
import Box from "packages/ui/components/structure/primitives/box/Box";

import type {
  PreferencesFormActionsRef,
  PreferencesFormContentRef,
} from "./preferencesFormContentTypes";
import PreferencesSaveStatusRow from "./PreferencesSaveStatusRow";

export type {
  PreferencesFormActionsRef,
  PreferencesFormContentRef,
} from "./preferencesFormContentTypes";

type PreferencesFormContentProps = {
  /** Optional ref for parent to read current form state (e.g. on close for dirty check) */
  formContentRef?: React.MutableRefObject<PreferencesFormContentRef | null>;
  /** Optional; defaults to false. When true, showErrorToast is used for save errors */
  showErrorToastOnError?: boolean;
  /** Called once when form data is first populated (for parent to store initial snapshot) */
  onInitialSnapshot?: (formData: Partial<OnboardingData>) => void;
  /** Called after each successful auto-save (e.g. trigger search refresh) */
  onPreferencesSaved?: () => void | Promise<void>;
  /** When provided, renders this instead of the default HousingSection + LocationSection */
  renderContent?: (props: {
    formData: Partial<OnboardingData>;
    updateFormData: (field: keyof OnboardingData, value: unknown) => void;
    saveStatus: "idle" | "saving" | "saved";
    patchBuyerPreferenceExtensions: (
      fn: (prev: BuyerPreferenceExtensions | undefined) => BuyerPreferenceExtensions
    ) => void;
    scriptsReady: boolean;
    /** Persist current form to the server and await refresh (e.g. before preference-based search). */
    flushPreferencesSave: () => Promise<void>;
    /** Cancel debounced autosave without persisting (e.g. before clear preferences). */
    cancelPendingSave: () => void;
  }) => React.ReactNode;
  /**
   * When set, loads that user's preferences for display in the form (e.g. agent viewing a client in Search).
   * Saves always go to the authenticated user (`POST /preferences`). Client selection is for independent
   * search context only — we never POST preference edits to the client's account.
   */
  preferencesSubjectUserId?: string | null;
  /** When set, parent can call `replaceFormData` to apply a full preferences snapshot (e.g. agent sync preview). */
  preferencesFormActionsRef?: React.MutableRefObject<PreferencesFormActionsRef | null>;
  /**
   * When > 0, debounces autosave (reduces saving/saved flicker in embedded contexts like checklists).
   * Default 0 matches settings/profile full-page behavior.
   */
  autoSaveDebounceMs?: number;
};

export default function PreferencesFormContent({
  formContentRef,
  showErrorToastOnError = false,
  onInitialSnapshot,
  onPreferencesSaved,
  renderContent,
  preferencesSubjectUserId,
  preferencesFormActionsRef,
  autoSaveDebounceMs = 0,
}: PreferencesFormContentProps): React.ReactElement {
  const { t } = useLocalization();
  const { isMdUp } = useResponsive();
  const isDesktop = isMdUp;

  const {
    formData,
    saveStatus,
    scriptsReady,
    updateFormData,
    patchBuyerPreferenceExtensions,
    flushPreferencesSave,
    cancelPendingSave,
  } = useEmbeddedPreferencesForm({
    formContentRef,
    showErrorToastOnError,
    onInitialSnapshot,
    onPreferencesSaved,
    preferencesSubjectUserId,
    preferencesFormActionsRef,
    autoSaveDebounceMs,
  });

  if (renderContent) {
    return (
      <Box>
        {renderContent({
          formData,
          updateFormData,
          saveStatus,
          patchBuyerPreferenceExtensions,
          scriptsReady,
          flushPreferencesSave,
          cancelPendingSave,
        })}
      </Box>
    );
  }

  return (
    <Box className="space-y-8">
      <HousingSection
        formData={formData as OnboardingData}
        isEditMode={true}
        updateFormData={updateFormData}
        isDesktop={isDesktop}
        patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
      />

      <LocationSection
        formData={formData as OnboardingData}
        isEditMode={true}
        updateField={updateFormData}
        scriptsReady={scriptsReady}
        patchBuyerPreferenceExtensions={patchBuyerPreferenceExtensions}
      />

      <PreferencesSaveStatusRow
        saveStatus={saveStatus}
        savingLabel={t("common.saving")}
        savedLabel={t("common.saved")}
        className="mt-4 flex items-center gap-2 text-sm"
      />
    </Box>
  );
}
