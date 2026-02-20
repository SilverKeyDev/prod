/**
 * Commute analysis content block. Separate file so propertyCommuteHelpers
 * only exports components (react-refresh/only-export-components).
 */
import React from "react";

import { BodyText, Title } from "@/components/ui/index.web";

export function CommuteAnalysisContent({
  data,
}: {
  data: unknown;
}): React.ReactNode {
  if (!data || typeof data !== "object") return null;
  const dataObj = data as Record<string, unknown>;
  const entries = Object.entries(dataObj).filter(
    ([_, value]) => value !== null && value !== undefined && value !== "",
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
              <Title as="h4" size="sm" className="mb-1 font-medium text-brown">
                {displayKey}
              </Title>
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
            <BodyText as="span" className="text-brown/70">
              {displayKey}:
            </BodyText>
            <BodyText as="span" className="font-medium text-brown">
              {String(value)}
            </BodyText>
          </div>
        );
      })}
    </div>
  );
}
