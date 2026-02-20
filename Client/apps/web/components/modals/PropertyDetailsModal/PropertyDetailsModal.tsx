import React, { useMemo, useState } from "react";

import type { PropertyWithAnalysis } from "packages/schemas/search/property";

import { PropertyImageGallery } from "./gallery/PropertyImageGallery";
import { buildPropertyDetailsOrderedSections } from "./helpers/propertyDetailsModalSectionHelpers";
import { PropertyDetailsLoadingIndicator } from "./PropertyDetailsLoadingIndicator";
import { PropertyHeader } from "./PropertyHeader";
import { PropertyDetails } from "./sections/info/PropertyDetails";
import { PropertyFeatures } from "./sections/info/PropertyFeatures";
import { PropertyInfo } from "./sections/info/PropertyInfo";
import { ProsAndCons } from "./sections/other/ProsAndCons";
import type { PropertyDetailsModalProps } from "./types";

const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
  property,
  onClose,
  onGenerateReport,
  isLoading = false,
  toolbarButtonSize = "medium",
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const propertyAnalysis = property
    ? (property as PropertyWithAnalysis).property_analysis
    : undefined;

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
  const commuteAnalysis = useMemo(
    () =>
      propertyAnalysis
        ? (propertyAnalysis as Record<string, unknown>).commute
        : undefined,
    [propertyAnalysis],
  );
  const familyFriendlyAnalysis = useMemo(
    () =>
      propertyAnalysis
        ? (propertyAnalysis as Record<string, unknown>).family_friendly
        : undefined,
    [propertyAnalysis],
  );
  const neighborhoodAnalysis = useMemo(
    () =>
      propertyAnalysis
        ? (propertyAnalysis as Record<string, unknown>).neighborhood_overview
        : undefined,
    [propertyAnalysis],
  );
  const hasNeighborhood = useMemo(
    () =>
      !!propertyAnalysis &&
      !!(propertyAnalysis as Record<string, unknown>).neighborhood_overview,
    [propertyAnalysis],
  );

  const orderedSections = useMemo(() => {
    if (!property) return [];
    return buildPropertyDetailsOrderedSections({
      property,
      hasCommute,
      hasSchools,
      hasNeighborhood,
      hasAnalysis,
      commuteAnalysis,
      familyFriendlyAnalysis,
      neighborhoodAnalysis,
    });
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

  if (!property) return null;

  const nonNullProperty = property as NonNullable<typeof property>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-200/40 backdrop-blur-sm" />
      <div className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <PropertyHeader
          property={nonNullProperty}
          onClose={onClose}
          onGenerateReport={onGenerateReport}
          toolbarButtonSize={toolbarButtonSize}
        />
        <PropertyImageGallery
          property={nonNullProperty}
          currentImageIndex={currentImageIndex}
          onImageChange={setCurrentImageIndex}
        />
        <PropertyInfo property={nonNullProperty} />
        <PropertyDetails property={nonNullProperty} />
        <ProsAndCons property={nonNullProperty} />
        {hasFeatures && (
          <PropertyFeatures key="propertyFeatures" property={nonNullProperty} />
        )}
        {orderedSections.map((section) => section.component)}
        {isLoading && <PropertyDetailsLoadingIndicator />}
      </div>
    </div>
  );
};

export default PropertyDetailsModal;
