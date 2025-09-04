import { Lightbulb, Home, Download, Share2 } from "lucide-react";
import FavoriteHomesDropdown from "../../components/ui/base/FavoriteHomesDropdown";
import Loading from "../../components/ui/base/Loading";
import KeyTurnLoader from "../../components/ui/base/KeyTurnLoader";
import Card from "../../components/ui/base/Card";
import { CardCarousel } from "../../components/cards/base";
import CompCard, { CompData } from "../../components/cards/CompCard";
import { useNegotiation } from "../../context/NegotiationContext";

const sectionBox =
  "bg-white rounded-xl shadow-sm p-6 mb-6 border border-beige/40";
const sectionTitle =
  "text-lg font-semibold text-navy flex items-center gap-3 mb-4";
const label = "block text-navy font-medium mb-2";
const button =
  "bg-olive text-white px-6 py-3 rounded-lg font-semibold hover:bg-olive-light transition-colors duration-200 flex items-center gap-2";

export default function NegotiationStrategy() {
  const {
    selectedHome,
    strategyData,
    compsData,
    isLoading,
    error,
    handleHomeSelection,
    handleGenerate,
    handleDownloadJson,
    handleShareJson,
  } = useNegotiation();


  return (
    <div>

      {/* Main Content */}
      <div>
        {/* Home selector */}
        <div className={sectionBox}>
          <div className={sectionTitle}>
            <Home className="mobile-icon-sm text-brown" />
            Select a Home
          </div>
          <label className={label}>Choose from Your Favorite Homes</label>

          <div className="flex items-stretch gap-responsive-sm">
            <div className="flex-1 min-w-0">
              <FavoriteHomesDropdown
                selectedHome={selectedHome}
                onHomeSelect={handleHomeSelection}
                placeholder="Select a favorite home for strategy generation"
              />
            </div>
            <div className="flex-shrink-0">
              <button
                type="button"
                className={`${button} h-full whitespace-nowrap ${
                  isLoading || !selectedHome
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={handleGenerate}
                disabled={!selectedHome || isLoading}
              >
                {isLoading ? (
                  <KeyTurnLoader message="Generating Strategy..." />
                ) : (
                  <>
                    <Lightbulb className="mobile-icon-sm" />
                    <span className="hidden sm:inline">Generate Strategy</span>
                    <span className="sm:hidden">Generate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className={sectionBox}>
            <div className="flex justify-center">
              <Loading message="Generating your personalized negotiation strategy..." />
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className={`${sectionBox} border-red-200 bg-red-50`}>
            <div className="text-red-600 text-center text-responsive-sm">
              <p className="font-semibold mb-2">Error Generating Strategy</p>
              <p className="text-responsive-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Property Comparables CardCarousel */}
        {compsData &&
          compsData.success &&
          compsData.data?.comps &&
          !isLoading && (
            <div className="my-responsive-lg">
              <CardCarousel
                items={compsData.data.comps as CompData[]}
                loading={false}
                error={null}
                emptyMessage="No comparable properties found"
                renderItem={(comp) => <CompCard comp={comp} />}
                getItemKey={(comp) => comp.zpid.toString()}
                minCardWidth={280}
                maxCardWidth={380}
              />
            </div>
          )}

        {/* Property Comps Debug JSON (fallback) */}
        {compsData &&
          (!compsData.success || !compsData.data?.comps) &&
          !isLoading && (
            <div className={sectionBox}>
              <div className={sectionTitle}>
                <Home className="mobile-icon-sm text-brown" />
                Property Comparables - Debug Response
              </div>
              <div className="bg-gray-900 text-green-400 space-responsive-sm rounded-lg overflow-auto max-h-96 font-mono text-responsive-sm">
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(compsData, null, 2)}
                </pre>
              </div>
            </div>
          )}

        {/* Strategy output - Dynamic display of all AI fields */}
        {strategyData && !isLoading && (
          <div className="space-y-responsive-md">
            {/* Header with Download and Share buttons wrapped in Card */}
            <Card padding="md" shadow="sm" hover={false}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img 
                    src="/minilogo.png" 
                    alt="SilverKey" 
                    className="w-8 h-8 object-contain"
                  />
                  <h2 className="text-responsive-lg font-semibold text-navy">
                    Your Negotiation Strategy
                  </h2>
                </div>
                <div className="flex gap-responsive-sm">
                  <button
                    onClick={handleDownloadJson}
                    className="bg-brown text-white px-responsive-sm py-responsive-xs rounded-lg font-medium hover:bg-brown/90 transition-colors duration-200 flex items-center gap-responsive-xs touch-friendly"
                  >
                    <Download className="mobile-icon-xs" />
                    Download JSON
                  </button>
                  <button
                    onClick={handleShareJson}
                    className="bg-olive text-white px-responsive-sm py-responsive-xs rounded-lg font-medium hover:bg-olive-light transition-colors duration-200 flex items-center gap-responsive-xs touch-friendly"
                  >
                    <Share2 className="mobile-icon-xs" />
                    Share
                  </button>
                </div>
              </div>
            </Card>
            {Object.entries(strategyData).map(([key, value]) => {
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
              const formatValue = (val: any): JSX.Element | string => {
                if (typeof val === "object" && val !== null) {
                  if (Array.isArray(val)) {
                    // Format arrays as clean bullet points with modern styling
                    return (
                      <ul className="space-y-2 ml-2">
                        {val.map((item, idx) => (
                          <li
                            key={idx}
                            className="text-responsive-sm text-navy/80 flex items-start gap-2"
                          >
                            <span className="text-brown flex-shrink-0 flex items-center h-5">
                              <span className="w-2 h-px bg-brown"></span>
                            </span>
                            <span>
                            {typeof item === "object" && item !== null
                              ? // Handle objects properly - extract meaningful content
                                Object.entries(item)
                                  .map(([k, v]) => `${k}: ${v}`)
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
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ");

                          return (
                            <div
                              key={subKey}
                              className="bg-gray-50/50 rounded-lg p-3 border-l-4 border-brown/30"
                            >
                              <div className="text-responsive-sm font-semibold text-brown mb-2">
                                {formattedKey}
                              </div>
                              <div className="text-responsive-sm text-navy/80">
                                {typeof subValue === "object" &&
                                subValue !== null ? (
                                  Array.isArray(subValue) ? (
                                    <ul className="space-y-2 ml-2">
                                      {subValue.map((item, idx) => (
                                        <li
                                          key={idx}
                                          className="text-responsive-sm flex items-start gap-2"
                                        >
                                          <span className="text-brown flex-shrink-0 flex items-center h-5">
                                            <span className="w-2 h-px bg-brown"></span>
                                          </span>
                                          <span>
                                          {typeof item === "object"
                                            ? Object.entries(item)
                                                .map(
                                                  ([k, v]) =>
                                                    `${k.replace(
                                                      /_/g,
                                                      " "
                                                    )}: ${v}`
                                                )
                                                .join(", ")
                                            : item
                                                .toString()
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
                                      {Object.entries(subValue).map(
                                        ([nestedKey, nestedValue]) => (
                                          <div
                                            key={nestedKey}
                                            className="text-responsive-xs flex items-start gap-2"
                                          >
                                            <span className="text-brown flex-shrink-0 flex items-center h-5">
                                              <span className="w-2 h-px bg-brown"></span>
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
                                              {typeof nestedValue === "boolean"
                                                ? nestedValue
                                                  ? "Yes"
                                                  : "No"
                                                : typeof nestedValue ===
                                                  "number"
                                                ? nestedValue.toLocaleString()
                                                : Array.isArray(nestedValue)
                                                ? nestedValue
                                                    .join(", ")
                                                    .replace(/_/g, " ")
                                                : nestedValue
                                                    ?.toString()
                                                    .replace(/_/g, " ")
                                                    .replace(
                                                      /([a-z])([A-Z])/g,
                                                      "$1 $2"
                                                    ) || "Not specified"}
                                              </span>
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )
                                ) : typeof subValue === "boolean" ? (
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
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
                                ) : (
                                  <p className="leading-relaxed">
                                    {subValue
                                      ?.toString()
                                      .replace(/_/g, " ")
                                      .replace(/([a-z])([A-Z])/g, "$1 $2") ||
                                      "Not specified"}
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
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
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
                    <span className="font-mono text-lg text-brown font-semibold">
                      {val.toLocaleString()}
                    </span>
                  );
                } else {
                  return (
                    <p className="leading-relaxed text-navy/80">
                      {val
                        .toString()
                        .replace(/_/g, " ")
                        .replace(/([a-z])([A-Z])/g, "$1 $2")}
                    </p>
                  );
                }
              };

              const formattedValue = formatValue(value);

              return (
                <div key={key} className={sectionBox}>
                  <div className="text-navy/80">
                    {typeof formattedValue === "string" ? (
                      <p className="text-sm leading-relaxed">
                        {formattedValue}
                      </p>
                    ) : (
                      <div>{formattedValue}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
