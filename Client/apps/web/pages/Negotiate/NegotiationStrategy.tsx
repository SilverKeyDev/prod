import { Lightbulb, Home, Download, Share2 } from "lucide-react";

import { CardCarousel } from "../../components/cards/base";
import CompCard from "../../components/cards/CompCard";
import { AlignedRow } from "../../components/layout";
import { FavoriteHomesDropdown, Loading, Button } from "../../components/ui";
import { useNegotiation } from "../../../../packages/contexts";
import { SectionBox, SectionTitle } from "../../features/negotiate";

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
    isLoading: isLoadingState,
    error,
    setSelectedHome,
    setStrategyData,
    setLoading,
    setError,
  } = useNegotiation();

  // Create handler functions
  const handleHomeSelection = (home: unknown) => {
    // Type assertion to match the negotiation store's SavedHome type
    setSelectedHome(
      home as
        | import("../../../../packages/store/negotiation.slice").SavedHome
        | null,
    );
  };

  const handleGenerate = async () => {
    if (!selectedHome) return;

    setLoading(true);
    setError(null);

    try {
      // TODO: Implement actual strategy generation logic
      // This would typically call an API service
      console.log("Generating strategy for:", selectedHome);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock data for now
      setStrategyData({
        marketAnalysis: "Market conditions are favorable for negotiation",
        recommendedOffer: "Consider offering 5-10% below asking price",
        negotiationPoints: [
          "Property has been on market for 45+ days",
          "Recent comparable sales support lower valuation",
          "Minor repairs needed could be negotiation leverage",
        ],
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate strategy",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadJson = () => {
    if (!strategyData) return;

    const dataStr = JSON.stringify(strategyData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "negotiation-strategy.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShareJson = async () => {
    if (!strategyData) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Negotiation Strategy",
          text: "Check out this negotiation strategy",
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          JSON.stringify(strategyData, null, 2),
        );
        alert("Strategy data copied to clipboard!");
      }
    } catch (err) {
      console.error("Failed to share:", err);
    }
  };

  // Explicitly type the loading state
  const isLoading: boolean = Boolean(isLoadingState);

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
              size="md"
              loading={isLoading}
              icon={<Lightbulb className="mobile-icon-sm" />}
              onClick={handleGenerate}
              disabled={!selectedHome || isLoading}
              className="h-full whitespace-nowrap"
            >
              Generate Generate
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
                    "Generating your personalized negotiation strategy..."
                  }
                />
              </div>
            </SectionBox>
          )) as any
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
              <CardCarousel
                items={
                  Array.isArray(
                    (compsData as { data?: { comps?: unknown } })?.data?.comps,
                  )
                    ? ((compsData as { data: { comps: unknown[] } }).data
                        .comps as unknown[])
                    : ([] as unknown[])
                }
                loading={false}
                error={null}
                emptyMessage="No comparable properties found"
                renderItem={(comp) =>
                  comp && typeof comp === "object" ? (
                    <CompCard
                      comp={
                        comp as unknown as import("../../components/cards/CompCard").CompData
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
              ? Object.entries(strategyData as Record<string, unknown>).map(
                  ([key, value], index) => {
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

                    // Format the value for display with better styling - NO JSON
                    const formatValue = (
                      val: unknown,
                    ): JSX.Element | string | null => {
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
                                  <span className="text-brown">•</span>
                                  <span>
                                    {typeof item === "object" && item !== null
                                      ? // Handle objects properly - extract meaningful content
                                        Object.entries(
                                          item as Record<string, unknown>,
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
                                              word.slice(1).toLowerCase(),
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
                                      word.slice(1),
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
                                                <span className="text-brown">
                                                  •
                                                </span>
                                                <span>
                                                  {typeof item === "object"
                                                    ? Object.entries(
                                                        item as Record<
                                                          string,
                                                          unknown
                                                        >,
                                                      )
                                                        .map(
                                                          ([k, v]) =>
                                                            `${k.replace(/_/g, " ")}: ${String(v)}`,
                                                        )
                                                        .join(", ")
                                                    : String(item)
                                                        .replace(/_/g, " ")
                                                        .replace(
                                                          /([a-z])([A-Z])/g,
                                                          "$1 $2",
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
                                              >,
                                            ).map(
                                              ([nestedKey, nestedValue]) => (
                                                <div
                                                  key={nestedKey}
                                                  className="text-responsive-xs flex items-start gap-2"
                                                >
                                                  <span className="text-brown">
                                                    •
                                                  </span>
                                                  <div className="flex-1">
                                                    <span className="font-medium">
                                                      {nestedKey
                                                        .replace(/_/g, " ")
                                                        .replace(
                                                          /([a-z])([A-Z])/g,
                                                          "$1 $2",
                                                        )
                                                        .split(" ")
                                                        .map(
                                                          (word) =>
                                                            word
                                                              .charAt(0)
                                                              .toUpperCase() +
                                                            word.slice(1),
                                                        )
                                                        .join(" ")}
                                                      :
                                                    </span>{" "}
                                                    <span>
                                                      {typeof nestedValue ===
                                                      "boolean"
                                                        ? nestedValue
                                                          ? "Yes"
                                                          : "No"
                                                        : typeof nestedValue ===
                                                            "number"
                                                          ? nestedValue.toLocaleString()
                                                          : Array.isArray(
                                                                nestedValue,
                                                              )
                                                            ? nestedValue
                                                                .join(", ")
                                                                .replace(
                                                                  /_/g,
                                                                  " ",
                                                                )
                                                            : (nestedValue
                                                                ?.toString()
                                                                .replace(
                                                                  /_/g,
                                                                  " ",
                                                                )
                                                                .replace(
                                                                  /([a-z])([A-Z])/g,
                                                                  "$1 $2",
                                                                ) ??
                                                              "Not specified")}
                                                    </span>
                                                  </div>
                                                </div>
                                              ),
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
                                        <span>{subValue.toLocaleString()}</span>
                                      ) : (
                                        <p className="leading-relaxed">
                                          {subValue &&
                                          typeof subValue === "string"
                                            ? subValue
                                                .replace(/_/g, " ")
                                                .replace(
                                                  /([a-z])([A-Z])/g,
                                                  "$1 $2",
                                                )
                                            : subValue &&
                                                typeof subValue === "number"
                                              ? subValue
                                                  .toString()
                                                  .replace(/_/g, " ")
                                                  .replace(
                                                    /([a-z])([A-Z])/g,
                                                    "$1 $2",
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
                        return <span>{val.toLocaleString()}</span>;
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
                        {/* Add download/share buttons to the first card */}
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
                                variant="primary"
                                size="sm"
                                onClick={handleDownloadJson}
                                icon={<Download className="mobile-icon-xs" />}
                                className="bg-brown hover:bg-brown/90"
                              >
                                Download JSON
                              </Button>
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
                          ) : formattedValue ? (
                            <div>{formattedValue}</div>
                          ) : null}
                        </div>
                      </SectionBox>
                    );
                  },
                )
              : null}
          </div>
        )}
      </div>
    </div>
  );
}
