import { DEFAULT_REPORT_SECTIONS } from "packages/utils/domain/defaultReportSections";
import { stripSectionRatingField } from "packages/utils/propertyDetails";

export type PropertyDemographicsViewModel = {
  ageDistribution?: Record<string, string>;
  raceDistribution?: Record<string, string>;
  incomeDistribution?: Record<string, string>;
  educationDistribution?: Record<string, string>;
  hasAgeDistribution: boolean;
  hasRaceDistribution: boolean;
  hasIncomeDistribution: boolean;
  hasEducationDistribution: boolean;
  demographicsSectionRating: number | null;
  sectionLabel: string;
};

/**
 * Shared parsing for web + native PropertyDemographics (removes duplicated blocks).
 */
export function buildPropertyDemographicsViewModel(
  analysisContent: unknown
): PropertyDemographicsViewModel | null {
  const neighborhoodOverview = analysisContent as Record<string, unknown> | undefined;

  const ageDistribution = neighborhoodOverview?.age_distribution as
    | Record<string, string>
    | undefined;
  const raceDistribution = neighborhoodOverview?.race_distribution as
    | Record<string, string>
    | undefined;
  const incomeDistribution = neighborhoodOverview?.income_distribution as
    | Record<string, string>
    | undefined;
  const educationDistribution = neighborhoodOverview?.education_distribution as
    | Record<string, string>
    | undefined;

  const hasAgeDistribution = Boolean(ageDistribution && Object.keys(ageDistribution).length > 0);
  const hasRaceDistribution = Boolean(raceDistribution && Object.keys(raceDistribution).length > 0);
  const hasIncomeDistribution = Boolean(
    incomeDistribution && Object.keys(incomeDistribution).length > 0
  );
  const hasEducationDistribution = Boolean(
    educationDistribution && Object.keys(educationDistribution).length > 0
  );

  const demographicsContent = neighborhoodOverview ? { ...neighborhoodOverview } : undefined;
  if (demographicsContent) {
    delete demographicsContent.age_distribution;
    delete demographicsContent.race_distribution;
    delete demographicsContent.income_distribution;
    delete demographicsContent.education_distribution;
  }
  const { rating: demographicsSectionRating } = stripSectionRatingField(
    demographicsContent ?? null
  );

  if (
    !hasAgeDistribution &&
    !hasRaceDistribution &&
    !hasIncomeDistribution &&
    !hasEducationDistribution &&
    demographicsSectionRating === null
  ) {
    return null;
  }

  const sectionLabel =
    DEFAULT_REPORT_SECTIONS.find((s: { key: string; label: string }) => s.key === "demographics")
      ?.label ?? "Demographics";

  return {
    ageDistribution,
    raceDistribution,
    incomeDistribution,
    educationDistribution,
    hasAgeDistribution,
    hasRaceDistribution,
    hasIncomeDistribution,
    hasEducationDistribution,
    demographicsSectionRating,
    sectionLabel,
  };
}
