import React, { useMemo, useState } from "react";

import { useUserStore } from "../../../../../packages/store/user.slice";
import { DEFAULT_REPORT_SECTIONS } from "../../../features/onboardpersonalize/lib/constants";
import type { PropertyWithAnalysis } from "../../../../../packages/schemas/property";

import { PropertyAnalysis } from "./PropertyAnalysis";
import { PropertyCommute } from "./sections/PropertyCommute";
import { PropertyFeatures } from "./sections/PropertyFeatures";
import { PropertyHeader } from "./PropertyHeader";
import { PropertyImageGallery } from "./PropertyImageGallery";
import { PropertyInfo } from "./sections/PropertyInfo";
import { PropertyDetails } from "./sections/PropertyDetails";
import { ProsAndCons } from "./sections/ProsAndCons";
import { PropertySchools } from "./sections/PropertySchools";
import { PropertyNeighborhood } from "./sections/PropertyNeighborhood";
import PrioritiesModal from "../PrioritiesModal";
import { PropertyDetailsLoadingIndicator } from "./PropertyDetailsLoadingIndicator";
import type { PropertyDetailsModalProps } from "./types";

type SectionComponent = {
  key: string;
  component: React.ReactNode;
  priority: number;
};

const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
  property,
  onClose,
  onGenerateReport,
  isLoading = false,
}) => {
  // All hooks must be called before any conditional returns
  // This ensures consistent hook order across renders
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPrioritiesModalOpen, setIsPrioritiesModalOpen] = useState(false);
  const userPreferences = useUserStore((state) => state.userPreferences);

  // Get user priorities
  const userPriorities = useMemo(() => {
    const priorities =
      (userPreferences?.report_section_priorities as string[] | undefined) ||
      [];
    return priorities;
  }, [userPreferences]);

  // Create a priority map for quick lookup
  const priorityMap = useMemo(() => {
    const map = new Map<string, number>();
    userPriorities.forEach((key, index) => {
      map.set(key, index);
    });
    // Add default priorities for sections not in user priorities
    DEFAULT_REPORT_SECTIONS.forEach((section, index) => {
      if (!map.has(section.key)) {
        map.set(section.key, 1000 + index); // High priority number means lower priority
      }
    });
    return map;
  }, [userPriorities]);

  // Get property analysis to check which dynamic sections exist
  // Safely handle null property case
  const propertyAnalysis = property
    ? (property as PropertyWithAnalysis).property_analysis
    : undefined;

  // Check which sections have data
  const hasCommute = useMemo(() => {
    if (!property) return false;
    return !!(property as unknown as { commute_data?: unknown }).commute_data;
  }, [property]);

  const hasSchools = useMemo(() => {
    if (!property) return false;
    const schools = (property as unknown as { schools?: unknown }).schools;
    return (
      Array.isArray(schools) &&
      ((property as unknown as { schools?: unknown[] }).schools?.length ?? 0) >
        0
    );
  }, [property]);

  const hasFeatures = useMemo(() => {
    if (!property) return false;
    return (
      !!(property as unknown as { features?: unknown }).features ||
      !!(property as unknown as { image_features?: unknown }).image_features
    );
  }, [property]);

  const hasAnalysis = useMemo(() => !!propertyAnalysis, [propertyAnalysis]);

  // Check if analysis has commute/family_friendly sections
  const commuteAnalysis = useMemo(() => {
    if (!propertyAnalysis) return undefined;
    return (propertyAnalysis as Record<string, unknown>).commute;
  }, [propertyAnalysis]);

  const familyFriendlyAnalysis = useMemo(() => {
    if (!propertyAnalysis) return undefined;
    return (propertyAnalysis as Record<string, unknown>).family_friendly;
  }, [propertyAnalysis]);

  const neighborhoodAnalysis = useMemo(() => {
    if (!propertyAnalysis) return undefined;
    return (propertyAnalysis as Record<string, unknown>).neighborhood_overview;
  }, [propertyAnalysis]);

  // Check if neighborhood section has data
  const hasNeighborhood = useMemo(() => {
    if (!propertyAnalysis) return false;
    const neighborhood = (propertyAnalysis as Record<string, unknown>)
      .neighborhood_overview;
    return !!neighborhood;
  }, [propertyAnalysis]);

  // Build ordered sections list (excluding fixed sections)
  const orderedSections = useMemo(() => {
    // Early return if property is null - hooks have already been called
    if (!property) return [];

    const sections: SectionComponent[] = [];

    // Add commute section - combine with analysis if both exist
    if (hasCommute || commuteAnalysis) {
      sections.push({
        key: "commute",
        component: (
          <PropertyCommute
            key="commute"
            property={property}
            analysisContent={commuteAnalysis}
          />
        ),
        priority: priorityMap.get("commute") ?? 1000,
      });
    }

    // Add schools section (part of family_friendly) - combine with analysis if both exist
    if (hasSchools || familyFriendlyAnalysis) {
      sections.push({
        key: "family_friendly",
        component: (
          <PropertySchools
            key="schools"
            property={property}
            analysisContent={familyFriendlyAnalysis}
          />
        ),
        priority: priorityMap.get("family_friendly") ?? 1000,
      });
    }

    // Add neighborhood section - combine with analysis if both exist
    if (hasNeighborhood || neighborhoodAnalysis) {
      sections.push({
        key: "neighborhood",
        component: (
          <PropertyNeighborhood
            key="neighborhood"
            property={property}
            analysisContent={neighborhoodAnalysis}
          />
        ),
        priority: priorityMap.get("neighborhood") ?? 1000,
      });
    }

    // Add analysis sections ( Crime, Gentrification, Dynamic sections)
    // Exclude commute, family_friendly, and neighborhood if they're being rendered in dedicated components
    if (hasAnalysis) {
      const excludeSections: string[] = [];
      if (hasCommute || commuteAnalysis) {
        excludeSections.push("commute");
      }
      if (hasSchools || familyFriendlyAnalysis) {
        excludeSections.push("family_friendly");
      }
      if (hasNeighborhood || neighborhoodAnalysis) {
        excludeSections.push("neighborhood_overview");
        excludeSections.push("age_distribution");
      }

      sections.push({
        key: "analysis",
        component: (
          <PropertyAnalysis
            key="analysis"
            property={property}
            excludeSections={excludeSections}
            userPriorities={userPriorities}
          />
        ),
        priority: priorityMap.get("analysis") ?? 2000,
      });
    }

    // Sort by priority
    sections.sort((a, b) => a.priority - b.priority);

    return sections;
  }, [
    property,
    priorityMap,
    hasCommute,
    hasSchools,
    hasNeighborhood,
    hasAnalysis,
    commuteAnalysis,
    familyFriendlyAnalysis,
    neighborhoodAnalysis,
  ]);

  // Return null AFTER all hooks have been called
  // This ensures consistent hook order and prevents React reconciliation issues
  if (!property) return null;

  // TypeScript now knows property is not null after the check above
  // But we need to assert it for child components that expect non-null
  // Using NonNullable to ensure type safety
  const nonNullProperty = property as NonNullable<typeof property>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div className="fixed inset-0 bg-gray-200/40 backdrop-blur-sm" />

      {/* Modal content */}
      <div className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Header */}
        <PropertyHeader
          property={nonNullProperty}
          onClose={onClose}
          onGenerateReport={onGenerateReport}
          onOpenPriorities={() => setIsPrioritiesModalOpen(true)}
        />

        {/* Image Gallery */}
        <PropertyImageGallery
          property={nonNullProperty}
          currentImageIndex={currentImageIndex}
          onImageChange={setCurrentImageIndex}
        />

        {/* Property Info (header info - always first) */}
        <PropertyInfo property={nonNullProperty} />

        {/* Fixed sections in order: PropertyDetails, ProsAndCons, PropertyFeatures */}
        {/* 1. Property Details */}
        <PropertyDetails property={nonNullProperty} />

        {/* 2. Pros and Cons */}
        <ProsAndCons property={nonNullProperty} />

        {/* 3. Property Features */}
        {hasFeatures && (
          <PropertyFeatures key="propertyFeatures" property={nonNullProperty} />
        )}

        {/* 4. Everything else ordered by user priorities */}
        {orderedSections.map((section) => section.component)}

        {/* Loading indicator at the bottom */}
        {isLoading && <PropertyDetailsLoadingIndicator />}
      </div>

      {/* Priorities Modal */}
      <PrioritiesModal
        isOpen={isPrioritiesModalOpen}
        onClose={() => setIsPrioritiesModalOpen(false)}
        propertyAddress={nonNullProperty.address}
        onRegenerateComplete={() => {
          // Optionally refresh property data or show notification
          setIsPrioritiesModalOpen(false);
        }}
      />
    </div>
  );
};

export default PropertyDetailsModal;
