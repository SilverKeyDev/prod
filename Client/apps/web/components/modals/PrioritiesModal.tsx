import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Check } from "lucide-react";
import type { DragEndEvent } from "@dnd-kit/core";

import BaseModal from "./BaseModal";
import OnPerDragDropPriorities from "../../features/onboardpersonalize/DragDropPriorities";
import { useUserPreferences } from "../../../../packages/hooks/data/auth/useUserData";
import { useAutoSavePreferences } from "../../../../packages/hooks/data/auth/useAutoSavePreferences";
import { DEFAULT_REPORT_SECTIONS } from "../../features/onboardpersonalize/lib/constants";
import { handleDragEnd as handleDragEndUtil } from "../../features/onboardpersonalize/lib/dragEndHandler";
import type { OnboardingData } from "../../features/onboardpersonalize/lib/types";

type PrioritiesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  propertyAddress?: string | { address: string } | null;
  onRegenerateComplete?: () => void;
};

const PrioritiesModal: React.FC<PrioritiesModalProps> = ({
  isOpen,
  onClose,
  propertyAddress: _propertyAddress,
  onRegenerateComplete: _onRegenerateComplete,
}) => {
  const { userPreferences, refreshUserPreferences } = useUserPreferences();
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});

  // Use auto-save hook
  const { saveStatus, updateFormData: updateFormDataWithAutoSave } =
    useAutoSavePreferences({
      refreshUserPreferences,
      showErrorToastOnError: true,
    });

  // Initialize form data from user preferences
  useEffect(() => {
    if (userPreferences) {
      const priorities = Array.isArray(
        userPreferences.report_section_priorities
      )
        ? userPreferences.report_section_priorities
        : typeof userPreferences.report_section_priorities === "string"
          ? (() => {
              try {
                return JSON.parse(
                  userPreferences.report_section_priorities || "[]"
                );
              } catch {
                return [];
              }
            })()
          : [];

      setFormData({
        report_section_priorities: priorities,
      });
    }
  }, [userPreferences]);

  // Get ordered report sections based on form data
  const getOrderedReportSections = useCallback(() => {
    try {
      if (!formData || !DEFAULT_REPORT_SECTIONS) {
        return [];
      }

      const priorities = formData.report_section_priorities ?? [];
      const sections = [...DEFAULT_REPORT_SECTIONS];

      // Sort sections based on priorities - included items first in priority order, excluded items at end
      const orderedSections = sections.sort((a, b) => {
        if (!a || !b || !a.key || !b.key) return 0;

        const aIncluded = priorities.includes(a.key);
        const bIncluded = priorities.includes(b.key);

        // Excluded items go to the end
        if (aIncluded !== bIncluded) {
          return aIncluded ? -1 : 1;
        }

        // For included items, use priority order
        const aPriority = priorities.indexOf(a.key);
        const bPriority = priorities.indexOf(b.key);

        // Items not in priorities should come after items in priorities
        if (aPriority === -1 && bPriority === -1) return 0;
        if (aPriority === -1) return 1; // A comes after B
        if (bPriority === -1) return -1; // B comes after A

        return aPriority - bPriority;
      });

      return orderedSections;
    } catch (error: unknown) {
      log.error(LOG_CATEGORIES.ERRORS, "Error in getOrderedReportSections", error);
      return [];
    }
  }, [formData]);

  const orderedSections = useMemo(
    () => getOrderedReportSections(),
    [getOrderedReportSections]
  );

  // Wrapper for updateFormData that works with our hook
  const updateFormData = useCallback(
    (field: string | number | symbol, value: unknown) => {
      updateFormDataWithAutoSave(formData, setFormData, field, value);
    },
    [formData, updateFormDataWithAutoSave]
  );

  // Handle drag end for reordering
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      handleDragEndUtil({
        event,
        getOrderedReportSections,
        formData,
        updateFormData,
      });
    },
    [getOrderedReportSections, formData, updateFormData]
  );

  // Handle checkbox toggle for report sections
  const handleReportSectionToggle = useCallback(
    (sectionKey: string, checked: boolean) => {
      const currentPriorities = formData.report_section_priorities ?? [];

      // Ensure we only work with valid sections from DEFAULT_REPORT_SECTIONS
      const validSectionKeys = new Set(
        DEFAULT_REPORT_SECTIONS.map((section) => section.key)
      );

      if (!validSectionKeys.has(sectionKey)) {
        log.warn(LOG_CATEGORIES.ERRORS, "Attempted to toggle invalid section", { sectionKey });
        return;
      }

      if (!checked) {
        // Remove from priorities
        const newPriorities = currentPriorities.filter(
          (key) => key !== sectionKey
        );
        updateFormData("report_section_priorities", newPriorities);
      } else {
        // Add to priorities at the end
        const newPriorities = [...currentPriorities, sectionKey];
        updateFormData("report_section_priorities", newPriorities);
      }
    },
    [formData.report_section_priorities, updateFormData]
  );

  // Auto-regeneration disabled - the /api/v1/report/generate endpoint no longer exists
  // Report generation should be done manually via the "Generate Report" button
  // The research endpoint (/api/v1/research/property) is used for fetching property data when unlocking

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Priorities"
      size="xl"
      className="max-h-[90vh]"
    >
      <div className="space-y-6">
        {/* Save Status Indicator */}
        {saveStatus !== "idle" && (
          <div className="flex items-center gap-2 text-sm">
            {saveStatus === "saving" && (
              <span className="text-gray-600">Saving...</span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-green-600">
                <Check className="h-4 w-4" />
                Saved
              </span>
            )}
          </div>
        )}

        {/* Priorities Component */}
        <OnPerDragDropPriorities
          isEditMode={true}
          isLoading={false}
          orderedSections={orderedSections}
          formData={formData}
          onDragEnd={handleDragEnd}
          onToggle={handleReportSectionToggle}
        />
      </div>
    </BaseModal>
  );
};

export default PrioritiesModal;
