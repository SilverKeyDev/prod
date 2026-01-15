import { DEFAULT_REPORT_SECTIONS } from "../../../../features/onboardpersonalize/lib/constants";
import type { OnboardingData } from "../../../../features/onboardpersonalize/lib/constants";
import { log, LOG_CATEGORIES } from "../../../../../../logger";

export function getOrderedReportSections(
  formData: OnboardingData
): typeof DEFAULT_REPORT_SECTIONS {
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
}
