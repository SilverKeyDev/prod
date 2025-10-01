export {};

import { MapPin, ChevronDown, AlertCircle } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { Card } from "../../components/layout";
import { Input } from "../../components/ui";
import KeyTurnLoader from "../../components/ui/loading/KeyTurnLoader";
import { reportApi } from "../../../../packages/config/api";
import type { GenerateReportRequest } from "../../../../packages/config/api/report";
import { useUser } from "../../../../packages/contexts";
import { useGoogleMaps } from "../../../../packages/hooks/data/useGoogleMaps";
import { asError } from "../../../../packages/utils/error";

// Google Maps types are handled by the useGoogleMaps hook

// Google Places API types
type PlacePrediction = {
  toPlace: () => Place;
  text: {
    text: string;
  };
};

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

type CustomDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  isOpen: boolean;
  onToggle: () => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
};

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder,
  isOpen,
  onToggle,
  dropdownRef,
}) => {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className="mobile-input text-responsive-sm flex w-full cursor-pointer items-center justify-between hover:border-brown focus:border-brown focus:ring-brown/20"
      >
        {selectedOption ? selectedOption.label : placeholder}

        <ChevronDown
          className={`mobile-icon-xs transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-beige bg-white shadow-lg">
          {options.map((option, index) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                onToggle();
              }}
              className={`px-responsive-sm py-responsive-xs text-responsive-sm w-full text-left transition-colors duration-150 hover:bg-brown/5 ${
                index === 0 ? "first:rounded-t-lg" : ""
              } ${index === options.length - 1 ? "last:rounded-b-lg" : ""} ${
                value === option.value
                  ? "bg-brown/10 font-medium text-brown"
                  : "text-black"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function GenerateReportPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const comparisonInputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

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

  const reportTypeOptions = [
    { value: "detailed", label: "Detailed Report" },
    { value: "comparison", label: "Comparison Report" },
    ...(userProfile?.is_agent
      ? [
          {
            value: "marketing",
            label: "Marketing Materials",
          },
        ]
      : []),
  ];

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
      void void setLoadError("Failed to load Google Maps script.");
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
            request,
          );

        const built: Suggestion[] = fetched.flatMap((s) => {
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

    const debounce = void void setTimeout(fetchSuggestions, 500);
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
            request,
          );

        const built: Suggestion[] = fetched.flatMap((s) => {
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

    const debounce = void void setTimeout(fetchComparisonSuggestions, 200);
    return () => clearTimeout(debounce);
  }, [comparisonAddress, scriptsReady, hasSelectedComparison, reportType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasSelected(false);
    setAddress(e.target.value);
    setError(null);
  };

  const handleComparisonInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
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
            error,
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
                }ms). Report completion detection will NOT work!`,
              );
              console.error(
                `[GenerateReport] ❌ This means the report will generate but the UI won't refresh automatically.`,
              );
              console.error(
                `[GenerateReport] ❌ User will need to manually refresh the reports page.`,
              );
            }
          } catch (retryError: unknown) {
            const error = asError(retryError);
            console.error(
              `[GenerateReport] ❌ Error during retry ${retryCount}:`,
              error,
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
        error,
      );
      console.error(
        `[GenerateReport] ❌ Report polling will not work. Document ID: ${documentId}`,
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
        err instanceof Error ? err.message : err,
      );
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate report. Please try again.",
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
          <div>
            <label
              htmlFor="report-type"
              className="mb-2 block text-sm font-medium text-black sm:mb-3 sm:text-lg"
            >
              Report Type
            </label>
            <CustomDropdown
              value={reportType}
              onChange={setReportType}
              options={reportTypeOptions}
              placeholder="Select report type"
              isOpen={isDropdownOpen}
              onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
              dropdownRef={dropdownRef}
            />
          </div>

          {reportType === "comparison" && (
            <div className="space-responsive-sm rounded-lg border border-olive/30 bg-olive/10">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="text-olive">
                  <div className="mb-1 text-sm font-medium sm:text-base">
                    Comparison Report
                  </div>
                  <div className="text-xs sm:text-sm">
                    Compare two properties side-by-side with detailed analysis
                    of neighborhoods, amenities, market trends, and key
                    differences to help you make an informed decision.
                  </div>
                </div>
              </div>
            </div>
          )}

          {reportType === "marketing" && (
            <div className="space-responsive-sm rounded-lg border border-gold/30 bg-gold/10">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="text-gold">
                  <div className="mb-1 text-sm font-medium sm:text-base">
                    Marketing Material
                  </div>
                  <div className="text-xs sm:text-sm">
                    Generate personalized marketing materials tailored to your
                    client's specific preferences and needs. This report
                    leverages your client's demographic data, lifestyle
                    preferences, and real estate criteria to create compelling
                    property descriptions, targeted market insights, and
                    customized selling points that resonate with their unique
                    situation and decision-making factors.
                  </div>
                </div>
              </div>
            </div>
          )}

          {reportType === "detailed" && (
            <div className="space-responsive-sm rounded-lg border border-brown/30 bg-brown/10">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="text-brown">
                  <div className="mb-1 text-sm font-medium sm:text-base">
                    Detailed Report
                  </div>
                  <div className="text-xs sm:text-sm">
                    Generate a comprehensive neighborhood analysis with detailed
                    insights into demographics, safety, amenities, schools,
                    transportation, and lifestyle factors. This personalized
                    report is tailored to your specific preferences and
                    priorities, providing in-depth information to help you make
                    an informed decision about the property and area.
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="address-input"
              className="mb-2 block text-sm font-medium text-black sm:mb-3 sm:text-lg"
            >
              {reportType === "comparison"
                ? "First Property Address"
                : "Property Address"}
            </label>
            <Input
              id="address-input"
              ref={inputRef}
              type="text"
              value={address}
              onChange={handleInputChange}
              placeholder={scriptsReady ? "Search here" : "Loading..."}
              disabled={!scriptsReady || isGenerating}
              leftIcon={<MapPin className="h-4 w-4 sm:h-5 sm:w-5" />}
              size="lg"
              autoComplete="off"
              className="touch-manipulation"
            />

            {suggestions.length > 0 && (
              <ul className="relative z-50 mt-2 max-h-60 overflow-hidden overflow-y-auto rounded-md border bg-white shadow-sm">
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

            {!scriptsReady && !loadError && (
              <div className="text-responsive-sm mt-2 flex items-center text-black/60">
                <div className="mobile-icon-xs mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Loading address autocomplete...
              </div>
            )}
          </div>

          {reportType === "comparison" && (
            <div>
              <label
                htmlFor="comparison-address-input"
                className="mb-2 block text-sm font-medium text-black sm:mb-3 sm:text-lg"
              >
                Second Property Address
              </label>
              <Input
                id="comparison-address-input"
                ref={comparisonInputRef}
                type="text"
                value={comparisonAddress}
                onChange={handleComparisonInputChange}
                placeholder={scriptsReady ? "Search here" : "Loading..."}
                disabled={!scriptsReady || isGenerating}
                leftIcon={<MapPin className="mobile-icon-xs" />}
                size="md"
                autoComplete="off"
                className="touch-manipulation"
              />

              {comparisonSuggestions.length > 0 && (
                <ul className="relative z-50 mt-2 max-h-60 overflow-hidden overflow-y-auto rounded-md border bg-white shadow-sm">
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
          )}

          {(error ?? loadError) && (
            <div className="flex items-start space-x-2 rounded-lg border border-red-200 bg-red-50 p-3 sm:space-x-3 sm:p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500 sm:h-5 sm:w-5" />
              <div className="text-red-700">
                <div className="text-sm font-medium sm:text-base">Error</div>
                <div className="text-xs sm:text-sm">{error ?? loadError}</div>
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isButtonDisabled}
            className={`min-h-12 w-full touch-manipulation rounded-lg px-4 py-3 text-base font-medium transition-all duration-200 sm:min-h-14 sm:px-6 sm:py-4 sm:text-lg ${
              isButtonDisabled
                ? "cursor-not-allowed bg-gray-300 text-gray-500"
                : "bg-olive text-white hover:bg-olive-light hover:shadow-lg active:scale-[0.98] active:transform"
            }`}
          >
            {isGenerating ? (
              <KeyTurnLoader message="Generating Report..." />
            ) : (
              <span>
                {reportType === "comparison"
                  ? "Generate Comparison Report"
                  : "Generate Report"}
              </span>
            )}
          </button>
        </Card>
      </div>
    </div>
  );
}
