import { CheckCircle, AlertTriangle, TrendingUp, Shield } from "lucide-react";
import React from "react";

import type { PropertyWithAnalysis } from "../../../../../packages/schemas/property";
import Card from "../../layout/Card";

import type { PropertyComponentProps } from "./types";

export const PropertyAnalysis: React.FC<PropertyComponentProps> = ({
  property,
}) => {
  const propertyWithAnalysis = property as PropertyWithAnalysis;
  const propertyAnalysis = propertyWithAnalysis.property_analysis;

  if (!propertyAnalysis) {
    return null;
  }

  // ROI Explanation
  const roiExplanation = propertyAnalysis.roi_explanation;
  const neighborhoodOverview = propertyAnalysis.neighborhood_overview;
  const { pros } = propertyAnalysis;
  const { cons } = propertyAnalysis;
  const crimeStats = propertyAnalysis.crime_stats;
  const gentrificationIndex = propertyAnalysis.gentrification_index;

  return (
    <div className="p-6">
      {/* ROI Explanation */}
      {roiExplanation && (
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-brown">
              Investment Analysis
            </h3>
          </div>
          <Card className="p-4">
            {(() => {
              const sentences: string[] = roiExplanation
                .split(/[.!?]+/)
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0);
              if (sentences.length === 0) {
                return (
                  <p className="text-sm leading-relaxed text-brown/80">
                    No investment analysis available.
                  </p>
                );
              }
              const summary = sentences[0] + ".";
              const bullets = sentences
                .slice(1)
                .filter((s: string) => s.length > 10);
              return (
                <div>
                  <p className="mb-3 text-sm leading-relaxed text-brown/80">
                    {summary}
                  </p>
                  {bullets.length > 0 && (
                    <ul className="space-y-2">
                      {bullets.map((point: string, i: number) => (
                        <li
                          key={i}
                          className="text-sm leading-relaxed text-brown/80"
                        >
                          {point}.
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })()}
          </Card>
        </div>
      )}

      {/* Neighborhood Overview */}
      {neighborhoodOverview && (
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-brown">
              Neighborhood Overview
            </h3>
          </div>
          <Card className="p-4">
            <div>
              <p className="text-sm leading-relaxed text-brown/80">
                {neighborhoodOverview.description}
              </p>
            </div>
            {neighborhoodOverview.vibe && (
              <div>
                <div className="rounded-lg border border-olive/20 bg-olive/10 px-3 py-2">
                  {neighborhoodOverview.vibe}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Pros and Cons */}
      {(pros ?? cons) && (
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-brown">Pros & Cons</h3>
            {/* Balance indicator */}
            {pros && cons && Math.abs(pros.length - cons.length) > 2 && (
              <div className="ml-auto flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-1 text-xs text-yellow-700">
                {pros.length > cons.length ? "More pros" : "More cons"}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            {/* Pros Column */}
            <Card
              className={`p-3 sm:p-4 ${
                pros && cons && pros.length > cons.length + 2
                  ? "ring-1 ring-green-200 bg-green-50/30"
                  : ""
              }`}
            >
              <h4 className="mb-3 flex items-center gap-2 font-medium text-green-700">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                Pros
                {pros && (
                  <span className="ml-1 text-xs text-green-600">
                    ({pros.length})
                  </span>
                )}
              </h4>
              <div className="space-y-3">
                {pros && pros.length > 0 ? (
                  pros.map((pro: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm text-green-700"
                    >
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      {pro}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    No pros identified
                  </div>
                )}
              </div>
            </Card>

            {/* Cons Column */}
            <Card
              className={`p-3 sm:p-4 ${
                pros && cons && cons.length > pros.length + 2
                  ? "ring-1 ring-red-200 bg-red-50/30"
                  : ""
              }`}
            >
              <h4 className="mb-3 flex items-center gap-2 font-medium text-red-700">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                Cons
                {cons && (
                  <span className="ml-1 text-xs text-red-600">
                    ({cons.length})
                  </span>
                )}
              </h4>
              <div className="space-y-3">
                {cons && cons.length > 0 ? (
                  cons.map((con: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm text-red-700"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                      {con}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    No cons identified
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Crime & Gentrification */}
      {(crimeStats ?? gentrificationIndex) && (
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-brown">
              Safety & Development
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Crime Stats */}
            {crimeStats && (
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-600" />
                  <h4 className="font-medium text-brown">Crime Statistics</h4>
                </div>
                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      Safety Score:
                      {crimeStats.overall_safety_score}
                    </div>
                    <div className="flex items-center justify-between">
                      Crime Rate:
                      {crimeStats.crime_rate}
                    </div>
                    <div className="flex items-center justify-between">
                      Recent Trends:
                      {crimeStats.recent_trends}
                    </div>
                    <div className="flex items-center justify-between">
                      Data Source:
                      {crimeStats.data_source}
                    </div>
                  </div>

                  {crimeStats.specific_concerns &&
                    crimeStats.specific_concerns.length > 0 && (
                      <div className="rounded-lg border border-beige/40 bg-beige/10 p-4">
                        <h4 className="mb-2 font-medium text-brown">
                          Specific Concerns
                        </h4>
                        <div className="space-y-1 text-sm text-brown/70">
                          {crimeStats.specific_concerns.map((c, i) => (
                            <p key={i}>{c}</p>
                          ))}
                        </div>
                      </div>
                    )}
                </Card>
              </div>
            )}

            {/* Gentrification Index */}
            {gentrificationIndex && (
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <h4 className="font-medium text-brown">
                    Gentrification Index
                  </h4>
                </div>
                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      Score:
                      {gentrificationIndex.score}
                    </div>
                    <div className="flex items-center justify-between">
                      Trend:
                      {gentrificationIndex.trend}
                    </div>
                    <div className="flex items-center justify-between">
                      Timeline:
                      {gentrificationIndex.timeline}
                    </div>
                    <div className="flex items-center justify-between">
                      Property Impact:
                      {gentrificationIndex.impact_on_property_value}
                    </div>
                  </div>

                  {gentrificationIndex.indicators &&
                    gentrificationIndex.indicators.length > 0 && (
                      <div className="rounded-lg border border-beige/40 bg-beige/10 p-4">
                        <h4 className="mb-2 font-medium text-brown">
                          Key Indicators
                        </h4>
                        <div className="space-y-1 text-sm text-brown/70">
                          {gentrificationIndex.indicators.map(
                            (ind: string, i: number) => (
                              <p key={i}>{ind}</p>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
