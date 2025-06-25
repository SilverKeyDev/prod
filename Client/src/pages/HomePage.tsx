import React, { useState, useEffect, useRef } from "react";
import { MapPin, X, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import RippleBackground from "../RippleBackground"; // adjust path as needed

// Ensure TSX supports web component tag
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

export default function HomePage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const autoRef = useRef<HTMLElement | null>(null);

  // Load Google Maps scripts
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

  const handleGenerate = () => {
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-off-white to-white flex flex-col">
      <RippleBackground />
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 relative overflow-hidden">
            <div className="space-y-8">
              {/* Hero Section */}
              <div className="text-center">
                <h1 className="text-4xl font-serif text-brown mb-4">
                  SilverKey
                </h1>
                <p className="text-lg text-brown/60 font-light max-w-2xl mx-auto">
                  Generate premium property reports with AI
                </p>
              </div>

              {/* Form Section */}
              <div className="space-y-6">
                {/* Address Input */}
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brown/40 pointer-events-none" />
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
                  ></gmp-place-autocomplete>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  className="w-full bg-olive text-white rounded-xl py-4 px-6 font-semibold hover:bg-olive/70 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                >
                  {"Generate Report"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-2">
                <Lock className="h-6 w-6 text-brown" />
                <h2 className="text-2xl font-bold text-brown">
                  Account Required
                </h2>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-brown hover:text-brown/80 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="text-center mb-8">
              <p className="text-brown/80">
                Please create an account or login to generate a report.
              </p>
            </div>

            <div className="flex space-x-4">
              <Link
                to="/signup"
                className="flex-1 bg-olive text-white rounded-xl py-3 px-4 font-medium hover:bg-olive/90 transition-colors shadow-sm hover:shadow-md active:scale-95"
              >
                Create Account
              </Link>
              <Link
                to="/login"
                className="flex-1 border border-brown text-brown rounded-xl py-3 px-4 font-medium hover:bg-brown/10 transition-colors shadow-sm hover:shadow-md active:scale-95"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
