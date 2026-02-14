import React, { useMemo, useState } from "react";

import type { PropertyWithAnalysis } from "../../../../../packages/schemas/search/property";

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
import { PropertyDetailsLoadingIndicator } from "./PropertyDetailsLoadingIndicator";
import type { PropertyDetailsModalProps } from "./types";

type SectionComponent = {
  key: string;
  component: React.ReactNode;
  priority: number;
};

// Fixed section order based on DEFAULT_REPORT_SECTIONS (commute=3, family_friendly=4, neighborhood=2, analysis last)
const SECTION_ORDER: Record<string, number> = {
  commute: 3,
  family_friendly: 4,
  neighborhood: 2,
  analysis: 10,
};

const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
  property,
  onClose,
  onGenerateReport,
  isLoading = false,
  toolbarButtonSize = "medium",
}) => {
  // All hooks must be called before any conditional returns
  // This ensures consistent hook order across renders
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
        priority: SECTION_ORDER.commute ?? 1000,
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
        priority: SECTION_ORDER.family_friendly ?? 1000,
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
        priority: SECTION_ORDER.neighborhood ?? 1000,
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
          />
        ),
        priority: SECTION_ORDER.analysis ?? 2000,
      });
    }

    // Sort by fixed priority order
    sections.sort((a, b) => a.priority - b.priority);

    return sections;
  }, [
    property,
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
          toolbarButtonSize={toolbarButtonSize}
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

        {/* 4. Dynamic sections in fixed order */}
        {orderedSections.map((section) => section.component)}

        {/* Loading indicator at the bottom */}
        {isLoading && <PropertyDetailsLoadingIndicator />}
      </div>
    </div>
  );
};

export default PropertyDetailsModal;
