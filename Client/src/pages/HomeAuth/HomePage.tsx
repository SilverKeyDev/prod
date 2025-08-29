import { useState, useEffect } from "react";
import {
  Lock,
  X,
  Building2,
  BarChart2,
  Lightbulb,
  FolderLock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useGoogleMaps } from "../../context";
import RippleBackground from "../../components/ui/homeauth/RippleBackground";
import KeyLogo from "../../components/ui/base/KeyLogo";

interface Suggestion {
  description: string;
  placePrediction: any;
}

declare global {
  interface Window {
    initMapScripts?: () => void;
    google?: any;
  }
}

export default function HomePage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [address, ] = useState("");
  const [, setSuggestions] = useState<Suggestion[]>([]);
  const [scriptsReady, setScriptsReady] = useState(false);
  const [, setLoadError] = useState<string | null>(null);
  const [hasSelected, ] = useState(false);

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
          componentRestrictions: { country: 'US' },
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

  return (
    <div className="min-h-screen bg-white flex flex-col hide-scrollbar">
      <RippleBackground />
      {/* Header */}
      <header className="w-full flex justify-between items-center px-responsive-sm py-2 sm:py-3 border-b border-gray-200 bg-white fixed top-0 left-0 right-0 z-50 shadow-lg">
        <KeyLogo size="sm" />
        <div className="flex gap-1.5 sm:gap-2 text-responsive-sm font-medium">
          <Link to="/login" className="hover:underline px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-md">
            Login
          </Link>
          <Link
            to="/signup"
            className="bg-gold text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-md hover:bg-gold/90 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16 sm:h-20 flex-shrink-0"></div>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-responsive-sm py-responsive-lg relative">
        <div className="absolute inset-0 z-0">
          <RippleBackground />
        </div>
        <div className="relative z-10 max-w-3xl text-center w-4/5 sm:w-full mx-auto">
          <div className="bg-white space-responsive-md rounded-lg shadow-lg">
            <h2 className="text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-serif text-black font-bold space-y-responsive-sm mb-2 ">
              Discover a New Way to Buy
            </h2>
            <p className="text-gray-600 space-y-responsive-md text-responsive-lg">
              Onboard, Search, Decide, Negotiate, Close
            </p>
            <div className="mt-4 sm:mt-8">
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-olive text-white rounded-lg py-responsive-sm px-responsive-lg font-semibold hover:bg-olive-light transition text-responsive-sm w-1/2 touch-friendly"
              >
                Start Now
              </button>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="relative z-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-responsive-sm mt-20 max-w-6xl w-4/5 sm:w-full mx-auto">
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
              className="bg-white rounded-xl shadow-md hover:shadow-lg space-responsive-md flex flex-col items-center text-center transition-all duration-200 hover:-translate-y-0.5 cursor-pointer touch-friendly"
            >
              <div className="mb-2">{f.icon}</div>
              <h3 className="font-semibold text-black text-responsive-md mb-3 w-[87%]">
                {f.title}
              </h3>
              <p className="text-gray-600 text-responsive-xs w-[87%]">{f.description}</p>
            </div>
          ))}
        </div>

        {/* Footer Links */}
        <div className="relative mt-10 flex flex-wrap justify-center items-center gap-responsive-sm text-responsive-xs text-center">
          <Link
            to="/privacy"
            className="bg-white text-black px-responsive-xl py-responsive-xs rounded-lg shadow hover:shadow-md transition-all duration-200 touch-friendly flex items-center justify-center text-gray-600 hover:text-gray-800"
          >
            <span className="hover:underline underline-offset-2 decoration-1">
              Privacy Policy
            </span>
          </Link>
          <Link
            to="/terms"
            className="bg-white text-black px-responsive-xl py-responsive-xs rounded-lg shadow hover:shadow-md transition-all duration-200 touch-friendly flex items-center justify-center text-gray-600 hover:text-gray-800"
          >
            <span className="hover:underline underline-offset-2 decoration-1">
              Terms of Service
            </span>
          </Link>
          <Link
            to="/contact"
            className="bg-white text-black px-responsive-xl py-responsive-xs rounded-lg shadow hover:shadow-md transition-all duration-200 touch-friendly flex items-center justify-center text-gray-600 hover:text-gray-800"
          >
            <span className="hover:underline underline-offset-2 decoration-1">
              Contact Us
            </span>
          </Link>
        </div>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 space-responsive-sm">
          <div className="bg-white rounded-2xl shadow space-responsive-lg max-w-md w-full">
            <div className="flex justify-between mb-4">
              <div className="flex items-center gap-responsive-xs">
                <Lock className="mobile-icon-sm text-gray-600" />
                <span className="font-bold text-responsive-sm text-gray-600">Account Required</span>
              </div>
              <button onClick={() => setShowAuthModal(false)}>
                <X className="mobile-icon-sm text-black" />
              </button>
            </div>
            <p className="space-y-responsive-md text-center text-responsive-sm text-gray-600 mb-4">
              Please log in or create an account to generate a report.
            </p>
            <div className="flex gap-2 sm:gap-3">
              <Link
                to="/login"
                className="flex-1 hover:underline px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 rounded-lg text-center text-responsive-sm transition-colors touch-friendly border border-gray-300"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="flex-1 bg-gold text-white hover:bg-gold/90 rounded-lg py-2.5 sm:py-3 text-center text-responsive-sm transition-colors touch-friendly"
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
