import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import { DEFAULT_REPORT_SECTIONS } from "./constants";
import type { OnboardingData } from "./types";

export type ReportSection = {
  key: string;
  label?: string;
  id?: string;
  priority?: number;
};

export type HandleDragEndParams = {
  event: DragEndEvent;
  getOrderedReportSections: () => ReportSection[];
  formData: OnboardingData;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
};

/**
 * Handle drag end for reordering report sections
 * Shared utility function used by both OnboardingPage and PersonalizationPage
 */
export const handleDragEnd = ({
  event,
  getOrderedReportSections,
  formData,
  updateFormData,
}: HandleDragEndParams) => {
  try {
    const { active, over } = event;

    if (!active || !over || !active.id || !over.id || active.id === over.id)
      return;

    const sections = getOrderedReportSections();
    const oldIndex = sections.findIndex((section) => section.key === active.id);
    const newIndex = sections.findIndex((section) => section.key === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const currentPriorities = formData.report_section_priorities ?? [];
    const reorderedSections = arrayMove(sections, oldIndex, newIndex);

    // Ensure we only work with valid sections from DEFAULT_REPORT_SECTIONS
    const validSectionKeys = new Set(
      DEFAULT_REPORT_SECTIONS.map((section) => section.key)
    );

    // Only include sections that were previously selected (in priorities) and are valid
    const newPriorities = reorderedSections
      .filter(
        (section) =>
          currentPriorities.includes(section.key) &&
          validSectionKeys.has(section.key)
      )
      .map((section) => section.key);

    updateFormData("report_section_priorities", newPriorities);
  } catch (error: unknown) {
    console.error("Error in handleDragEnd:", error);
  }
};
