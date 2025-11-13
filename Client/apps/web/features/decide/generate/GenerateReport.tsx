export {};

import { MapPin, AlertCircle, Lightbulb } from "lucide-react";
import React, { useState, useEffect, useRef, useCallback } from "react";

import { Card } from "../../../components/layout";
import { Input, Button } from "../../../components/ui";
import { reportApi } from "../../../../../packages/config/api";
import type { GenerateReportRequest } from "../../../../../packages/config/api/report";
import { useUser } from "../../../../../packages/contexts";
import { useGoogleMaps } from "../../../../../packages/hooks/data/useGoogleMaps";
import { asError } from "../../../../../packages/utils/error";

// Google Maps types are handled by the useGoogleMaps hook

// Google Places API types
interface GooglePlacePrediction {
  text: {
    text: string;
  };
  toPlace: () => Place;
}

type PlacePrediction = GooglePlacePrediction;

type Place = {
  fetchFields: (options: { fields: string[] }) => Promise<{ place: Place }>;
  formattedAddress?: string | null;
};

type Suggestion = {
  description: string;
  placePrediction: PlacePrediction;
};

// Google Maps API types are handled by the vite-env.d.ts file
// The AutocompleteSuggestion interface is available through the google.maps types

// Removed CustomDropdown; switching to inline toggle for comparison mode

type GenerateReportPageProps = {
  onReportGenerated?: (documentId: string) => void;
};

