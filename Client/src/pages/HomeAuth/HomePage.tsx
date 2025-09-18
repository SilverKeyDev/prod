import {
  Building2,
  BarChart2,
  Lightbulb,
  FolderLock,
  X,
  Lock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import KeyLogo from "/logo.png?url";
import type { AutocompleteSuggestion } from "../../core/schemas/google-maps";
import { asError } from "../../core/utils/error";
import RippleBackground from "../../features/homeauth/RippleBackground";

type Suggestion = {
  description: string;
  placePrediction: unknown;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    initMapScripts?: () => void;
    google?: typeof google;
  }
}

export default function HomePage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [address] = useState("");
  const [, setSuggestions] = useState<Suggestion[]>([]);
  const [scriptsReady, setScriptsReady] = useState(false);
  const [, setLoadError] = useState<string | null>(null);
  const [hasSelected] = useState(false);

  // Temporarily disable Google Maps functionality
  const googleMapsLoaded = false;
  const googleMapsError = null;

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
        const g = (window as unknown as { google?: typeof google }).google;
        if (!g?.maps?.places) {
          setSuggestions([]);
          return;
        }
        const sessionToken = new g.maps.places.AutocompleteSessionToken();
        const request = {
          input: address,
          sessionToken,
          includedRegionCodes: ["US"],
        };

        const { suggestions: fetched } =
          await g.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            request
          );

        const built = fetched.flatMap(
          (
            s:
              | AutocompleteSuggestion
              | { placePrediction: google.maps.places.PlacePrediction | null }
          ) => {
            const pred = (s as any)
              .placePrediction as google.maps.places.PlacePrediction | null;
            if (!pred) return [];
            return [
              {
                description: pred.text.text,
                placePrediction: {
                  text: { text: pred.text.text },
                  toPlace: () => pred.toPlace(),
                },
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

    const debounce = void void setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(debounce);
  }, [address, scriptsReady, hasSelected]);

  return (
    <div className="hide-scrollbar flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="px-responsive-sm fixed left-0 right-0 top-0 z-50 flex w-full items-center justify-between border-b border-gray-200 bg-white py-2 shadow-lg sm:py-3">
        <img src={KeyLogo} alt="SilverKey Logo" className="h-8 w-auto" />
        <div className="text-responsive-sm flex gap-1.5 font-medium sm:gap-2">
          <Link
            to="/login"
            className="rounded-md px-3 py-2 hover:underline sm:px-4 sm:py-2.5 md:px-5"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="rounded-md bg-gold px-3 py-2 text-white transition-colors hover:bg-gold/90 sm:px-4 sm:py-2.5"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16 flex-shrink-0 sm:h-20"></div>

      {/* Hero Section */}
      <main className="px-responsive-sm py-responsive-lg relative flex flex-1 flex-col items-center justify-center">
        <div className="absolute inset-0 z-0">
          <RippleBackground />
        </div>

        {/* Centered Content Wrapper */}
        <div className="relative z-10 mx-auto flex w-full max-w-[85%] flex-col items-center">
          <div className="mx-auto w-full max-w-3xl text-center">
            <div className="rounded-lg bg-white p-6 shadow-lg sm:p-8">
              <h1 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">
                Discover a New Way to Buy
              </h1>
              <p className="mb-6 text-lg text-gray-600 sm:text-xl">
                Onboard, Search, Decide, Negotiate, Close
              </p>
              <div className="mt-4 sm:mt-8">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="py-responsive-sm px-responsive-lg text-responsive-sm touch-friendly w-1/2 rounded-lg bg-olive font-semibold text-white transition hover:bg-olive-light"
                >
                  Start Now
                </button>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="z-12 gap-responsive-sm relative mx-auto mt-20 grid w-full max-w-6xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Find Properties",
                description:
                  "Select your preferences and let our AI find the best homes for you",
                icon: <Building2 className="mobile-icon-lg text-gray-500" />,
              },
              {
                title: "Decide on a Home",
                description:
                  "Input the facts of homes into spreadsheets or reports and get detailed analysis of the neighborhood.",
                icon: <BarChart2 className="mobile-icon-lg text-gray-500" />,
              },
              {
                title: "Negotiate",
                description:
                  "Analyze the market and home to draft a competitive offer and automate the associated paperwork.",
                icon: <Lightbulb className="mobile-icon-lg text-gray-500" />,
              },
              {
                title: "Purchase",
                description:
                  "Use our timelines and paperwork to find and submit the appropriate paperwork, disclosures, etc, without paying legal fees.",
                icon: <FolderLock className="mobile-icon-lg text-gray-500" />,
              },
            ].map((f, i) => (
              <div
                key={i}
                className="touch-friendly flex cursor-pointer flex-col items-center rounded-xl bg-white p-4 text-center shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-5"
              >
                <div className="mb-2">{f.icon}</div>
                <h3 className="text-responsive-md mb-3 w-[87%] font-semibold text-black">
                  {f.title}
                </h3>
                <p className="w-[87%] text-xs text-gray-600 sm:text-sm">
                  {f.description}
                </p>
              </div>
            ))}
          </div>

          {/* Footer Links */}
          <div className="gap-responsive-sm text-responsive-xs relative mt-10 flex flex-wrap items-center justify-center text-center">
            <Link
              to="/privacy"
              className="px-responsive-xl py-responsive-xs touch-friendly flex items-center justify-center rounded-lg bg-white text-black text-gray-600 shadow transition-all duration-200 hover:text-gray-800 hover:shadow-md"
            >
              <span className="decoration-1 underline-offset-2 hover:underline">
                Privacy Policy
              </span>
            </Link>
            <Link
              to="/terms"
              className="px-responsive-xl py-responsive-xs touch-friendly flex items-center justify-center rounded-lg bg-white text-black text-gray-600 shadow transition-all duration-200 hover:text-gray-800 hover:shadow-md"
            >
              <span className="decoration-1 underline-offset-2 hover:underline">
                Terms of Service
              </span>
            </Link>
            <Link
              to="/contact"
              className="px-responsive-xl py-responsive-xs touch-friendly flex items-center justify-center rounded-lg bg-white text-black text-gray-600 shadow transition-all duration-200 hover:text-gray-800 hover:shadow-md"
            >
              <span className="decoration-1 underline-offset-2 hover:underline">
                Contact Us
              </span>
            </Link>
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="space-responsive-sm fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="space-responsive-lg w-full max-w-md rounded-2xl bg-white shadow">
            <div className="mb-4 flex justify-between">
              <div className="gap-responsive-xs flex items-center">
                <Lock className="mobile-icon-sm text-gray-600" />
                <span className="text-responsive-sm font-bold text-gray-600">
                  Account Required
                </span>
              </div>
              <button onClick={() => setShowAuthModal(false)}>
                <X className="mobile-icon-sm text-black" />
              </button>
            </div>
            <p className="space-y-responsive-md text-responsive-sm mb-4 text-center text-gray-600">
              Please log in or create an account to generate a report.
            </p>
            <div className="flex gap-2 sm:gap-3">
              <Link
                to="/login"
                className="text-responsive-sm touch-friendly flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-center transition-colors hover:underline sm:px-4 sm:py-3 md:px-5"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="text-responsive-sm touch-friendly flex-1 rounded-lg bg-gold py-2.5 text-center text-white transition-colors hover:bg-gold/90 sm:py-3"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
