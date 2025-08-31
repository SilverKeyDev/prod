import { useState, useEffect } from "react";
import { Lightbulb, Home, Download, Share2 } from "lucide-react";
import FavoriteHomesDropdown from "../../components/ui/base/FavoriteHomesDropdown";
import Loading from "../../components/ui/base/Loading";
import KeyTurnLoader from "../../components/ui/base/KeyTurnLoader";
import { CardCarousel } from "../../components/cards/base";
import CompCard, { CompData } from "../../components/cards/CompCard";

const sectionBox =
  "bg-white rounded-xl shadow-sm p-6 mb-6 border border-beige/40";
const sectionTitle =
  "text-lg font-semibold text-navy flex items-center gap-3 mb-4";
const label = "block text-navy font-medium mb-2";
const button =
  "bg-olive text-white px-6 py-3 rounded-lg font-semibold hover:bg-olive-light transition-colors duration-200 flex items-center gap-2";

export default function NegotiationStrategy() {
  const [selectedHome, setSelectedHome] = useState<any>(null);
  const [strategyData, setStrategyData] = useState<any>(null);
  const [compsData, setCompsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedStrategy = localStorage.getItem("negotiationStrategy");
    const savedHome = localStorage.getItem("negotiationSelectedHome");
    const savedComps = localStorage.getItem("negotiationComps");

    if (savedStrategy) {
      try {
        const parsedStrategy = JSON.parse(savedStrategy);
        setStrategyData(parsedStrategy);
      } catch (error) {
        console.error(
          "❌ [NEGOTIATION] Failed to parse saved strategy data:",
          error
        );
        localStorage.removeItem("negotiationStrategy");
      }
    }
    if (savedHome) {
      try {
        const parsedHome = JSON.parse(savedHome);
        setSelectedHome(parsedHome);
      } catch (error) {
        console.error(
          "❌ [NEGOTIATION] Failed to parse saved home data:",
          error
        );
        localStorage.removeItem("negotiationSelectedHome");
      }
    }

    if (savedComps) {
      try {
        const parsedComps = JSON.parse(savedComps);
        setCompsData(parsedComps);
      } catch (error) {
        console.error(
          "❌ [NEGOTIATION] Failed to parse saved comps data:",
          error
        );
        localStorage.removeItem("negotiationComps");
      }
    }
  }, []);

  const handleGenerate = async () => {
    if (!selectedHome) return;

    setIsLoading(true);
    setError(null);
    setStrategyData(null);
    setCompsData(null);

    try {
      // Get authentication token
      const idToken = localStorage.getItem("id_token");
      if (!idToken) {
        throw new Error("Authentication required. Please log in.");
      }
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const address =
        selectedHome.address ||
        selectedHome.full_address ||
        selectedHome.location;

      // Make both API calls concurrently
      const [strategyRes, compsRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/offer/generate-strategy`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            address: address,
          }),
        }),
        fetch(
          `${baseUrl}/api/v1/search/propertyComps?address=${encodeURIComponent(
            address
          )}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
          }
        ),
      ]);

      const [strategyResponseData, compsResponseData] = await Promise.all([
        strategyRes.json(),
        compsRes.json(),
      ]);

      // Check strategy response
      if (!strategyRes.ok) {
        throw new Error(
          strategyResponseData.error ||
            `Strategy API error! status: ${strategyRes.status}`
        );
      }

      if (!strategyResponseData.success) {
        throw new Error(
          strategyResponseData.error || "Failed to generate strategy"
        );
      }

      // Check comps response (log but don't fail if comps fails)
      if (!compsRes.ok) {
        console.warn(
          "Property comps API failed:",
          compsRes.status,
          compsResponseData
        );
      }

      // Parse the strategy data from the AI response
      const parsedStrategyData = strategyResponseData.strategy;

      // Store the complete strategy data from the AI response
      // This will display ALL fields returned by the AI
      setStrategyData(parsedStrategyData || {});

      // Store the property comps data
      setCompsData(compsResponseData || {});

      // Save strategy data, comps data, and selected home to localStorage
      localStorage.setItem(
        "negotiationStrategy",
        JSON.stringify(parsedStrategyData || {})
      );
      localStorage.setItem(
        "negotiationComps",
        JSON.stringify(compsResponseData || {})
      );
      localStorage.setItem(
        "negotiationSelectedHome",
        JSON.stringify(selectedHome)
      );
    } catch (err) {
      console.error("Error generating negotiation strategy:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate strategy. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle home selection from dropdown
  const handleHomeSelection = (home: any) => {
    setSelectedHome(home);
    setStrategyData(null); // Reset strategy when home changes
    setCompsData(null); // Reset comps when home changes

    // Save the newly selected home to localStorage
    localStorage.setItem("negotiationSelectedHome", JSON.stringify(home));

    // Clear saved strategy and comps since we're selecting a different home
    localStorage.removeItem("negotiationStrategy");
    localStorage.removeItem("negotiationComps");
  };

  // Handle JSON download
  const handleDownloadJson = () => {
    if (!strategyData) return;

    const dataStr = JSON.stringify(strategyData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `negotiation-strategy-${
      selectedHome?.address?.replace(/[^a-zA-Z0-9]/g, "-") || "strategy"
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle JSON sharing
  const handleShareJson = async () => {
    if (!strategyData) return;

    const dataStr = JSON.stringify(strategyData, null, 2);

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Negotiation Strategy",
          text: `Negotiation strategy for ${
            selectedHome?.address || "property"
          }`,
          files: [
            new File([dataStr], "negotiation-strategy.json", {
              type: "application/json",
            }),
          ],
        });
      } catch (err) {
        // Fallback to clipboard
        handleCopyToClipboard(dataStr);
      }
    } else {
      // Fallback for browsers without Web Share API
      handleCopyToClipboard(dataStr);
    }
  };

  // Fallback function to copy JSON to clipboard
  const handleCopyToClipboard = async (dataStr: string) => {
    try {
      await navigator.clipboard.writeText(dataStr);
      alert("Strategy JSON copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      alert("Failed to share. Please try downloading instead.");
    }
  };

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
                className={`${button} h-full btn-responsive-md whitespace-nowrap ${
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
              <button
                onClick={() => setError(null)}
                className="mt-3 text-red-500 hover:text-red-700 underline text-responsive-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Property Comparables CardCarousel */}
        {compsData &&
          compsData.success &&
          compsData.data?.comps &&
          !isLoading && (
            <div className="my-responsive-lg">
              <div className={sectionTitle}>
                <Home className="mobile-icon-sm text-brown" />
                Property Comparables
              </div>
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
            {/* Header with Download and Share buttons */}
            <div className="flex justify-between items-center space-y-responsive-md">
              <h2 className="text-responsive-lg font-semibold text-navy">
                Your Negotiation Strategy
              </h2>
              <div className="flex gap-responsive-sm">
                <button
                  onClick={() => handleDownloadJson()}
                  className="bg-brown text-white px-responsive-sm py-responsive-xs rounded-lg font-medium hover:bg-brown/90 transition-colors duration-200 flex items-center gap-responsive-xs touch-friendly"
                >
                  <Download className="mobile-icon-xs" />
                  Download JSON
                </button>
                <button
                  onClick={() => handleShareJson()}
                  className="bg-olive text-white px-responsive-sm py-responsive-xs rounded-lg font-medium hover:bg-olive-light transition-colors duration-200 flex items-center gap-responsive-xs touch-friendly"
                >
                  <Share2 className="mobile-icon-xs" />
                  Share
                </button>
              </div>
            </div>
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
                    // Format arrays as clean bullet points
                    return (
                      <ul className="list-disc list-inside space-y-responsive-xs ml-2">
                        {val.map((item, idx) => (
                          <li
                            key={idx}
                            className="text-responsive-sm text-navy/80"
                          >
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
                          </li>
                        ))}
                      </ul>
                    );
                  } else {
                    // For objects, create clean structured display without JSON
                    return (
                      <div className="space-y-responsive-sm">
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
                              className="bg-gray-50/50 rounded-lg space-responsive-sm border-l-4 border-brown/30"
                            >
                              <div className="text-responsive-sm font-semibold text-brown space-y-responsive-xs">
                                {formattedKey}
                              </div>
                              <div className="text-responsive-sm text-navy/80">
                                {typeof subValue === "object" &&
                                subValue !== null ? (
                                  Array.isArray(subValue) ? (
                                    <ul className="list-disc list-inside space-y-responsive-xs ml-2">
                                      {subValue.map((item, idx) => (
                                        <li
                                          key={idx}
                                          className="text-responsive-sm"
                                        >
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
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    // Nested objects - display as key-value pairs
                                    <div className="space-y-responsive-xs">
                                      {Object.entries(subValue).map(
                                        ([nestedKey, nestedValue]) => (
                                          <div
                                            key={nestedKey}
                                            className="text-responsive-xs bg-white/70 space-responsive-xs rounded"
                                          >
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
