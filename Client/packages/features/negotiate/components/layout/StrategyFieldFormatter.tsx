import React from "react";

import { Box } from "packages/ui/components/structure/primitives";

import { BodyText } from "@/components/ui";
type TranslateFn = (key: string) => string;

export function formatStrategyValue(val: unknown, t?: TranslateFn): React.JSX.Element | string {
  const yesLabel = t ? t("negotiate.strategy_field.yes") : "Yes";
  const noLabel = t ? t("negotiate.strategy_field.no") : "No";
  const notSpecifiedLabel = t ? t("profile.sections.not_specified") : "Not specified";
  if (typeof val === "object" && val !== null) {
    if (Array.isArray(val)) {
      // Format arrays as clean bullet points with modern styling
      return (
        <ul className="ml-2 space-y-2">
          {val.map((item, idx) => (
            <li key={idx} className="text-responsive-sm text-text-primary flex items-start gap-2">
              <BodyText
                as="span"
                size="sm"
                className="text-text-secondary flex h-5 flex-shrink-0 items-center"
              >
                <BodyText as="span" size="sm" className="bg-primary-muted h-px w-2" />
              </BodyText>
              <BodyText as="span" size="sm">
                {typeof item === "object" && item !== null
                  ? // Handle objects properly - extract meaningful content
                    Object.entries(item as Record<string, unknown>)
                      .map(([k, v]) => `${k}: ${String(v)}`)
                      .join(", ")
                      .replace(/_/g, " ")
                  : // Handle strings and primitives
                    String(item)
                      .replace(/_/g, " ")
                      .replace(/([a-z])([A-Z])/g, "$1 $2")
                      .split(" ")
                      .map(
                        (word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                      )
                      .join(" ")}
              </BodyText>
            </li>
          ))}
        </ul>
      );
    } else {
      // For objects, create clean structured display without JSON
      return (
        <Box className="space-y-2">
          {Object.entries(val).map(([subKey, subValue]) => {
            // Format the sub-key nicely
            const formattedKey = subKey
              .replace(/_/g, " ")
              .replace(/([a-z])([A-Z])/g, "$1 $2")
              .split(" ")
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");

            return (
              <Box
                key={subKey}
                className="border-brown/30 bg-background-base/50 rounded-lg border-l-4 p-3"
              >
                <Box className="text-responsive-sm text-text-secondary mb-2 font-semibold">
                  {formattedKey}
                </Box>
                <Box className="text-responsive-sm text-text-primary">
                  {typeof subValue === "object" && subValue !== null ? (
                    Array.isArray(subValue) ? (
                      <ul className="ml-2 space-y-2">
                        {subValue.map((item, idx) => (
                          <li key={idx} className="text-responsive-sm flex items-start gap-2">
                            <BodyText
                              as="span"
                              size="sm"
                              className="text-text-secondary flex h-5 flex-shrink-0 items-center"
                            >
                              <BodyText as="span" size="sm" className="bg-primary-muted h-px w-2" />
                            </BodyText>
                            <BodyText as="span" size="sm">
                              {typeof item === "object"
                                ? Object.entries(item as Record<string, unknown>)
                                    .map(([k, v]) => `${k.replace(/_/g, " ")}: ${String(v)}`)
                                    .join(", ")
                                : String(item)
                                    .replace(/_/g, " ")
                                    .replace(/([a-z])([A-Z])/g, "$1 $2")}
                            </BodyText>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      // Nested objects - display as key-value pairs with bullets
                      <Box className="space-y-2">
                        {Object.entries(subValue as Record<string, unknown>).map(
                          ([nestedKey, nestedValue]) => (
                            <Box
                              key={nestedKey}
                              className="text-responsive-xs flex items-start gap-2"
                            >
                              <BodyText
                                as="span"
                                size="xs"
                                className="text-text-secondary flex h-5 flex-shrink-0 items-center"
                              >
                                <BodyText
                                  as="span"
                                  size="xs"
                                  className="bg-primary-muted h-px w-2"
                                />
                              </BodyText>
                              <Box className="flex-1">
                                <BodyText
                                  as="span"
                                  size="xs"
                                  className="text-text-secondary font-medium"
                                >
                                  {nestedKey
                                    .replace(/_/g, " ")
                                    .replace(/([a-z])([A-Z])/g, "$1 $2")
                                    .split(" ")
                                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join(" ")}
                                  :
                                </BodyText>{" "}
                                <BodyText as="span" size="xs" className="text-text-primary">
                                  {typeof nestedValue === "boolean"
                                    ? nestedValue
                                      ? yesLabel
                                      : noLabel
                                    : typeof nestedValue === "number"
                                      ? nestedValue.toLocaleString()
                                      : Array.isArray(nestedValue)
                                        ? nestedValue.join(", ").replace(/_/g, " ")
                                        : (nestedValue
                                            ?.toString()
                                            .replace(/_/g, " ")
                                            .replace(/([a-z])([A-Z])/g, "$1 $2") ??
                                          notSpecifiedLabel)}
                                </BodyText>
                              </Box>
                            </Box>
                          )
                        )}
                      </Box>
                    )
                  ) : typeof subValue === "boolean" ? (
                    <BodyText
                      as="span"
                      size="xs"
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        subValue
                          ? "bg-accent-muted text-accent"
                          : "bg-primary-muted text-destructive"
                      }`}
                    >
                      {subValue ? yesLabel : noLabel}
                    </BodyText>
                  ) : typeof subValue === "number" ? (
                    <BodyText as="span" size="sm" className="text-text-secondary font-mono">
                      {subValue.toLocaleString()}
                    </BodyText>
                  ) : // Special formatting for price rationale
                  subKey === "price_rationale" && typeof subValue === "string" ? (
                    <Box className="space-y-2">
                      {subValue
                        .split(". ")
                        .filter((sentence) => sentence.trim().length > 0)
                        .map((sentence, idx) => (
                          <Box key={idx} className="flex items-start gap-2">
                            <BodyText
                              as="span"
                              size="sm"
                              className="text-text-secondary mt-1 flex h-5 flex-shrink-0 items-center"
                            >
                              <BodyText as="span" size="sm" className="bg-primary-muted h-px w-2" />
                            </BodyText>
                            <BodyText
                              as="span"
                              size="sm"
                              className="text-responsive-sm text-text-primary leading-relaxed"
                            >
                              {sentence.trim()}
                              {!sentence.endsWith(".") && "."}
                            </BodyText>
                          </Box>
                        ))}
                    </Box>
                  ) : (
                    <BodyText as="p" className="leading-relaxed">
                      {subValue && typeof subValue === "string"
                        ? subValue.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2")
                        : subValue && typeof subValue === "number"
                          ? subValue
                              .toString()
                              .replace(/_/g, " ")
                              .replace(/([a-z])([A-Z])/g, "$1 $2")
                          : notSpecifiedLabel}
                    </BodyText>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      );
    }
  } else if (typeof val === "boolean") {
    return (
      <BodyText
        as="span"
        size="sm"
        className={`rounded-full px-3 py-1 text-sm font-medium ${
          val ? "bg-accent-muted text-accent" : "bg-primary-muted text-destructive"
        }`}
      >
        {val ? "Yes" : "No"}
      </BodyText>
    );
  } else if (typeof val === "number") {
    return (
      <BodyText as="span" size="md" className="text-text-secondary font-mono text-lg font-semibold">
        {val.toLocaleString()}
      </BodyText>
    );
  } else {
    return (
      <BodyText as="p" className="text-text-primary leading-relaxed">
        {String(val)
          .replace(/_/g, " ")
          .replace(/([a-z])([A-Z])/g, "$1 $2")}
      </BodyText>
    );
  }
}
