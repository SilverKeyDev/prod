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
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptsReady, setScriptsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
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
    if (!scriptsReady || address.trim().length < 3) {
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
  }, [address, scriptsReady]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    setSelectedPlace(null);
    setError(null);
  };

  const handleSelect = async (suggestion: Suggestion) => {
    const place = suggestion.placePrediction.toPlace();
    await place.fetchFields({
      fields: ["displayName", "formattedAddress"],
    });
    setSelectedPlace(place);
    setAddress(place.formattedAddress);
    setSuggestions([]);
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
  
    // Wait just for the 0.5 second delay, then navigate
    await delayPromise;
  
    navigate("/dashboard/reports"); // ✅ happens after delay, regardless of fetch result
  
    try {
      const res = await fetchPromise;
  
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Report generation failed");
      }
  
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to generate report");
      }
  
      // Optional: store or handle data silently here
      console.log("✅ Report successfully generated", data);
    } catch (err: any) {
      console.error("❌ API error after navigation:", err.message || err);
      // Optionally persist the error to show in the next page
    } finally {
      setIsGenerating(false);
    }
  };  

  const isButtonDisabled = isGenerating || !address.trim() || !!loadError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-off-white to-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif text-brown mb-4">
            Generate Property Report
          </h1>
          <p className="text-lg text-brown/60 font-light max-w-2xl mx-auto">
            Enter an address to generate a comprehensive AI-powered property
            analysis report
          </p>
        </div>

        <div className="card max-w-2xl mx-auto space-y-6">
          <div>
            <label
              htmlFor="address-input"
              className="block text-lg font-medium text-brown mb-3"
            >
              Property Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brown/40 pointer-events-none z-10" />
              <input
                id="address-input"
                ref={inputRef}
                type="text"
                value={address}
                onChange={handleInputChange}
                placeholder={
                  scriptsReady
                    ? "Start typing an address..."
                    : "Loading address search..."
                }
                disabled={!scriptsReady || isGenerating}
                className="w-full h-14 pl-12 pr-4 rounded-lg border border-gray-300 text-base focus:ring-2 focus:ring-olive focus:border-olive transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
                autoComplete="off"
              />
            </div>

            {suggestions.length > 0 && (
              <ul className="border mt-2 rounded-md overflow-hidden shadow-sm bg-white z-50 relative">
                {suggestions.map((s, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleSelect(s)}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                  >
                    {s.description}
                  </li>
                ))}
              </ul>
            )}

            {!scriptsReady && !loadError && (
              <p className="text-sm text-brown/60 mt-2 flex items-center">
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Loading address autocomplete...
              </p>
            )}
          </div>

          {(error || loadError) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-red-700">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error || loadError}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isButtonDisabled}
            className={`w-full py-4 px-6 rounded-lg text-lg font-medium transition-all duration-200 ${
              isButtonDisabled
                ? "cursor-not-allowed bg-gray-300 text-gray-500"
                : "bg-olive text-white hover:bg-olive/90 hover:shadow-lg active:transform active:scale-[0.98]"
            }`}
          >
            {isGenerating ? (
              <div className="flex items-center justify-center">
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Generating Report...
              </div>
            ) : (
              "Generate Property Report"
            )}
          </button>

          <div className="text-sm text-brown/60 text-center">
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
