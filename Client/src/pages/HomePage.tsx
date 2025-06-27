import React, { useState, useEffect, useRef } from "react";
import { MapPin, Lock, X, Building2, BarChart2, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import RippleBackground from "../RippleBackground";

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

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("Missing Google Maps API key");
      return;
    }
    window.initMapScripts = () => {
      console.log("Google Maps scripts loaded");
    };
    const loadScript = (src: string, id: string) => {
      if (document.getElementById(id)) return;
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.defer = true;
      s.id = id;
      document.head.appendChild(s);
    };
    loadScript(
      `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=beta&callback=initMapScripts`,
      "maps-js"
    );
    loadScript(
      "https://unpkg.com/@googlemaps/extended-component-library@latest/dist/loader.js",
      "maps-web-component"
    );
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <RippleBackground />
      {/* Header */}
      <header className="w-full flex justify-between items-center p-4 border-b border-gray-200 bg-white relative z-10">
        <h1 className="text-2xl font-bold text-navy">SilverKey</h1>
        <div className="flex space-x-4 text-sm font-medium">
          <Link to="/login" className="hover:underline">
            Login
          </Link>
          <Link to="/signup" className="hover:underline">
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 relative">
        <div className="absolute inset-0 z-0">
          <RippleBackground />
        </div>
        <div className="relative z-10 max-w-3xl text-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-5xl font-serif text-brown font-bold mb-4">
              Discover Something New
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Find the key to your next travel destination, home, or investment with SilverKey.
            </p>

            {/* Search */}
            <div className="relative w-full max-w-xl mx-auto mb-6">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
              <gmp-place-autocomplete
                ref={autoRef}
                placeholder="Search address..."
                style={{
                  width: "100%",
                  height: "3rem",
                  paddingLeft: "2.5rem",
                  fontSize: "1rem",
                  border: "1px solid #999",
                  borderRadius: "0.5rem",
                }}
              />
            </div>
          </div>
          <div className="mt-8">
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-olive text-white rounded-lg py-3 px-8 font-semibold hover:bg-olive/80 transition"
            >
              Generate Report
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl">
          {[
            {
              title: "Find Properties",
              description:
                "Search any US address to get started with your investment analysis.",
              icon: <Building2 className="h-8 w-8 text-gray-500" />,
            },
            {
              title: "Analyze Data",
              description:
                "Get comprehensive reports on property values, rental income, and more.",
              icon: <BarChart2 className="h-8 w-8 text-gray-500" />,
            },
            {
              title: "Make Decisions",
              description:
                "Use our insights to make informed real estate investment choices.",
              icon: <Lightbulb className="h-8 w-8 text-gray-500" />,
            },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center"
            >
              <div className="mb-2">{f.icon}</div>
              <h3 className="font-semibold text-brown text-lg mb-2">
                {f.title}
              </h3>
              <p className="text-gray-600 text-sm">{f.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow p-8 max-w-md w-full">
            <div className="flex justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-brown" />
                <span className="font-bold text-brown">Account Required</span>
              </div>
              <button onClick={() => setShowAuthModal(false)}>
                <X className="h-5 w-5 text-brown" />
              </button>
            </div>
            <p className="mb-6 text-center text-gray-600">
              Please log in or create an account to generate a report.
            </p>
            <div className="flex gap-4">
              <Link
                to="/signup"
                className="flex-1 bg-olive text-white rounded-lg py-3 text-center"
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                className="flex-1 border border-brown text-brown rounded-lg py-3 text-center"
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
