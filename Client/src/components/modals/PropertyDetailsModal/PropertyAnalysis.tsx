import { CheckCircle, AlertTriangle, TrendingUp, Shield } from "lucide-react";
import React from "react";

import type { PropertyWithAnalysis } from "../../../core/schemas/property";
import Card from "../../format/Card";

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
    <div className="px-6 py-6">
      {/* ROI Explanation */}
      {roiExplanation && (
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500/70" />
            <h3 className="text-lg font-semibold text-brown">
              Investment Analysis
            </h3>
          </div>
          <Card className="p-4 border-r-0">
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
              const summary = `${sentences[0]}.`;
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
            <CheckCircle className="h-5 w-5 text-blue-500/70" />
            <h3 className="text-lg font-semibold text-brown">
              Neighborhood Overview
            </h3>
          </div>
          <Card className="p-4 border-r-0">
            <div>
              <p className="text-sm leading-relaxed text-brown/80">
                {neighborhoodOverview.description}
              </p>
            </div>
            {neighborhoodOverview.vibe && (
              <div>
                <div className="rounded-lg border border-olive/20 bg-olive/10 px-3 py-2">
                  <span className="text-sm font-medium text-olive">
                    {neighborhoodOverview.vibe}
                  </span>
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
            <AlertTriangle className="h-5 w-5 text-yellow-500/70" />
            <h3 className="text-lg font-semibold text-brown">Pros & Cons</h3>
            {/* Balance indicator */}
            {pros && cons && Math.abs(pros.length - cons.length) > 2 && (
              <div className="ml-auto flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-1 text-xs text-yellow-700">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400"></span>
                <span>
                  {pros.length > cons.length ? "More pros" : "More cons"}
                </span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            {/* Pros Column */}
            <Card
              className={`p-3 sm:p-4 ${
                pros && cons && pros.length > cons.length + 2
                  ? "ring-1 ring-olive/30 bg-olive/10"
                  : ""
              }`}
            >
              <h4 className="mb-3 flex items-center gap-2 font-medium text-olive/80">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Pros</span>
                {pros && (
                  <span className="ml-auto flex-shrink-0 rounded-full bg-olive/20 px-2 py-1 text-xs font-medium text-olive/70">
                    {pros.length}
                  </span>
                )}
              </h4>
              <div className="space-y-3">
                {pros && pros.length > 0 ? (
                  pros.map((pro: string, i: number) => (
                    <div key={i} className="text-sm text-olive/70">
                      <span className="leading-relaxed">{pro}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">
                    <span>No pros identified</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Cons Column */}
            <Card
              className={`p-3 sm:p-4 ${
                pros && cons && cons.length > pros.length + 2
                  ? "ring-1 ring-red-200/30 bg-red-50/10"
                  : ""
              }`}
            >
              <h4 className="mb-3 flex items-center gap-2 font-medium text-red-500/60">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Cons</span>
                {cons && (
                  <span className="ml-auto flex-shrink-0 rounded-full bg-red-100/40 px-2 py-1 text-xs font-medium text-red-600/60">
                    {cons.length}
                  </span>
                )}
              </h4>
              <div className="space-y-3">
                {cons && cons.length > 0 ? (
                  cons.map((con: string, i: number) => (
                    <div key={i} className="text-sm text-red-500/50">
                      <span className="leading-relaxed">{con}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">
                    <span>No cons identified</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
