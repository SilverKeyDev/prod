import { useEffect, useRef } from "react";
import { Lightbulb, Home, Share2 } from "lucide-react";

import { CardCarousel } from "../components/cards/base";
import CompCard from "../components/cards/CompCard";
import { AlignedRow } from "../components/layout";
import { FavoriteHomesDropdown, Loading, Button } from "../components/ui";
import { useNegotiationStore } from "../../../packages/store/negotiation.slice";
import { SectionBox, SectionTitle } from "../features/negotiate";
import { negotiationService } from "../../../packages/services/negotiation";

// Types for negotiation data
type FavoriteHome = {
  user_id: string;
  address: string;
  beds: string;
  baths: string;
  sqft: string;
  lot_size: string;
  price: string;
  image_url: string;
  created_at: string;
  updated_at: string;
};

// Removed unused CompsDataResponse type

export default function NegotiationStrategy() {
  const {
    selectedHome,
    strategyData,
    compsData,
    isLoading,
    error,
    setLoading,
    setError,
  } = useNegotiationStore();

  // Ref for the price element to scroll to
  const priceElementRef = useRef<HTMLDivElement>(null);
  const previousLoadingRef = useRef<boolean>(false);

  // Create handler functions for compatibility
  const handleHomeSelection = (home: unknown) => {
    negotiationService.selectHome(home);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    await negotiationService.generateStrategy();
  };

  const handleShareJson = async () => {
    await negotiationService.shareStrategyJson();
  };

  // Extract error message for proper type handling
  const errorMessage: string | null =
    error && typeof error !== "object"
      ? typeof error === "string"
        ? error
        : String(error)
      : null;

  // Type guard for loading state
  const shouldShowLoading = (): boolean => {
    return Boolean(isLoading);
  };

  // Type guard for error state
  const shouldShowError = (): boolean => {
    return Boolean(errorMessage);
  };

  // Auto-scroll to price element when strategy finishes loading
  useEffect(() => {
    // Check if loading just finished (was true, now false)
    const loadingJustFinished =
      previousLoadingRef.current === true && isLoading === false;

    if (loadingJustFinished && priceElementRef.current && strategyData) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        priceElementRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }, 100);
    }

    // Update previous loading state
    previousLoadingRef.current = isLoading;
  }, [isLoading, strategyData]);

  // Debug logging - only log when strategyData changes
  useEffect(() => {
    if (
      strategyData &&
      typeof strategyData === "object" &&
      !Array.isArray(strategyData)
    ) {
      const actualData =
        (strategyData as Record<string, unknown>).data &&
        typeof (strategyData as Record<string, unknown>).data === "object"
          ? ((strategyData as Record<string, unknown>).data as Record<
              string,
              unknown
            >)
          : (strategyData as Record<string, unknown>);

      const priceSection = actualData?.price_section;

      if (
        priceSection &&
        typeof priceSection === "object" &&
        priceSection !== null
      ) {
        // no-op: presence validated; rendering handles opening_offer
      }
    }
  }, [strategyData]);

  return (
    <div>
      {/* Main Content */}
      <div>
        {/* Home selector */}
        <SectionBox>
          <SectionTitle icon={<Home className="mobile-icon-sm text-brown" />}>
            Select a Home
          </SectionTitle>

          <AlignedRow gap="sm" justify="start" widths={[80, 20]}>
            <FavoriteHomesDropdown
              selectedHome={
                selectedHome && typeof selectedHome === "object"
                  ? (selectedHome as FavoriteHome)
                  : null
              }
              onHomeSelect={handleHomeSelection}
              placeholder="Select a favorite home for strategy generation"
            />
            <Button
              variant="olive"
              hideTextBelow="md"
              loading={isLoading}
              icon={<Lightbulb className="mobile-icon-sm" />}
              onClick={handleGenerate}
              disabled={!selectedHome || isLoading}
              className="h-full whitespace-nowrap"
            >
              Generate
            </Button>
          </AlignedRow>
        </SectionBox>

        {/* Loading state */}
        {
          (shouldShowLoading() && (
            <SectionBox>
              <div className="flex justify-center">
                <Loading
                  message={
                    "We appreciate feedback! Want us to build a new feature, let us know!"
                  }
                />
              </div>
            </SectionBox>
          )) as JSX.Element
        }

        {/* Error display */}
        {
          (shouldShowError() && (
            <SectionBox className="border-red-200 bg-red-50">
              <div className="text-responsive-sm text-center text-red-600">
                <p className="mb-2 font-semibold">Error Generating Strategy</p>
                <p className="text-responsive-sm">{errorMessage}</p>
              </div>
            </SectionBox>
          )) as any
        }

        {/* Property Comparables CardCarousel */}
        {compsData &&
          typeof compsData === "object" &&
          "success" in compsData &&
          (compsData as { success: boolean }).success &&
          "data" in compsData &&
          Boolean((compsData as { data: unknown }).data) &&
          typeof (compsData as { data: unknown }).data === "object" &&
          "comps" in (compsData as { data: Record<string, unknown> }).data &&
          !isLoading && (
            <div className="my-responsive-lg">
              <SectionTitle className="!text-brown">
                Comparable Sales
              </SectionTitle>
              <CardCarousel
                items={
                  Array.isArray(
                    (compsData as { data?: { comps?: unknown } })?.data?.comps
                  )
                    ? (compsData as { data: { comps: unknown[] } }).data.comps
                    : ([] as unknown[])
                }
                loading={false}
                error={null}
                emptyMessage="No comparable properties found"
                renderItem={(comp) =>
                  comp && typeof comp === "object" ? (
                    <CompCard
                      comp={
                        comp as unknown as import("../components/cards/CompCard").CompData
                      }
                    />
                  ) : null
                }
                getItemKey={(comp) =>
                  comp &&
                  typeof comp === "object" &&
                  "zpid" in comp &&
                  typeof comp.zpid === "number"
                    ? comp.zpid.toString()
                    : "unknown"
                }
                cardMinWidth={280}
                cardGap={16}
                infiniteLoop={false}
                ariaLabel="Property comparables carousel"
              />
            </div>
          )}

        {/* Recommended Opening Offer - Displayed after comps */}
        {(() => {
          // Handle nested data structure - check if data is under a 'data' property
          const actualData =
            strategyData &&
            typeof strategyData === "object" &&
            !Array.isArray(strategyData)
              ? (strategyData as Record<string, unknown>).data &&
                typeof (strategyData as Record<string, unknown>).data ===
                  "object"
                ? ((strategyData as Record<string, unknown>).data as Record<
                    string,
                    unknown
                  >)
                : (strategyData as Record<string, unknown>)
              : null;

          const priceSection = actualData?.price_section;

          if (
            priceSection &&
            typeof priceSection === "object" &&
            priceSection !== null
          ) {
            const openingOffer = (priceSection as Record<string, unknown>)
              .opening_offer;

            // Handle different data types for opening offer
            let offerValue: number | null = null;
            if (typeof openingOffer === "number") {
              offerValue = openingOffer;
            } else if (typeof openingOffer === "string") {
              // Remove dollar sign, commas, and whitespace before parsing
              const cleaned = openingOffer.replace(/[\$,\s]/g, "");
              const parsed = parseFloat(cleaned);
              if (!isNaN(parsed)) {
                offerValue = parsed;
              }
            }

            if (offerValue !== null && offerValue > 0) {
              return (
                <div ref={priceElementRef} className="my-responsive-lg">
                  <div className="rounded-lg bg-olive/10 p-6">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-olive text-white">
                        <span className="text-lg font-bold">$</span>
                      </span>
                      <div>
                        <div className="text-sm font-medium text-olive uppercase tracking-wide">
                          Recommended Opening Offer
                        </div>
                        <div className="mt-1 text-3xl font-bold text-olive sm:text-4xl lg:text-5xl">
                          ${offerValue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
          }
          return null;
        })()}

        {/* Property Comps Debug JSON (fallback) */}
        {Boolean(compsData) &&
          (!(
            compsData &&
            typeof compsData === "object" &&
            "success" in compsData &&
            (compsData as { success: boolean }).success
          ) ||
            !(
              compsData &&
              typeof compsData === "object" &&
              "data" in compsData &&
              (compsData as { data: unknown }).data &&
              typeof (compsData as { data: unknown }).data === "object" &&
              "comps" in (compsData as { data: Record<string, unknown> }).data
            )) &&
          !isLoading && (
            <SectionBox>
              <SectionTitle
                icon={<Home className="mobile-icon-sm text-brown" />}
              >
                Property Comparables - Debug Response
              </SectionTitle>
              <div className="space-responsive-sm text-responsive-sm max-h-96 overflow-auto rounded-lg bg-gray-900 font-mono text-green-400">
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(compsData, null, 2)}
                </pre>
              </div>
            </SectionBox>
          )}

        {/* Strategy output - Dynamic display of all AI fields */}
        {strategyData && !isLoading && (
          <div className="space-y-responsive-md">
            {strategyData &&
            typeof strategyData === "object" &&
            !Array.isArray(strategyData)
              ? Object.entries(
                  // Handle nested data structure - check if data is under a 'data' property
                  (strategyData as Record<string, unknown>).data &&
                    typeof (strategyData as Record<string, unknown>).data ===
                      "object"
                    ? ((strategyData as Record<string, unknown>).data as Record<
                        string,
                        unknown
                      >)
                    : (strategyData as Record<string, unknown>)
                )
                  .sort(([keyA], [keyB]) => {
                    // Always show price_section first
                    if (keyA === "price_section") return -1;
                    if (keyB === "price_section") return 1;
                    // Keep other sections in their original order
                    return 0;
                  })
                  .map(([key, value], index) => {
                    // Skip empty or null values
                    if (
                      !value ||
                      (typeof value === "string" && value.trim() === "")
                    ) {
                      return null;
                    }

                    // Skip metadata fields that shouldn't be displayed
                    const metadataFields = [
                      "section",
                      "success",
                      "task_id",
                      "generated_at",
                      "filename",
                      "strategy_id",
                    ];
                    if (metadataFields.includes(key.toLowerCase())) {
                      return null;
                    }

                    // Skip opening_offer from price_section since it's displayed above
                    if (
                      key === "price_section" &&
                      typeof value === "object" &&
                      value !== null
                    ) {
                      const priceSectionObj = value as Record<string, unknown>;
                      if (priceSectionObj.opening_offer) {
                        // Create a new object without opening_offer
                        const { opening_offer, ...priceSectionWithoutOffer } =
                          priceSectionObj;
                        value = priceSectionWithoutOffer;
                      }
                    }

                    // Format the value for display with better styling - NO JSON
                    const formatValue = (
                      val: unknown
                    ): JSX.Element | string => {
                      if (typeof val === "object" && val !== null) {
                        if (Array.isArray(val)) {
                          // Format arrays as clean bullet points with modern styling
                          return (
                            <ul className="ml-2 space-y-2">
                              {val.map((item, idx) => (
                                <li
                                  key={idx}
                                  className="text-responsive-sm flex items-start gap-2 text-navy/80"
                                >
                                  <span className="flex h-5 flex-shrink-0 items-center text-brown">
                                    <span className="h-px w-2 bg-brown"></span>
                                  </span>
                                  <span>
                                    {typeof item === "object" && item !== null
                                      ? // Handle objects properly - extract meaningful content
                                        Object.entries(
                                          item as Record<string, unknown>
                                        )
                                          .map(([k, v]) => `${k}: ${String(v)}`)
                                          .join(", ")
                                          .replace(/_/g, " ")
                                      : // Handle strings and primitives
                                        String(item)
                                          .replace(/_/g, " ")
                                          .replace(/([a-z])([A-Z])/g, "$1 $2")
                                          .split(" ")
                                          .map(
                                            (word: string) =>
                                              word.charAt(0).toUpperCase() +
                                              word.slice(1).toLowerCase()
                                          )
                                          .join(" ")}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          );
                        } else {
                          // For objects, create clean structured display without JSON
                          return (
                            <div className="space-y-2">
                              {Object.entries(val).map(([subKey, subValue]) => {
                                // Format the sub-key nicely
                                const formattedKey = subKey
                                  .replace(/_/g, " ")
                                  .replace(/([a-z])([A-Z])/g, "$1 $2")
                                  .split(" ")
                                  .map(
                                    (word: string) =>
                                      word.charAt(0).toUpperCase() +
                                      word.slice(1)
                                  )
                                  .join(" ");

                                return (
                                  <div
                                    key={subKey}
                                    className="rounded-lg border-l-4 border-brown/30 bg-gray-50/50 p-3"
                                  >
                                    <div className="text-responsive-sm mb-2 font-semibold text-brown">
                                      {formattedKey}
                                    </div>
                                    <div className="text-responsive-sm text-navy/80">
                                      {typeof subValue === "object" &&
                                      subValue !== null ? (
                                        Array.isArray(subValue) ? (
                                          <ul className="ml-2 space-y-2">
                                            {subValue.map((item, idx) => (
                                              <li
                                                key={idx}
                                                className="text-responsive-sm flex items-start gap-2"
                                              >
                                                <span className="flex h-5 flex-shrink-0 items-center text-brown">
                                                  <span className="h-px w-2 bg-brown"></span>
                                                </span>
                                                <span>
                                                  {typeof item === "object"
                                                    ? Object.entries(
                                                        item as Record<
                                                          string,
                                                          unknown
                                                        >
                                                      )
                                                        .map(
                                                          ([k, v]) =>
                                                            `${k.replace(/_/g, " ")}: ${String(v)}`
                                                        )
                                                        .join(", ")
                                                    : String(item)
                                                        .replace(/_/g, " ")
                                                        .replace(
                                                          /([a-z])([A-Z])/g,
                                                          "$1 $2"
                                                        )}
                                                </span>
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          // Nested objects - display as key-value pairs with bullets
                                          <div className="space-y-2">
                                            {Object.entries(
                                              subValue as Record<
                                                string,
                                                unknown
                                              >
                                            ).map(
                                              ([nestedKey, nestedValue]) => (
                                                <div
                                                  key={nestedKey}
                                                  className="text-responsive-xs flex items-start gap-2"
                                                >
                                                  <span className="flex h-5 flex-shrink-0 items-center text-brown">
                                                    <span className="h-px w-2 bg-brown"></span>
                                                  </span>
                                                  <div className="flex-1">
                                                    <span className="font-medium text-brown/80">
                                                      {nestedKey
                                                        .replace(/_/g, " ")
                                                        .replace(
                                                          /([a-z])([A-Z])/g,
                                                          "$1 $2"
                                                        )
                                                        .split(" ")
                                                        .map(
                                                          (word) =>
                                                            word
                                                              .charAt(0)
                                                              .toUpperCase() +
                                                            word.slice(1)
                                                        )
                                                        .join(" ")}
                                                      :
                                                    </span>{" "}
                                                    <span className="text-navy/70">
                                                      {typeof nestedValue ===
                                                      "boolean"
                                                        ? nestedValue
                                                          ? "Yes"
                                                          : "No"
                                                        : typeof nestedValue ===
                                                            "number"
                                                          ? nestedValue.toLocaleString()
                                                          : Array.isArray(
                                                                nestedValue
                                                              )
                                                            ? nestedValue
                                                                .join(", ")
                                                                .replace(
                                                                  /_/g,
                                                                  " "
                                                                )
                                                            : (nestedValue
                                                                ?.toString()
                                                                .replace(
                                                                  /_/g,
                                                                  " "
                                                                )
                                                                .replace(
                                                                  /([a-z])([A-Z])/g,
                                                                  "$1 $2"
                                                                ) ??
                                                              "Not specified")}
                                                    </span>
                                                  </div>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        )
                                      ) : typeof subValue === "boolean" ? (
                                        <span
                                          className={`rounded px-2 py-1 text-xs font-medium ${
                                            subValue
                                              ? "bg-green-100 text-green-800"
                                              : "bg-red-100 text-red-800"
                                          }`}
                                        >
                                          {subValue ? "Yes" : "No"}
                                        </span>
                                      ) : typeof subValue === "number" ? (
                                        <span className="font-mono text-brown">
                                          {subValue.toLocaleString()}
                                        </span>
                                      ) : // Special formatting for price rationale
                                      subKey === "price_rationale" &&
                                        typeof subValue === "string" ? (
                                        <div className="space-y-2">
                                          {subValue
                                            .split(". ")
                                            .filter(
                                              (sentence) =>
                                                sentence.trim().length > 0
                                            )
                                            .map((sentence, idx) => (
                                              <div
                                                key={idx}
                                                className="flex items-start gap-2"
                                              >
                                                <span className="flex h-5 flex-shrink-0 items-center text-brown mt-1">
                                                  <span className="h-px w-2 bg-brown"></span>
                                                </span>
                                                <span className="text-responsive-sm text-navy/80 leading-relaxed">
                                                  {sentence.trim()}
                                                  {!sentence.endsWith(".") &&
                                                    "."}
                                                </span>
                                              </div>
                                            ))}
                                        </div>
                                      ) : (
                                        <p className="leading-relaxed">
                                          {subValue &&
                                          typeof subValue === "string"
                                            ? subValue
                                                .replace(/_/g, " ")
                                                .replace(
                                                  /([a-z])([A-Z])/g,
                                                  "$1 $2"
                                                )
                                            : subValue &&
                                                typeof subValue === "number"
                                              ? subValue
                                                  .toString()
                                                  .replace(/_/g, " ")
                                                  .replace(
                                                    /([a-z])([A-Z])/g,
                                                    "$1 $2"
                                                  )
                                              : "Not specified"}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                      } else if (typeof val === "boolean") {
                        return (
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-medium ${
                              val
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {val ? "Yes" : "No"}
                          </span>
                        );
                      } else if (typeof val === "number") {
                        return (
                          <span className="font-mono text-lg font-semibold text-brown">
                            {val.toLocaleString()}
                          </span>
                        );
                      } else {
                        return (
                          <p className="leading-relaxed text-navy/80">
                            {String(val)
                              .replace(/_/g, " ")
                              .replace(/([a-z])([A-Z])/g, "$1 $2")}
                          </p>
                        );
                      }
                    };

                    const formattedValue = formatValue(value);

                    return (
                      <SectionBox key={key}>
                        {/* Add share button to the first card */}
                        {index === 0 && (
                          <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4">
                            <div className="flex items-center gap-3">
                              <img
                                src="/minilogo.png"
                                alt="SilverKey"
                                className="h-8 w-8 object-contain"
                              />
                            </div>
                            <div className="gap-responsive-sm flex">
                              <Button
                                variant="olive"
                                size="sm"
                                onClick={handleShareJson}
                                icon={<Share2 className="mobile-icon-xs" />}
                              >
                                Share
                              </Button>
                            </div>
                          </div>
                        )}
                        <div className="text-navy/80">
                          {typeof formattedValue === "string" ? (
                            <p className="text-sm leading-relaxed">
                              {formattedValue}
                            </p>
                          ) : (
                            <div>{formattedValue}</div>
                          )}
                        </div>
                      </SectionBox>
                    );
                  })
              : null}
          </div>
        )}
      </div>
    </div>
  );
}
