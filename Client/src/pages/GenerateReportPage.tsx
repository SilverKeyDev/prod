export {};

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Loader2, AlertCircle } from "lucide-react";

declare global {
  interface Window {
    google?: any;
  }
}

interface Suggestion {
  description: string;
  placePrediction: any;
}

export default function GenerateReportPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [address, setAddress] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptsReady, setScriptsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasSelected, setHasSelected] = useState(false);
  // Load Google Maps script
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setLoadError("Missing Google Maps API key.");
      return;
    }

    if (window.google?.maps?.places?.AutocompleteSuggestion) {
      setScriptsReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptsReady(true);
    script.onerror = () =>
      setLoadError(
        "Failed to load Google Maps script. Please check your API key or internet."
      );

    document.head.appendChild(script);
  }, []);

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

    const debounce = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(debounce);
  }, [address, scriptsReady, hasSelected]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasSelected(false);
    setAddress(e.target.value);
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

  // Start polling for report completion using PastReports polling function
  const setupReportCompletionListener = (documentId: string) => {
    console.log(
      `[GenerateReport] 🚀 Setting up completion listener for report: ${documentId}`
    );

    try {
      // Try to call the polling function from PastReports
      if ((window as any).pollForReportCompletion) {
        console.log(
          `[GenerateReport] ✅ Found PastReports polling function, starting polling immediately`
        );
        try {
          (window as any).pollForReportCompletion(documentId);
          console.log(
            `[GenerateReport] ✅ Successfully initiated polling for report: ${documentId}`
          );
        } catch (pollingError) {
          console.error(
            `[GenerateReport] ❌ Error calling polling function:`,
            pollingError
          );
        }
      } else {
        console.log(
          `[GenerateReport] ⏳ PastReports polling function not available yet, will retry...`
        );

        // PastReports component might not be mounted yet, retry a few times
        let retryCount = 0;
        const maxRetries = 20; // Try for 10 seconds (20 * 500ms)

        const retryPolling = () => {
          retryCount++;
          console.log(
            `[GenerateReport] 🔄 Retry attempt ${retryCount}/${maxRetries} - checking for polling function...`
          );

          try {
            if ((window as any).pollForReportCompletion) {
              console.log(
                `[GenerateReport] ✅ Found polling function on retry ${retryCount}, starting polling`
              );
              (window as any).pollForReportCompletion(documentId);
              console.log(
                `[GenerateReport] ✅ Successfully initiated polling for report: ${documentId}`
              );
            } else if (retryCount < maxRetries) {
              console.log(
                `[GenerateReport] ⏳ Polling function still not available, will retry in 500ms...`
              );
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

    setIsGenerating(true);
    setError(null);

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    const idToken = localStorage.getItem("id_token");

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
      body: JSON.stringify({ address: trimmed }),
    });

    // Wait for the 0.5 second delay, then navigate
    await delayPromise;
    navigate("/dashboard/reports"); // ✅ happens after delay, regardless of fetch result

    try {
      const res = await fetchPromise;

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 402) {
          navigate("/dashboard/subscription", {
            state: {
              message:
                errorData.error ||
                "You have no reports available. Please subscribe to continue.",
            },
          });
          return; // Stop further execution
        }
        throw new Error(errorData.error || "Report generation failed");
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to generate report");
      }

      console.log("✅ Report generation started", data);

      // Set up listener for when report generation actually completes (~5 minutes)
      if (data.document_id) {
        console.log(
          "[GenerateReport] Setting up completion listener for document:",
          data.document_id
        );
        setupReportCompletionListener(data.document_id);
      }
    } catch (err: any) {
      console.error("❌ API error after navigation:", err.message || err);
      // Optionally persist the error to show in the next page
    } finally {
      setIsGenerating(false);
    }
  };

  const isButtonDisabled = isGenerating || !address.trim() || !!loadError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-off-white to-white mobile-padding py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-black mb-3 sm:mb-4 px-2">
            Generate Report
          </h1>
          <p className="text-base sm:text-lg text-black/60 font-light max-w-2xl mx-auto px-2">
            Enter an address to generate a comprehensive AI-powered property
            analysis report
          </p>
        </div>

        <div className="mobile-card max-w-2xl mx-auto space-y-4 sm:space-y-6">
          <div>
            <label
              htmlFor="address-input"
              className="block text-sm sm:text-lg font-medium text-black mb-2 sm:mb-3"
            >
              Property Address
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
              <p className="text-sm text-black/60 mt-2 flex items-center">
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Loading address autocomplete...
              </p>
            )}
          </div>

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
              <div className="flex items-center justify-center">
                <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="text-sm sm:text-base">
                  Generating Report...
                </span>
              </div>
            ) : (
              <span className="text-sm sm:text-base">Generate Report</span>
            )}
          </button>

          <div className="hidden sm:block text-xs sm:text-sm text-black/60 text-center px-2">
            <p>
              Select an address from the dropdown suggestions for best results.
              The report will include property details, market analysis, and
              insights.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
