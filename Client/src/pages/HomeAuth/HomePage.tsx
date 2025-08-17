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
import RippleBackground from "../../components/ui/RippleBackground";
import RippleBackgroundMobile from "../../components/ui/RippleBackgroundMobile";
import KeyLogo from "../../components/ui/KeyLogo";

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
      console.log("✅ Google Maps loaded for homepage");
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
      <div className="block sm:hidden">
        <RippleBackgroundMobile />
      </div>
      <div className="hidden sm:block">
        <RippleBackground />
      </div>
      {/* Header */}
      <header className="w-full flex justify-between items-center p-4 border-b border-gray-200 bg-white relative z-10 shadow-lg">
        <KeyLogo size="xs" />
        <div className="flex space-x-2 sm:space-x-4 text-sm font-medium">
          <Link to="/login" className="hover:underline px-2 py-1">
            Login
          </Link>
          <Link
            to="/signup"
            className="bg-brown text-white px-3 py-1 rounded hover:bg-brown/90 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-20 relative">
        <div className="absolute inset-0 z-0 block sm:hidden">
          <RippleBackgroundMobile />
        </div>
        <div className="absolute inset-0 z-0 hidden sm:block">
          <RippleBackground />
        </div>
        <div className="relative z-10 max-w-3xl text-center w-full">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-black font-bold mb-4">
              Discover a New Way to Buy
            </h2>
            <p className="text-gray-600 mb-6 sm:mb-8 text-base sm:text-lg">
              Onboard, Search, Decide, Negotiate, Close
            </p>
            <div className="mt-4 sm:mt-8">
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-olive text-white rounded-lg py-3 px-6 sm:px-8 font-semibold hover:bg-olive-light transition text-sm sm:text-base w-full sm:w-auto"
              >
                Start Now
              </button>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="relative z-12 grid grid-cols-1 md:grid-cols-4 gap-6 mt-20 max-w-6xl">
          {[
            {
              title: "Find Properties",
              description:
                "Select your preferences and let our AI find the best homes for you",
              icon: <Building2 className="h-8 w-8 text-gray-500" />,
            },
            {
              title: "Decide on a Home",
              description:
                "Input the facts of homes into spreadsheets or reports and get detailed analysis of the neighborhood.",
              icon: <BarChart2 className="h-8 w-8 text-gray-500" />,
            },
            {
              title: "Negotiate",
              description:
                "Analyze the market and home to draft a competitive offer and automate the associated paperwork.",
              icon: <Lightbulb className="h-8 w-8 text-gray-500" />,
            },
            {
              title: "Purchase",
              description:
                "Use our timelines and paperwork to find and submit the appropriate paperwork, disclosures, etc, without paying legal fees.",
              icon: <FolderLock className="h-8 w-8 text-gray-500" />,
            },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-md hover:shadow-lg p-6 flex flex-col items-center text-center transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
            >
              <div className="mb-2">{f.icon}</div>
              <h3 className="font-semibold text-black text-lg mb-2">
                {f.title}
              </h3>
              <p className="text-gray-600 text-sm">{f.description}</p>
            </div>
          ))}
        </div>

        {/* Footer Links */}
        <div className="relative mt-10 flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-sm text-center">
          <Link
            to="/privacy"
            className="bg-white text-black px-4 py-2 rounded-lg shadow hover:shadow-md transition-colors duration-200"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms"
            className="bg-white text-black px-4 py-2 rounded-lg shadow hover:shadow-md transition-colors duration-200"
          >
            Terms of Service
          </Link>
          <Link
            to="/contact"
            className="bg-white text-black px-4 py-2 rounded-lg shadow hover:shadow-md transition-colors duration-200"
          >
            Contact Us
          </Link>
        </div>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow p-8 max-w-md w-full">
            <div className="flex justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-black" />
                <span className="font-bold text-black">Account Required</span>
              </div>
              <button onClick={() => setShowAuthModal(false)}>
                <X className="h-5 w-5 text-black" />
              </button>
            </div>
            <p className="mb-6 text-center text-gray-600">
              Please log in or create an account to generate a report.
            </p>
            <div className="flex gap-4">
              <Link
                to="/signup"
                className="flex-1 bg-olive text-white hover:bg-olive-light rounded-lg py-3 text-center transition-colors"
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                className="flex-1 border border-brown text-black hover:text-black hover:bg-brown/10 rounded-lg py-3 text-center transition-colors"
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
