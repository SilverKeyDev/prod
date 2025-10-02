export {};

import { MapPin, AlertCircle } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { Card } from "../../../components/layout";
import { Input, Toggle } from "../../../components/ui";
import KeyTurnLoader from "../../../components/ui/loading/KeyTurnLoader";
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
  formattedAddress: string;
};

type Suggestion = {
  description: string;
  placePrediction: PlacePrediction;
};

// Google Maps API types are handled by the vite-env.d.ts file
// The AutocompleteSuggestion interface is available through the google.maps types

// Removed CustomDropdown; switching to inline toggle for comparison mode

export default function GenerateReportPage() {
  const navigate = useNavigate();
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

        const built: Suggestion[] = fetched.flatMap(
          (s: { placePrediction?: GooglePlacePrediction }) => {
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
          }
        );
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

        const built: Suggestion[] = fetched.flatMap(
          (s: { placePrediction?: GooglePlacePrediction }) => {
            const prediction = s.placePrediction;
            if (!prediction) return [];
            return [
              {
                description: prediction.text.text,
                placePrediction:
                  prediction as unknown as Suggestion["placePrediction"],
              },
            ];
          }
        );
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
        const maxRetries = 20; // Try for 10 seconds (20 * 500ms)

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

      // Set up listener for when report generation actually completes (~5 minutes)
      if (data.document_id) {
        setupReportCompletionListener(data.document_id);
      }

      // Navigate after successful API call
      navigate("/dashboard/reports");
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
    <div>
      <div>
        <Card className="space-y-responsive-sm">
          {/* Main input row - address input, generate button, and toggle on one line */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            {/* Address input */}
            <div className="flex-1">
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
                className="touch-manipulation"
              />
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={isButtonDisabled}
              className={`min-h-12 flex-shrink-0 touch-manipulation rounded-lg px-4 py-3 text-base font-medium transition-all duration-200 sm:min-h-14 sm:px-6 sm:py-4 sm:text-lg ${
                isButtonDisabled
                  ? "cursor-not-allowed bg-gray-300 text-gray-500"
                  : "bg-olive text-white hover:bg-olive-light hover:shadow-lg active:scale-[0.98] active:transform"
              }`}
            >
              {isGenerating ? (
                <KeyTurnLoader message="Generating..." />
              ) : (
                <span>
                  {isComparison ? "Generate Comparison" : "Generate Report"}
                </span>
              )}
            </button>

            {/* Comparison mode toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-black/70 sm:text-sm">
                Comparison
              </span>
              <Toggle
                checked={isComparison}
                onChange={() =>
                  setReportType(isComparison ? "detailed" : "comparison")
                }
                size="sm"
              />
            </div>
          </div>

          {/* Address suggestions dropdown */}
          {suggestions.length > 0 && (
            <ul className="relative z-50 max-h-60 overflow-hidden overflow-y-auto rounded-md border bg-white shadow-sm">
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

          {/* Comparison address input - only shown when comparison mode is on */}
          {isComparison && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex-1">
                <Input
                  id="comparison-address-input"
                  ref={comparisonInputRef}
                  type="text"
                  value={comparisonAddress}
                  onChange={handleComparisonInputChange}
                  placeholder={
                    scriptsReady ? "Enter comparison address..." : "Loading..."
                  }
                  disabled={!scriptsReady || isGenerating}
                  leftIcon={<MapPin className="h-4 w-4 sm:h-5 sm:w-5" />}
                  size="md"
                  autoComplete="off"
                  className="touch-manipulation"
                />
              </div>
            </div>
          )}

          {/* Comparison address suggestions dropdown */}
          {comparisonSuggestions.length > 0 && (
            <ul className="relative z-50 max-h-60 overflow-hidden overflow-y-auto rounded-md border bg-white shadow-sm">
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
