export {}; // Ensures file is treated as a module

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Loader2 } from "lucide-react";


declare global {
  interface Window {
    initMapScripts: () => void;
    google?: any;
  }
  namespace JSX {
    interface IntrinsicElements {
      "gmp-place-autocomplete": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        placeholder?: string;
        disabled?: boolean;
        style?: React.CSSProperties;
      };
    }
  }
}

export default function GenerateReportPage() {
  const navigate = useNavigate();
  const autoRef = useRef<HTMLElement | null>(null);

  const [address, setAddress] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptsReady, setScriptsReady] = useState(false);
  const [hasSelected, setHasSelected] = useState(false);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("[ERROR] Missing Google Maps API key.");
      return;
    }

    window.initMapScripts = () => {
      console.log("[INFO] Google Maps JS API initialized");
    };

    const loadScript = (src: string, id: string) => {
      if (document.getElementById(id)) return;
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.defer = true;
      script.id = id;
      document.head.appendChild(script);
    };

    loadScript(
      `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=beta&callback=initMapScripts`,
      "maps-js"
    );
    loadScript(
      "https://unpkg.com/@googlemaps/extended-component-library@latest/dist/loader.js",
      "gmp-web-component-loader"
    );
  }, []);


  const handleGenerate = async () => {
    const trimmed = address.trim();
    if (!trimmed) {
      console.warn("[BLOCKED] No trimmed address");
      return;
    }

    setIsGenerating(true);
    setError(null);
    console.log("[ACTION] Starting report generation for:", trimmed);

    try {
      const res = await fetch("/api/v1/report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: trimmed }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Report generation failed");
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Unknown error");

      localStorage.setItem(
        "propertyData",
        JSON.stringify({ address: trimmed, generatedReport: data.result })
      );
      navigate("/dashboard/reports?refresh=true");
    } catch (err) {
      console.error("[CATCH] Report generation failed:", err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-off-white to-white">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif text-brown mb-4">Generate Property Report</h1>
        <p className="text-lg text-brown/60 font-light max-w-2xl mx-auto">
          Enter an address to generate a comprehensive AI-powered report
        </p>
      </div>

      <div className="card max-w-2xl mx-auto space-y-8">
        <label className="block text-lg font-medium text-brown mb-3">Enter Location</label>
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brown/40 pointer-events-none" />
          {scriptsReady ? (
            <gmp-place-autocomplete
              ref={autoRef}
              placeholder="Enter full address..."
              style={{
                width: "100%",
                height: "3rem",
                paddingLeft: "3rem",
                fontSize: "1rem",
                borderRadius: "0.5rem",
                border: "1px solid #ddd",
              }}
              disabled={isGenerating ? true : undefined}
            />
          ) : (
            <div className="text-sm text-gray-500">Loading address input...</div>
          )}
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <button
          onClick={handleGenerate}
          className={`w-full py-4 px-6 rounded-lg text-lg font-medium transition-colors ${
            isGenerating || !hasSelected
              ? "cursor-not-allowed bg-olive"
              : "bg-olive text-white hover:bg-olive/80"
          }`}
          disabled={isGenerating || !hasSelected}
        >
          {isGenerating ? (
            <div className="flex items-center justify-center">
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              Generating...
            </div>
          ) : (
            "Generate Report"
          )}
        </button>
      </div>
    </div>
  );
}
