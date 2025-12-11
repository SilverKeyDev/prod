import { MapPin } from "lucide-react";
import React from "react";

import Card from "../../../layout/Card";
import { DEFAULT_REPORT_SECTIONS } from "../../../../features/onboardpersonalize/lib/constants";

import type { PropertyComponentProps } from "../types";
import { SectionTintWrapper } from "./SectionTintWrapper";

type PropertyCommuteProps = PropertyComponentProps & {
  analysisContent?: unknown;
};

export const PropertyCommute: React.FC<PropertyCommuteProps> = ({
  property,
  analysisContent,
}) => {
  const commute = (property as unknown as { commute_data?: unknown })
    .commute_data as
    | {
        map_url?: string;
        travel_times?: Array<{
          location_name?: string;
          name?: string;
          location_address?: string;
          address?: string;
          travel_time?: string | number;
          commute_tolerance?: number;
        }>;
        commute_time?: string | number;
        commute_distance?: string | number;
      }
    | undefined;

  if (!commute) return null;

  const hasTravelTimes =
    Array.isArray(commute.travel_times) && commute.travel_times.length > 0;
  const hasSimple =
    commute.commute_time != null || commute.commute_distance != null;
  if (!hasTravelTimes && !hasSimple && !analysisContent) return null;

  // Get section label
  const sectionLabel =
    DEFAULT_REPORT_SECTIONS.find(
      (s: { key: string; label: string }) => s.key === "commute"
    )?.label || "Commute Information";

  // Helper to render analysis content
  const renderAnalysisContent = (data: unknown): React.ReactNode => {
    if (!data || typeof data !== "object") return null;

    const dataObj = data as Record<string, unknown>;
    const entries = Object.entries(dataObj).filter(
      ([_, value]) => value !== null && value !== undefined && value !== ""
    );

    if (entries.length === 0) return null;

    return (
      <div className="mt-4 space-y-2 text-left">
        {entries.map(([key, value]) => {
          const displayKey = key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());

          if (Array.isArray(value)) {
            return (
              <div key={key}>
                <h4 className="mb-1 text-sm font-medium text-brown">
                  {displayKey}
                </h4>
                <ul className="space-y-1 text-sm text-brown/80">
                  {value.map((item, i) => (
                    <li key={i}>• {String(item)}</li>
                  ))}
                </ul>
              </div>
            );
          }

          return (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-brown/70">{displayKey}:</span>
              <span className="font-medium text-brown">{String(value)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-brown" />
        <h3 className="text-lg font-semibold text-brown">{sectionLabel}</h3>
      </div>

      <SectionTintWrapper className="mt-2">
        {hasTravelTimes ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
            <div>
              {commute.map_url ? (
                <div className="rounded-lg border border-beige/40 bg-white p-4">
                  <div className="aspect-square w-full">
                    <img
                      src={commute.map_url}
                      alt="Commute Map"
                      className="h-full w-full rounded object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-beige/40 bg-white p-4">
                  <div className="aspect-square flex w-full items-center justify-center">
                    <div className="text-center text-brown/60">
                      <MapPin className="mx-auto mb-3 h-12 w-12 text-brown/40" />
                      <p className="font-medium text-brown">Commute Map</p>
                      <p className="mt-1 text-sm text-brown/60">
                        Map generation in progress...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex h-full flex-col justify-center space-y-4">
              {commute.travel_times!.map((c, i) => {
                const travelTimeMinutes = c.travel_time
                  ? parseInt(String(c.travel_time).replace(/\D/g, ""))
                  : null;
                const tolerance = c.commute_tolerance;

                let colorClass = "text-olive bg-olive/10";
                if (
                  typeof travelTimeMinutes === "number" &&
                  typeof tolerance === "number"
                ) {
                  if (travelTimeMinutes > tolerance * 1.2) {
                    colorClass = "text-red-600 bg-red-50";
                  } else if (travelTimeMinutes > tolerance) {
                    colorClass = "text-amber-600 bg-amber-50";
                  }
                }

                return (
                  <Card key={i}>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="flex-1 truncate text-sm font-medium text-brown">
                            {c.location_name || c.name}
                          </span>
                          <span
                            className={`ml-2 flex-shrink-0 rounded px-2 py-1 font-medium ${colorClass}`}
                          >
                            {c.travel_time || "N/A"}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <p className="flex-1 truncate text-xs text-brown/60">
                            {c.location_address || c.address}
                          </p>
                          {tolerance && (
                            <p className="ml-2 flex-shrink-0 text-xs text-brown/60">
                              Target: {tolerance} min
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-sm text-brown/70">
            {commute.commute_time != null && (
              <p>
                <strong className="text-brown">Commute Time:</strong>{" "}
                {String(commute.commute_time)} minutes
              </p>
            )}
            {commute.commute_distance != null && (
              <p>
                <strong className="text-brown">Commute Distance:</strong>{" "}
                {String(commute.commute_distance)} miles
              </p>
            )}
          </div>
        )}
        {analysisContent != null && (
          <Card className="mt-4">{renderAnalysisContent(analysisContent)}</Card>
        )}
      </SectionTintWrapper>
    </div>
  );
};
