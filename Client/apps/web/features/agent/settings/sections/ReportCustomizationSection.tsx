import React from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import Card from "../../../../components/layout/Card";
import { Loading } from "../../../../components/ui";
import OnPerDragDropPriorities from "../../../../features/onboardpersonalize/DragDropPriorities";
import {
  DEFAULT_REPORT_SECTIONS,
  type OnboardingData,
} from "../../../../features/onboardpersonalize/lib/constants";
import { handleDragEnd as handleDragEndUtil } from "../../../../features/onboardpersonalize/lib/dragEndHandler";
import { log, LOG_CATEGORIES } from "../../../../../../logger";

type ReportCustomizationSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  isLoading: boolean;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
  getOrderedReportSections: () => typeof DEFAULT_REPORT_SECTIONS;
};

export default function ReportCustomizationSection({
  formData,
  isEditMode,
  isLoading,
  updateFormData,
  getOrderedReportSections,
}: ReportCustomizationSectionProps) {
  // Handle drag end for reordering
  const handleDragEnd = (event: DragEndEvent) => {
    handleDragEndUtil({
      event,
      getOrderedReportSections,
      formData,
      updateFormData,
    });
  };

  // Handle checkbox toggle for report sections
  const handleReportSectionToggle = (sectionKey: string, checked: boolean) => {
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
      // Remove from priorities when unchecked
      const newPriorities = currentPriorities.filter(
        (key) => key !== sectionKey && validSectionKeys.has(key)
      );
      updateFormData("report_section_priorities", newPriorities);
    } else {
      // Add to last priority (bottom of list) when checked (if not already there)
      if (!currentPriorities.includes(sectionKey)) {
        // Filter out any invalid sections and add the new one
        const filteredPriorities = currentPriorities.filter((key) =>
          validSectionKeys.has(key)
        );
        updateFormData("report_section_priorities", [
          ...filteredPriorities,
          sectionKey,
        ]);
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="space-y-6">
        <h2 className="mb-6 font-serif text-xl text-black sm:text-2xl">
          Priorities
        </h2>
        <Loading message="Loading report customization options..." />
      </Card>
    );
  }

  const orderedSections = getOrderedReportSections();

  if (!orderedSections || orderedSections.length === 0) {
    return (
      <Card className="space-y-6">
        <h2 className="mb-6 font-serif text-xl text-black sm:text-2xl">
          Priorities
        </h2>
        <Loading message="Loading report customization options..." />
      </Card>
    );
  }

  return (
    <Card className="space-y-6">
      <OnPerDragDropPriorities
        isEditMode={isEditMode}
        isLoading={false}
        orderedSections={orderedSections}
        formData={formData}
        onDragEnd={handleDragEnd}
        onToggle={handleReportSectionToggle}
      />
    </Card>
  );
}
