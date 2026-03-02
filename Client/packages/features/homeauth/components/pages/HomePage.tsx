/// <reference types="google.maps" />

import { useEffect, useState } from "react";

import { BarChart2, Building2, FolderLock, Lightbulb, Lock } from "lucide-react";

import RippleBackground from "packages/features/homeauth/components/homepage/RippleBackground";
import { log, LOG_CATEGORIES } from "packages/logger";
import { Link, ROUTES, useNavigation } from "packages/navigation";
import type { AutocompleteSuggestion } from "packages/schemas/google-maps";
import { BodyText, Button, CloseButton, Title } from "packages/ui/components";
import { Image } from "packages/ui/components/primitives/media";
import { asError } from "packages/utils/error";
import { getWindow } from "packages/utils/platform";

import KeyLogo from "/logo.png?url";

type Suggestion = {
  description: string;
  placePrediction: unknown;
};

declare global {
  interface Window {
    initMapScripts?: () => void;
    google?: unknown;
  }
}

export default function HomePage() {
  const { navigate } = useNavigation();
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
      log.error(LOG_CATEGORIES.ERRORS, "Google Maps loading error", googleMapsError);
      void void setLoadError("Failed to load Google Maps script.");
      return;
    }

    const win = getWindow();
    if (googleMapsLoaded && win?.google?.maps?.places) {
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
        // Use Window.google; global 'google' from @types/google.maps may not resolve in all lint contexts
        const win = getWindow();
        const g = win
          ? (win as unknown as { google?: { maps?: { places?: unknown } } }).google
          : undefined;
        if (!g?.maps?.places) {
          setSuggestions([]);
          return;
        }
        const sessionToken = new g.maps.places.AutocompleteSessionToken();
        const request = {
          input: address,
          sessionToken,
          componentRestrictions: { country: "US" },
        };

        const { suggestions: fetched } =
          await g.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

        const built = fetched.flatMap(
          (s: AutocompleteSuggestion | { placePrediction: unknown }) => {
            const sWithPred = s as {
              placePrediction: google.maps.places.PlacePrediction | null;
            };
            const pred = sWithPred.placePrediction;
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
        log.error(LOG_CATEGORIES.ERRORS, "Autocomplete fetch error", error);
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
        <Image src={KeyLogo} alt="SilverKey Logo" className="h-8 w-auto" />
        <div className="text-responsive-sm flex gap-1.5 font-medium sm:gap-2">
          <Link
            to={ROUTES.LOGIN}
            className="rounded-md px-3 py-2 hover:underline sm:px-4 sm:py-2.5 md:px-5"
          >
            Login
          </Link>
          <Link
            to={ROUTES.SIGNUP}
            className="bg-gold hover:bg-gold/90 rounded-md px-3 py-2 text-white transition-colors sm:px-4 sm:py-2.5"
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
              <Title size="xl" as="h1" className="mb-4">
                Discover a New Way to Buy
              </Title>
              <BodyText size="lg" className="mb-6">
                Onboard, Search, Decide, Negotiate, Close
              </BodyText>
              <div className="mt-4 sm:mt-8">
                <Button
                  onClick={() => setShowAuthModal(true)}
                  variant="olive"
                  size="md"
                  className="w-1/2"
                >
                  Start Now
                </Button>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="z-12 gap-responsive-sm relative mx-auto mt-20 grid w-full max-w-6xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Find Properties",
                description: "Select your preferences and let our AI find the best homes for you",
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
                <Title size="md" as="h3" className="mb-3 w-[87%]">
                  {f.title}
                </Title>
                <BodyText size="sm" muted className="w-[87%]">
                  {f.description}
                </BodyText>
              </div>
            ))}
          </div>

          {/* Footer Links */}
          <div className="gap-responsive-sm text-responsive-xs relative mt-10 flex flex-wrap items-center justify-center text-center">
            <Link
              to={ROUTES.PRIVACY}
              className="px-responsive-xl py-responsive-xs touch-friendly flex items-center justify-center rounded-lg bg-white text-gray-600 shadow transition-all duration-200 hover:text-gray-800 hover:shadow-md"
            >
              Privacy Policy
            </Link>
            <Link
              to={ROUTES.TERMS}
              className="px-responsive-xl py-responsive-xs touch-friendly flex items-center justify-center rounded-lg bg-white text-gray-600 shadow transition-all duration-200 hover:text-gray-800 hover:shadow-md"
            >
              Terms of Service
            </Link>
            <Link
              to={ROUTES.CONTACT}
              className="px-responsive-xl py-responsive-xs touch-friendly flex items-center justify-center rounded-lg bg-white text-gray-600 shadow transition-all duration-200 hover:text-gray-800 hover:shadow-md"
            >
              Contact Us
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
                Account Required
              </div>
              <CloseButton onClick={() => setShowAuthModal(false)} />
            </div>
            <BodyText size="sm" muted className="mb-4 text-center">
              Please log in or create an account to generate a report.
            </BodyText>
            <div className="flex gap-2 sm:gap-3">
              <Button
                onClick={() => {
                  setShowAuthModal(false);
                  navigate("LOGIN");
                }}
                variant="outline"
                size="md"
                fullWidth
              >
                Login
              </Button>
              <Button
                onClick={() => {
                  setShowAuthModal(false);
                  navigate("SIGNUP");
                }}
                variant="primary"
                size="md"
                fullWidth
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
