/**
 * Helpers for usePropertyDetails streaming: error parsing and update application.
 */

import type { Property } from "./propertyDetailsTypes";

type ErrorUpdateData = {
  error?: string;
  message?: string;
  details?: string;
  status_code?: number;
};

export function parseStreamError(errorData: ErrorUpdateData): string {
  let errorMessage = errorData.details || errorData.message || errorData.error || "Unknown error";
  if (errorData.details) {
    try {
      const parsed = JSON.parse(errorData.details) as { message?: string } | string;
      if (typeof parsed === "object" && parsed?.message) {
        errorMessage = parsed.message;
      } else if (typeof parsed === "string") {
        errorMessage = parsed;
      }
    } catch {
      errorMessage = errorData.details;
    }
  }
  const statusCode = errorData.status_code ? ` (${errorData.status_code})` : "";
  return `${errorMessage}${statusCode}`;
}

type StreamUpdate = {
  type: string;
  data: unknown;
};

type SetPropertyState = (
  value: Property | null | ((prev: Property | null) => Property | null)
) => void;

export function applyStreamUpdate(
  update: StreamUpdate,
  setSelectedProperty: SetPropertyState,
  setIsLoading: (loading: boolean) => void
): void {
  if (!update || !update.type) {
    return;
  }

  if (update.type === "basic") {
    const basicData = update.data as { data?: unknown };
    setSelectedProperty((prev) => {
      if (!prev) return prev;
      return { ...prev, ...(basicData.data as Record<string, unknown>) };
    });
    return;
  }
  if (update.type === "commute_data") {
    setSelectedProperty((prev) => {
      if (!prev) return prev;
      return { ...prev, commute_data: update.data };
    });
    return;
  }
  if (update.type === "property_analysis_section") {
    // Handle individual section updates as they complete (streaming)
    setSelectedProperty((prev) => {
      if (!prev) return prev;
      const existing = (prev.property_analysis as Record<string, unknown>) || {};
      return {
        ...prev,
        property_analysis: {
          ...existing,
          ...(update.data as Record<string, unknown>),
        },
      };
    });
    return;
  }
  if (update.type === "property_analysis" || update.type === "property_analysis_partial") {
    setSelectedProperty((prev) => {
      if (!prev) return prev;
      const existing = (prev.property_analysis as Record<string, unknown>) || {};
      return {
        ...prev,
        property_analysis: {
          ...existing,
          ...(update.data as Record<string, unknown>),
        },
      };
    });
    return;
  }
  if (update.type === "images") {
    setSelectedProperty((prev) => {
      if (!prev) return prev;
      const raw = update.data;
      const images = Array.isArray(raw)
        ? raw
        : raw &&
            typeof raw === "object" &&
            "images" in raw &&
            Array.isArray((raw as { images: unknown }).images)
          ? (raw as { images: string[] }).images
          : [];
      return { ...prev, images };
    });
    return;
  }
  if (update.type === "image_features") {
    setSelectedProperty((prev) => {
      if (!prev) return prev;
      return { ...prev, image_features: update.data };
    });
    return;
  }
  if (update.type === "features") {
    setSelectedProperty((prev) => {
      if (!prev) return prev;
      return { ...prev, features: update.data };
    });
    return;
  }
  if (update.type === "combined_features") {
    setSelectedProperty((prev) => {
      if (!prev) return prev;
      return { ...prev, combined_features: update.data };
    });
    return;
  }
  if (update.type === "complete") {
    setIsLoading(false);
  }
}