export default function GenerateReportPage({
  onReportGenerated,
}: GenerateReportPageProps = {}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const comparisonInputRef = useRef<HTMLInputElement | null>(null);

  const { userProfile } = useUser();

  const [address, setAddress] = useState("");
  const [comparisonAddress, setComparisonAddress] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [comparisonSuggestions, setComparisonSuggestions] = useState<
    Suggestion[]
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptsReady, setScriptsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasSelected, setHasSelected] = useState(false);
  const [hasSelectedComparison, setHasSelectedComparison] = useState(false);
  const [reportType, setReportType] = useState("detailed");
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const isComparison = reportType === "comparison";

  // Load generate report state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("generateReportState");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState) as {
          address?: string;
          comparisonAddress?: string;
          reportType?: string;
        };
        if (parsed.address) {
          setAddress(parsed.address);
          setHasSelected(true);
        }
        if (parsed.comparisonAddress) {
          setComparisonAddress(parsed.comparisonAddress);
          setHasSelectedComparison(true);
        }
        if (parsed.reportType) {
          setReportType(parsed.reportType);
        }
      } catch {
        console.warn("Invalid generate report state data");
      }
    }
  }, []);

  // Save generate report state to localStorage when it changes
  useEffect(() => {
    const stateToSave = {
      address,
      comparisonAddress,
      reportType,
      selectedClientId,
    };
    localStorage.setItem("generateReportState", JSON.stringify(stateToSave));
  }, [address, comparisonAddress, reportType, selectedClientId]);

  // report type controlled by toggle (comparison on/off)

  // Set default client selection to agent themselves
  useEffect(() => {
    if (userProfile?.is_agent && userProfile.id && !selectedClientId) {
      setSelectedClientId(userProfile.id);
    }
  }, [userProfile?.is_agent, userProfile?.id, selectedClientId]);

  // Use centralized Google Maps loading
  const { isLoaded: googleMapsLoaded, error: googleMapsError } =
    useGoogleMaps();

  // Update scriptsReady based on centralized Google Maps loading
  useEffect(() => {
    if (googleMapsError) {
      console.error("❌ Google Maps loading error:", googleMapsError);
      setLoadError("Failed to load Google Maps script.");
      return;
    }

    if (googleMapsLoaded && window.google?.maps?.places) {
      setScriptsReady(true);
    }
  }, [googleMapsLoaded, googleMapsError]);

  // Fetch autocomplete suggestions as the user types
  useEffect(() => {
    if (!scriptsReady || address.trim().length < 3 || hasSelected) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const sessionToken =
          new window.google.maps.places.AutocompleteSessionToken();
        const request = {
          input: address,
          sessionToken,
          includedRegionCodes: ["US"],
        };

        const { suggestions: fetched } =
          await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            request
          );

        const built: Suggestion[] = (
          fetched as Array<{ placePrediction: GooglePlacePrediction | null }>
        ).flatMap((s) => {
          const prediction = s.placePrediction;
          if (!prediction) return [];
          return [
            {
              description: prediction.text.text,
              // Coerce to the Suggestion's expected prediction type
              placePrediction:
                prediction as unknown as Suggestion["placePrediction"],
            },
          ];
        });
        setSuggestions(built);
      } catch (err: unknown) {
        const error = asError(err);
        console.error("Autocomplete fetch error:", error);
        setSuggestions([]);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(debounce);
  }, [address, scriptsReady, hasSelected]);

  // Fetch autocomplete suggestions for comparison address
  useEffect(() => {
    if (
      !scriptsReady ||
      comparisonAddress.trim().length < 3 ||
      hasSelectedComparison ||
      reportType !== "comparison"
    ) {
      setComparisonSuggestions([]);
      return;
    }

    const fetchComparisonSuggestions = async () => {
      try {
        const sessionToken =
          new window.google.maps.places.AutocompleteSessionToken();
        const request = {
          input: comparisonAddress,
          sessionToken,
          includedRegionCodes: ["US"],
        };

        const { suggestions: fetched } =
          await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            request
          );

        const built: Suggestion[] = (
          fetched as Array<{ placePrediction: GooglePlacePrediction | null }>
        ).flatMap((s) => {
          const prediction = s.placePrediction;
          if (!prediction) return [];
          return [
            {
              description: prediction.text.text,
              placePrediction:
                prediction as unknown as Suggestion["placePrediction"],
            },
          ];
        });
        setComparisonSuggestions(built);
      } catch (err: unknown) {
        const error = asError(err);
        console.error("Comparison autocomplete fetch error:", error);
        setComparisonSuggestions([]);
      }
    };

    const debounce = setTimeout(fetchComparisonSuggestions, 200);
    return () => clearTimeout(debounce);
  }, [comparisonAddress, scriptsReady, hasSelectedComparison, reportType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasSelected(false);
    setAddress(e.target.value);
    setError(null);
  };

  const handleComparisonInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setHasSelectedComparison(false);
    setComparisonAddress(e.target.value);
    setError(null);
  };

  const handleSelect = async (suggestion: Suggestion) => {
    setHasSelected(true);
    const place = suggestion.placePrediction.toPlace();
    await place.fetchFields({
      fields: ["displayName", "formattedAddress"],
    });
    setAddress(place.formattedAddress ?? "");
    setSuggestions([]);
  };

  const handleComparisonSelect = async (suggestion: Suggestion) => {
    setHasSelectedComparison(true);
    const place = suggestion.placePrediction.toPlace();
    await place.fetchFields({
      fields: ["displayName", "formattedAddress"],
    });
    setComparisonAddress(place.formattedAddress ?? "");
    setComparisonSuggestions([]);
  };

  // Start auto-refresh after report generation
  const startAutoRefresh = useCallback(
    (documentId: string) => {
      console.log(
        `[GenerateReport] Starting auto-refresh for document ID: ${documentId}`
      );

      // Try callback prop first (preferred method)
      if (onReportGenerated) {
        onReportGenerated(documentId);
        return;
      }

      // Fallback to window function (for mobile/DashboardLayout)
      const refreshFn = (
        window as unknown as {
          refreshReportsAfterGenerate?: () => Promise<unknown>;
        }
      ).refreshReportsAfterGenerate;

      if (refreshFn) {
        // Initial refresh after 0.5 seconds
        setTimeout(() => {
          console.log("[GenerateReport] Initial refresh after generation");
          void refreshFn();
        }, 500);

        // Set up periodic polling every 30 seconds for up to 10 minutes
        let pollCount = 0;
        const maxPolls = 20; // 20 * 30s = 10 minutes
        const pollInterval = setInterval(() => {
          pollCount++;
          console.log(
            `[GenerateReport] Periodic refresh ${pollCount}/${maxPolls}`
          );
          void refreshFn();

          if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            console.log("[GenerateReport] Stopping periodic refresh");
          }
        }, 30000); // 30 seconds
      } else {
        console.warn(
          "[GenerateReport] No refresh function available (prop or window)"
        );
      }
    },
    [onReportGenerated]
  );

  // Start polling for report completion using PastReports polling function
  const setupReportCompletionListener = (documentId: string) => {
    try {
      // Try to call the polling function from PastReports
      if (
        (
          window as unknown as {
            pollForReportCompletion?: (id: string) => void;
          }
        ).pollForReportCompletion
      ) {
        try {
          (
            window as unknown as {
              pollForReportCompletion: (id: string) => void;
            }
          ).pollForReportCompletion(documentId);
        } catch (pollingError: unknown) {
          const error = asError(pollingError);
          console.error(
            `[GenerateReport] ❌ Error calling polling function:`,
            error
          );
        }
      } else {
        // PastReports component might not be mounted yet, retry a few times
        let retryCount = 0;
        const maxRetries = 200; // Try for 10 seconds (20 * 500ms)

        const retryPolling = () => {
          retryCount++;

          try {
            if (
              (
                window as unknown as {
                  pollForReportCompletion?: (id: string) => void;
                }
              ).pollForReportCompletion
            ) {
              (
                window as unknown as {
                  pollForReportCompletion: (id: string) => void;
                }
              ).pollForReportCompletion(documentId);
            } else if (retryCount < maxRetries) {
              setTimeout(retryPolling, 500); // Retry every 500ms
            } else {
              console.error(
                `[GenerateReport] ❌ CRITICAL: Could not find PastReports polling function after ${maxRetries} retries (${
                  maxRetries * 500
                }ms). Report completion detection will NOT work!`
              );
              console.error(
                `[GenerateReport] ❌ This means the report will generate but the UI won't refresh automatically.`
              );
              console.error(
                `[GenerateReport] ❌ User will need to manually refresh the reports page.`
              );
            }
          } catch (retryError: unknown) {
            const error = asError(retryError);
            console.error(
              `[GenerateReport] ❌ Error during retry ${retryCount}:`,
              error
            );
            if (retryCount < maxRetries) {
              setTimeout(retryPolling, 500);
            }
          }
        };

        setTimeout(retryPolling, 500);
      }
    } catch (setupError: unknown) {
      const error = asError(setupError);
      console.error(
        `[GenerateReport] ❌ CRITICAL ERROR in setupReportCompletionListener:`,
        error
      );
      console.error(
        `[GenerateReport] ❌ Report polling will not work. Document ID: ${documentId}`
      );
    }
  };

  const handleGenerate = async () => {
    const trimmed = address.trim();
    if (!trimmed) {
      setError("Please enter a valid address.");
      return;
    }

    if (reportType === "comparison") {
      const trimmedComparison = comparisonAddress.trim();
      if (!trimmedComparison) {
        setError("Please enter a valid comparison address.");
        return;
      }
    }

    setIsGenerating(true);
    setError(null);

    const willSendUserId =
      userProfile?.is_agent &&
      selectedClientId &&
      selectedClientId !== userProfile?.id;

    try {
      // Use centralized API for report generation
      const requestData: GenerateReportRequest = {
        address,
        ...(reportType === "comparison" && {
          comparisonAddress,
        }),
        ...(willSendUserId && { user_id: selectedClientId }),
      };
      const data = await reportApi.generate(requestData);

      if (!data.success) {
        throw new Error(data.error ?? "Failed to generate report");
      }

      // Clear the input fields after successful generation
      setAddress("");
      setComparisonAddress("");
      setHasSelected(false);
      setHasSelectedComparison(false);

      // Set up listener for when report generation actually completes (~5 minutes)
      if (data.document_id) {
        setupReportCompletionListener(data.document_id);
        // Start auto-refresh of reports list
        startAutoRefresh(data.document_id);
      }
    } catch (err: unknown) {
      console.error(
        "❌ Report generation error:",
        err instanceof Error ? err.message : err
      );
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate report. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const isButtonDisabled =
    isGenerating ||
    !address.trim() ||
    !hasSelected ||
    !!loadError ||
    (reportType === "comparison" &&
      (!comparisonAddress.trim() || !hasSelectedComparison)) ||
    (userProfile?.is_agent && !selectedClientId);

  return (
    <div className="w-full">
      <div className="w-full">
        <Card className="space-y-responsive-sm w-full">
          {/* Main input row - address input, generate button, and toggle on one line */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            {/* Address inputs container */}
            <div className="flex-1">
              <div className="relative space-y-3">
                <Input
                  id="address-input"
                  ref={inputRef}
                  type="text"
                  value={address}
                  onChange={handleInputChange}
                  placeholder={scriptsReady ? "Enter address..." : "Loading..."}
                  disabled={!scriptsReady || isGenerating}
                  leftIcon={<MapPin className="h-4 w-4 sm:h-5 sm:w-5" />}
                  size="md"
                  autoComplete="off"
                  className="touch-manipulation px-2 sm:px-3"
                />

                {/* Address suggestions dropdown */}
                {suggestions.length > 0 && (
                  <ul className="absolute z-50 max-h-60 w-full overflow-hidden overflow-y-auto rounded-md border bg-white shadow-lg">
                    {suggestions.map((s, idx) => (
                      <li
                        key={idx}
                        onClick={() => handleSelect(s)}
                        className="touch-friendly cursor-pointer border-b border-gray-100 px-3 py-3 text-sm last:border-b-0 hover:bg-gray-100 sm:px-4 sm:py-2 sm:text-base"
                      >
                        {s.description}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Comparison address input - always rendered but hidden when not in comparison mode */}
                <div className={isComparison ? "block" : "hidden"}>
                  <Input
                    id="comparison-address-input"
                    ref={comparisonInputRef}
                    type="text"
                    value={comparisonAddress}
                    onChange={handleComparisonInputChange}
                    placeholder={
                      scriptsReady
                        ? "Enter comparison address..."
                        : "Loading..."
                    }
                    disabled={!scriptsReady || isGenerating}
                    leftIcon={<MapPin className="h-4 w-4 sm:h-5 sm:w-5" />}
                    size="md"
                    autoComplete="off"
                    className="touch-manipulation px-2 sm:px-3"
                  />

                  {/* Comparison address suggestions dropdown */}
                  {comparisonSuggestions.length > 0 && (
                    <ul className="absolute z-50 max-h-60 w-full overflow-hidden overflow-y-auto rounded-md border bg-white shadow-lg">
                      {comparisonSuggestions.map((s, idx) => (
                        <li
                          key={idx}
                          onClick={() => handleComparisonSelect(s)}
                          className="touch-friendly cursor-pointer border-b border-gray-100 px-3 py-3 text-sm last:border-b-0 hover:bg-gray-100 sm:px-4 sm:py-2 sm:text-base"
                        >
                          {s.description}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Generate button and comparison toggle inline */}
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={handleGenerate}
                disabled={isButtonDisabled}
                loading={isGenerating}
                icon={<Lightbulb className="mobile-icon-sm" />}
                className="h-12 sm:h-14 px-4 text-xs sm:text-sm md:text-base leading-tight"
                variant="olive"
              >
                Generate
              </Button>

              {/* Comparison mode toggle */}
              {/* <div className="flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-black/70" />
                <OliveCheckbox
                  checked={isComparison}
                  onToggle={() =>
                    setReportType(isComparison ? "detailed" : "comparison")
                  }
                />
              </div> */}
            </div>
          </div>

          {/* Loading indicator */}
          {!scriptsReady && !loadError && (
            <div className="text-responsive-sm flex items-center text-black/60">
              <div className="mobile-icon-xs mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Loading address autocomplete...
            </div>
          )}

          {/* Error message */}
          {(error ?? loadError) && (
            <div className="flex items-start space-x-2 rounded-lg border border-red-200 bg-red-50 p-3 sm:space-x-3 sm:p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500 sm:h-5 sm:w-5" />
              <div className="text-red-700">
                <div className="text-sm font-medium sm:text-base">Error</div>
                <div className="text-xs sm:text-sm">{error ?? loadError}</div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
