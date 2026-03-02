/**
 * Helpers for PropertyNeighborhood; extracted to satisfy max-lines-per-function.
 */
import React from "react";

import { BodyText, Title } from "packages/ui/components/index.web";

export function renderNeighborhoodContent(data: Record<string, unknown>): React.ReactNode {
  const entries = Object.entries(data).filter(
    ([_, value]) => value !== null && value !== undefined && value !== ""
  );
  if (entries.length === 0) return null;
  return (
    <div className="space-y-4">
      {entries.map(([key, value]) => {
        const displayKey = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        if (Array.isArray(value)) {
          return (
            <div key={key}>
              <Title as="h4" size="sm" className="text-brown mb-2 font-medium">
                {displayKey}
              </Title>
              <ul className="text-brown/80 ml-4 space-y-1 text-sm">
                {value.map((item, i) => (
                  <li key={i} className="list-disc">
                    {String(item)}
                  </li>
                ))}
              </ul>
            </div>
          );
        }
        if (typeof value === "object" && value !== null) {
          return (
            <div key={key} className="border-beige/40 bg-beige/10 rounded-lg border p-3">
              <Title as="h4" size="sm" className="text-brown mb-2 font-medium">
                {displayKey}
              </Title>
              <div className="text-brown/70 space-y-2 text-sm">
                {Object.entries(value as Record<string, unknown>).map(([subKey, subValue]) => (
                  <div key={subKey} className="flex flex-col">
                    <BodyText as="span" className="text-brown font-medium">
                      {subKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </BodyText>
                    <BodyText as="span" className="text-brown/80">
                      {String(subValue)}
                    </BodyText>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return (
          <div key={key} className="flex flex-col space-y-1">
            <BodyText as="span" className="text-brown text-sm font-medium">
              {displayKey}
            </BodyText>
            <BodyText as="span" className="text-brown/80 text-sm">
              {String(value)}
            </BodyText>
          </div>
        );
      })}
    </div>
  );
}

export function renderAgeDistribution(data: Record<string, string>): React.ReactNode {
  const entries = Object.entries(data)
    .map(([key, value]) => {
      const numValue = parseFloat(String(value).replace("%", "")) || 0;
      return { key, value, numValue };
    })
    .sort((a, b) => {
      const order = ["0-19", "20-34", "35-49", "50-64", "65+"];
      return order.indexOf(a.key) - order.indexOf(b.key);
    });
  const maxValue = Math.max(...entries.map((e) => e.numValue), 100);
  return (
    <div className="space-y-3">
      <Title as="h4" size="sm" className="text-brown font-medium">
        Age Distribution
      </Title>
      <div className="space-y-2">
        {entries.map(({ key, value, numValue }) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-sm">
              <BodyText as="span" className="text-brown/70">
                {key} years
              </BodyText>
              <BodyText as="span" className="text-brown font-medium">
                {value}
              </BodyText>
            </div>
            <div className="bg-beige/30 h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-olive h-full rounded-full transition-all"
                style={{ width: `${(numValue / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
