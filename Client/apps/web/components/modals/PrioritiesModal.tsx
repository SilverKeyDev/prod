import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Check } from "lucide-react";
import type { DragEndEvent } from "@dnd-kit/core";

import BaseModal from "./BaseModal";
import OnPerDragDropPriorities from "../../features/onboardpersonalize/DragDropPriorities";
import { reportApi } from "../../../../packages/config/api/report";
import { useUserPreferences } from "../../../../packages/hooks/data/useUserData";
import { useAutoSavePreferences } from "../../../../packages/hooks/data/useAutoSavePreferences";
import { DEFAULT_REPORT_SECTIONS } from "../../features/onboardpersonalize/lib/constants";
import { handleDragEnd as handleDragEndUtil } from "../../features/onboardpersonalize/lib/dragEndHandler";
import type { OnboardingData } from "../../features/onboardpersonalize/lib/types";
import { formatAddress } from "./PropertyDetailsModal/utils";
import { showErrorToast } from "../../../../packages/hooks/ui/useToast";

type PrioritiesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  propertyAddress?: string | { address: string } | null;
  onRegenerateComplete?: () => void;
};

const PrioritiesModal: React.FC<PrioritiesModalProps> = ({
  isOpen,
  onClose,
  propertyAddress,
  onRegenerateComplete,
}) => {
  const { userPreferences, refreshUserPreferences } = useUserPreferences();
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});
  const [isRegenerating, setIsRegenerating] = useState(false);
  const regenerateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  const previousPrioritiesRef = useRef<string[]>([]);

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
      previousPrioritiesRef.current = priorities;
      // Mark initial load as complete after first render
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }
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
      console.error("Error in getOrderedReportSections:", error);
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
        console.warn(`Attempted to toggle invalid section: ${sectionKey}`);
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

  // Auto-regenerate report when priorities change
  const autoRegenerate = useCallback(async () => {
    if (!propertyAddress || isInitialLoadRef.current) {
      return;
    }

    // Clear existing timeout
    if (regenerateTimeoutRef.current) {
      clearTimeout(regenerateTimeoutRef.current);
    }

    // Debounce regeneration by 2 seconds after last change
    regenerateTimeoutRef.current = setTimeout(async () => {
      setIsRegenerating(true);
      try {
        // Handle { address: string } format
        const addressToFormat =
          typeof propertyAddress === "object" &&
          propertyAddress !== null &&
          "address" in propertyAddress
            ? propertyAddress.address
            : propertyAddress;
        const address = formatAddress(addressToFormat);
        if (!address) {
          throw new Error("Invalid property address");
        }

        const response = await reportApi.generate({
          address,
        });

        if (!response.success) {
          throw new Error(response.error ?? "Failed to generate report");
        }

        // Call callback if provided
        if (onRegenerateComplete) {
          onRegenerateComplete();
        }

        // Close modal after successful regeneration start
        onClose();
      } catch (error) {
        console.error("Failed to regenerate report:", error);
        showErrorToast(
          error instanceof Error
            ? error.message
            : "Failed to regenerate report. Please try again."
        );
      } finally {
        setIsRegenerating(false);
      }
    }, 2000);
  }, [propertyAddress, onRegenerateComplete, onClose]);

  // Watch for changes in priorities and trigger auto-regeneration
  useEffect(() => {
    const currentPriorities = formData.report_section_priorities ?? [];
    const previousPriorities = previousPrioritiesRef.current;

    // Check if priorities actually changed (not just initial load)
    if (
      !isInitialLoadRef.current &&
      JSON.stringify(currentPriorities) !== JSON.stringify(previousPriorities)
    ) {
      previousPrioritiesRef.current = currentPriorities;
      void autoRegenerate();
    }
  }, [formData.report_section_priorities, autoRegenerate]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (regenerateTimeoutRef.current) {
        clearTimeout(regenerateTimeoutRef.current);
      }
    };
  }, []);

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
          isLoading={isRegenerating}
          orderedSections={orderedSections}
          formData={formData}
          onDragEnd={handleDragEnd}
          onToggle={handleReportSectionToggle}
        />

        {/* Regeneration Status */}
        {isRegenerating && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 border-t border-gray-200 pt-4">
            <span>Regenerating report...</span>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default PrioritiesModal;
