export {};

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ChevronDown, Loader2, AlertCircle } from "lucide-react";
import { useUser, useGoogleMaps } from "../../context";
import PageHeader from "../../components/ui/PageHeader";
import KeyTurnLoader from "../../components/ui/KeyTurnLoader";

declare global {
  interface Window {
    google?: any;
  }
}

interface Suggestion {
  description: string;
  placePrediction: any;
}

interface ClientInfo {
  id: string;
  name: string;
  email: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  isOpen: boolean;
  onToggle: () => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
}

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
        className="mobile-input text-responsive-sm flex items-center justify-between cursor-pointer hover:border-brown focus:border-brown focus:ring-brown/20 w-full"
      >
        <span className="text-left">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`mobile-icon-xs transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-beige rounded-lg shadow-lg z-50">
          {options.map((option, index) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                onToggle();
              }}
              className={`w-full px-responsive-sm py-responsive-xs text-left text-responsive-sm hover:bg-brown/5 transition-colors duration-150 ${
                index === 0 ? "first:rounded-t-lg" : ""
              } ${index === options.length - 1 ? "last:rounded-b-lg" : ""} ${
                value === option.value
                  ? "bg-brown/10 text-brown font-medium"
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
  const clientDropdownRef = useRef<HTMLDivElement>(null);

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
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

  // Load generate report state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("generateReportState");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
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
        if (parsed.selectedClientId) {
          setSelectedClientId(parsed.selectedClientId);
        }
      } catch (e) {
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

  // Fetch clients for agents and set default selection
  useEffect(() => {
    const fetchClients = async () => {
      if (!userProfile?.is_agent) {
        return;
      }

      setClientsLoading(true);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const idToken = localStorage.getItem("id_token");

        const response = await fetch(
          `${apiBaseUrl}/api/v1/preferences/clients`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user_information) {
            const clientList: ClientInfo[] = data.user_information.map(
              (user: any) => ({
                id: user.id,
                name: user.name || user.email,
                email: user.email,
              })
            );
            setClients(clientList);
          } else {
            console.warn(
              "⚠️ FRONTEND: API response missing expected data structure"
            );
          }
        } else {
          console.error(
            "❌ FRONTEND: Failed to fetch clients:",
            response.statusText
          );
        }
      } catch (error) {
        console.error("💥 FRONTEND: Error fetching clients:", error);
      } finally {
        setClientsLoading(false);
      }
    };

    fetchClients();
  }, [userProfile?.is_agent]);

  // Set default client selection to agent themselves
  useEffect(() => {
    if (userProfile?.is_agent && userProfile.id && !selectedClientId) {
      setSelectedClientId(userProfile.id);
    }
  }, [userProfile?.is_agent, userProfile?.id, selectedClientId]);

  // Use centralized Google Maps loading
  const { isLoaded: googleMapsLoaded, error: googleMapsError } = useGoogleMaps();

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
          includedRegionCodes: ['US'],
        };

        const { suggestions: fetched } =
          await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            request
          );

        setSuggestions(
          fetched.map((s: any) => ({
            description: s.placePrediction.text.text,
            placePrediction: s.placePrediction,
          }))
        );
      } catch (err) {
        console.error("Autocomplete fetch error:", err);
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
          includedRegionCodes: ['US'],
        };

        const { suggestions: fetched } =
          await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            request
          );

        setComparisonSuggestions(
          fetched.map((s: any) => ({
            description: s.placePrediction.text.text,
            placePrediction: s.placePrediction,
          }))
        );
      } catch (err) {
        console.error("Comparison autocomplete fetch error:", err);
        setComparisonSuggestions([]);
      }
    };

    const debounce = setTimeout(fetchComparisonSuggestions, 200);
    return () => clearTimeout(debounce);
  }, [comparisonAddress, scriptsReady, hasSelectedComparison, reportType]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        clientDropdownRef.current &&
        !clientDropdownRef.current.contains(event.target as Node)
      ) {
        setIsClientDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
    setAddress(place.formattedAddress);
    setSuggestions([]);
  };

  const handleComparisonSelect = async (suggestion: Suggestion) => {
    setHasSelectedComparison(true);
    const place = suggestion.placePrediction.toPlace();
    await place.fetchFields({
      fields: ["displayName", "formattedAddress"],
    });
    setComparisonAddress(place.formattedAddress);
    setComparisonSuggestions([]);
  };

  // Start polling for report completion using PastReports polling function
  const setupReportCompletionListener = (documentId: string) => {

    try {
      // Try to call the polling function from PastReports
      if ((window as any).pollForReportCompletion) {
        try {
          (window as any).pollForReportCompletion(documentId);
        } catch (pollingError) {
          console.error(
            `[GenerateReport] ❌ Error calling polling function:`,
            pollingError
          );
        }
      } else {

        // PastReports component might not be mounted yet, retry a few times
        let retryCount = 0;
        const maxRetries = 20; // Try for 10 seconds (20 * 500ms)

        const retryPolling = () => {
          retryCount++;

          try {
            if ((window as any).pollForReportCompletion) {
              (window as any).pollForReportCompletion(documentId);
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
          } catch (retryError) {
            console.error(
              `[GenerateReport] ❌ Error during retry ${retryCount}:`,
              retryError
            );
            if (retryCount < maxRetries) {
              setTimeout(retryPolling, 500);
            }
          }
        };

        setTimeout(retryPolling, 500);
      }
    } catch (setupError) {
      console.error(
        `[GenerateReport] ❌ CRITICAL ERROR in setupReportCompletionListener:`,
        setupError
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

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    const idToken = localStorage.getItem("id_token");

    const willSendUserId =
      userProfile?.is_agent &&
      selectedClientId &&
      selectedClientId !== userProfile?.id;

    const requestBody = {
      address: trimmed,
      ...(reportType === "comparison" && {
        comparisonAddress: comparisonAddress.trim(),
      }),
      ...(willSendUserId && {
        user_id: selectedClientId,
      }),
      ...(reportType === "marketing" && {
        marketing_model: true,
      }),
    };

    // Start both immediately
    const delayPromise = new Promise((resolve) => setTimeout(resolve, 500));
    const fetchPromise = fetch(`${apiBaseUrl}/api/v1/report/generate`, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    // Wait for the 0.5 second delay, then navigate
    await delayPromise;
    navigate("/dashboard/reports"); // ✅ happens after delay, regardless of fetch result

    try {
      const res = await fetchPromise;

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 402) {
          return; // Stop further execution
        }
        throw new Error(errorData.error || "Report generation failed");
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to generate report");
      }

      // Set up listener for when report generation actually completes (~5 minutes)
      if (data.document_id) {
        setupReportCompletionListener(data.document_id);
      }
    } catch (err: any) {
      console.error("❌ API error after navigation:", err.message || err);
      // Optionally persist the error to show in the next page
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
    <div className="min-h-screen bg-off-white">
      <PageHeader
        title="Generate Property Report"
        subtitle="Create a comprehensive analysis for any property"
      />
      <div className="mx-auto px-responsive-lg py-responsive-lg max-w-4xl">

        <div className="mobile-card max-w-2xl mx-auto space-y-responsive-sm">
          <div>
            <label
              htmlFor="report-type"
              className="block text-sm sm:text-lg font-medium text-black mb-2 sm:mb-3"
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

          {userProfile?.is_agent && (
            <div>
              <label
                htmlFor="client-select"
                className="block text-sm sm:text-lg font-medium text-black mb-2 sm:mb-3"
              >
                Customized for:
              </label>
              {clientsLoading ? (
                <div className="mobile-input text-responsive-sm flex items-center justify-center">
                  <KeyTurnLoader message="Loading clients..." />
                </div>
              ) : (
                <CustomDropdown
                  value={selectedClientId}
                  onChange={setSelectedClientId}
                  options={[
                    // Agent themselves as first option
                    {
                      value: userProfile?.id || "",
                      label: `${userProfile?.name || userProfile?.email} (You)`,
                    },
                    // Then all clients
                    ...clients.map((client) => ({
                      value: client.id,
                      label: `${client.name} (${client.email})`,
                    })),
                  ]}
                  placeholder="Select a client"
                  isOpen={isClientDropdownOpen}
                  onToggle={() =>
                    setIsClientDropdownOpen(!isClientDropdownOpen)
                  }
                  dropdownRef={clientDropdownRef}
                />
              )}
              {clients.length === 0 && !clientsLoading && (
                <p className="text-responsive-sm text-gray-500 mt-2">
                  No clients found. Please assign clients to your agent account.
                </p>
              )}
            </div>
          )}

          {reportType === "comparison" && (
            <div className="bg-olive/10 border border-olive/30 rounded-lg space-responsive-sm">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="text-olive">
                  <p className="font-medium text-sm sm:text-base mb-1">
                    Comparison Report
                  </p>
                  <p className="text-xs sm:text-sm">
                    Compare two properties side-by-side with detailed analysis
                    of neighborhoods, amenities, market trends, and key
                    differences to help you make an informed decision.
                  </p>
                </div>
              </div>
            </div>
          )}

          {reportType === "marketing" && (
            <div className="bg-gold/10 border border-gold/30 rounded-lg space-responsive-sm">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="text-gold">
                  <p className="font-medium text-sm sm:text-base mb-1">
                    Marketing Material
                  </p>
                  <p className="text-xs sm:text-sm">
                    Generate personalized marketing materials tailored to your
                    client's specific preferences and needs. This report
                    leverages your client's demographic data, lifestyle
                    preferences, and real estate criteria to create compelling
                    property descriptions, targeted market insights, and
                    customized selling points that resonate with their unique
                    situation and decision-making factors.
                  </p>
                </div>
              </div>
            </div>
          )}

          {reportType === "detailed" && (
            <div className="bg-brown/10 border border-brown/30 rounded-lg space-responsive-sm">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="text-brown">
                  <p className="font-medium text-sm sm:text-base mb-1">
                    Detailed Report
                  </p>
                  <p className="text-xs sm:text-sm">
                    Generate a comprehensive neighborhood analysis with detailed
                    insights into demographics, safety, amenities, schools,
                    transportation, and lifestyle factors. This personalized
                    report is tailored to your specific preferences and
                    priorities, providing in-depth information to help you make
                    an informed decision about the property and area.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="address-input"
              className="block text-sm sm:text-lg font-medium text-black mb-2 sm:mb-3"
            >
              {reportType === "comparison"
                ? "First Property Address"
                : "Property Address"}
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-black/40 pointer-events-none z-10" />
              <input
                id="address-input"
                ref={inputRef}
                type="text"
                value={address}
                onChange={handleInputChange}
                placeholder={scriptsReady ? "Search here" : "Loading..."}
                disabled={!scriptsReady || isGenerating}
                className="w-full h-12 sm:h-14 pl-10 sm:pl-12 pr-3 sm:pr-4 rounded-lg border border-gray-300 text-xs sm:text-base focus:ring-2 focus:ring-olive focus:border-olive transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed touch-manipulation"
                autoComplete="off"
              />
            </div>

            {suggestions.length > 0 && (
              <ul className="border mt-2 rounded-md overflow-hidden shadow-sm bg-white z-50 relative max-h-60 overflow-y-auto">
                {suggestions.map((s, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleSelect(s)}
                    className="px-3 sm:px-4 py-3 sm:py-2 cursor-pointer hover:bg-gray-100 text-sm sm:text-base touch-friendly border-b border-gray-100 last:border-b-0"
                  >
                    {s.description}
                  </li>
                ))}
              </ul>
            )}

            {!scriptsReady && !loadError && (
              <p className="text-responsive-sm text-black/60 mt-2 flex items-center">
                <Loader2 className="animate-spin mobile-icon-xs mr-2" />
                Loading address autocomplete...
              </p>
            )}
          </div>

          {reportType === "comparison" && (
            <div>
              <label
                htmlFor="comparison-address-input"
                className="block text-sm sm:text-lg font-medium text-black mb-2 sm:mb-3"
              >
                Second Property Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 mobile-icon-xs text-black/40 pointer-events-none z-10" />
                <input
                  id="comparison-address-input"
                  ref={comparisonInputRef}
                  type="text"
                  value={comparisonAddress}
                  onChange={handleComparisonInputChange}
                  placeholder={scriptsReady ? "Search here" : "Loading..."}
                  disabled={!scriptsReady || isGenerating}
                  className="w-full btn-responsive-md pl-10 pr-responsive-sm rounded-lg border border-gray-300 text-responsive-sm focus:ring-2 focus:ring-olive focus:border-olive transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed touch-manipulation"
                  autoComplete="off"
                />
              </div>

              {comparisonSuggestions.length > 0 && (
                <ul className="border mt-2 rounded-md overflow-hidden shadow-sm bg-white z-50 relative max-h-60 overflow-y-auto">
                  {comparisonSuggestions.map((s, idx) => (
                    <li
                      key={idx}
                      onClick={() => handleComparisonSelect(s)}
                      className="px-3 sm:px-4 py-3 sm:py-2 cursor-pointer hover:bg-gray-100 text-sm sm:text-base touch-friendly border-b border-gray-100 last:border-b-0"
                    >
                      {s.description}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {(error || loadError) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start space-x-2 sm:space-x-3">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-red-700">
                <p className="font-medium text-sm sm:text-base">Error</p>
                <p className="text-xs sm:text-sm">{error || loadError}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isButtonDisabled}
            className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg text-base sm:text-lg font-medium transition-all duration-200 touch-manipulation min-h-12 sm:min-h-14 ${
              isButtonDisabled
                ? "cursor-not-allowed bg-gray-300 text-gray-500"
                : "bg-olive text-white hover:bg-olive-light hover:shadow-lg active:transform active:scale-[0.98]"
            }`}
          >
            {isGenerating ? (
              <KeyTurnLoader message="Generating Report..." />
            ) : (
              <span className="text-sm sm:text-base">
                {reportType === "comparison"
                  ? "Generate Comparison Report"
                  : "Generate Report"}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
