/// <reference types="google.maps" />
import { useEffect, useState } from "react";

import { Icon } from "@ui/icons";

import { log, LOG_CATEGORIES } from "packages/logger";
import { Link, ROUTES, useNavigation } from "packages/navigation";
import type { AutocompleteSuggestion } from "packages/schemas/google-maps";
import { LOGO } from "packages/ui/components/asset";
import { RippleBackground } from "packages/ui/components/backgrounds";
import { Box, Image } from "packages/ui/components/primitives";
import { asError } from "packages/utils/error";
import { getWindow } from "packages/utils/platform";

import { BodyText, Button, CloseButton, Title } from "@/components/ui";
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
          ? (
              win as unknown as {
                google?: {
                  maps?: {
                    places?: unknown;
                  };
                };
              }
            ).google
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
          (
            s:
              | AutocompleteSuggestion
              | {
                  placePrediction: unknown;
                }
          ) => {
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
    <Box className="hide-scrollbar bg-background-surface flex min-h-screen flex-col">
      {/* Header */}
      <header className="px-responsive-sm border-border bg-background-surface fixed left-0 right-0 top-0 z-50 flex w-full items-center justify-between border-b py-2 shadow-lg sm:py-3">
        <Image src={LOGO} alt="SilverKey Logo" className="h-8 w-auto" />
        <Box className="text-responsive-sm flex gap-1.5 font-medium sm:gap-2">
          <Link
            to={ROUTES.LOGIN}
            className="rounded-md px-3 py-2 hover:underline sm:px-4 sm:py-2.5 md:px-5"
          >
            Login
          </Link>
          <Link
            to={ROUTES.SIGNUP}
            className="bg-accent hover:bg-accent-hover rounded-md px-3 py-2 text-white transition-colors sm:px-4 sm:py-2.5"
          >
            Sign Up
          </Link>
        </Box>
      </header>

      {/* Spacer for fixed header */}
      <Box className="h-16 flex-shrink-0 sm:h-20"></Box>

      {/* Hero Section */}
      <main className="px-responsive-sm py-responsive-lg relative flex flex-1 flex-col items-center justify-center">
        <Box className="absolute inset-0 z-0">
          <RippleBackground />
        </Box>

        {/* Centered Content Wrapper */}
        <Box className="relative z-10 mx-auto flex w-full max-w-[85%] flex-col items-center">
          <Box className="mx-auto w-full max-w-3xl text-center">
            <Box className="bg-background-surface rounded-lg p-6 shadow-lg sm:p-8">
              <Title size="xl" as="h1" className="mb-4">
                Discover a New Way to Buy
              </Title>
              <BodyText size="lg" className="mb-6">
                Onboard, Search, Decide, Negotiate, Close
              </BodyText>
            </Box>
          </Box>

          {/* Feature Cards */}
          <Box className="z-12 gap-responsive-sm relative mx-auto mt-20 grid w-full max-w-6xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Find Properties",
                description: "Select your preferences and let our AI find the best homes for you",
                icon: <Icon name="building-2" className="mobile-icon-lg text-text-secondary" />,
              },
              {
                title: "Decide on a Home",
                description:
                  "Input the facts of homes into spreadsheets or reports and get detailed analysis of the neighborhood.",
                icon: <Icon name="bar-chart-2" className="mobile-icon-lg text-text-secondary" />,
              },
              {
                title: "Negotiate",
                description:
                  "Analyze the market and home to draft a competitive offer and automate the associated paperwork.",
                icon: <Icon name="lightbulb" className="mobile-icon-lg text-text-secondary" />,
              },
              {
                title: "Purchase",
                description:
                  "Use our timelines and paperwork to find and submit the appropriate paperwork, disclosures, etc, without paying legal fees.",
                icon: <Icon name="folder-lock" className="mobile-icon-lg text-text-secondary" />,
              },
            ].map((f, i) => (
              <Box
                key={i}
                className="touch-friendly bg-background-surface flex cursor-pointer flex-col items-center rounded-xl p-4 text-center shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-5"
              >
                <Box className="mb-2">{f.icon}</Box>
                <Title size="md" as="h3" className="mb-3 w-[87%]">
                  {f.title}
                </Title>
                <BodyText size="sm" muted className="w-[87%]">
                  {f.description}
                </BodyText>
              </Box>
            ))}
          </Box>

          {/* Footer Links */}
          <Box className="gap-responsive-sm text-responsive-xs relative mt-10 flex flex-wrap items-center justify-center text-center">
            <Link
              to={ROUTES.PRIVACY}
              className="px-responsive-xl py-responsive-xs touch-friendly bg-background-surface text-text-secondary hover:text-text-primary flex items-center justify-center rounded-lg shadow transition-all duration-200 hover:shadow-md"
            >
              Privacy Policy
            </Link>
            <Link
              to={ROUTES.TERMS}
              className="px-responsive-xl py-responsive-xs touch-friendly bg-background-surface text-text-secondary hover:text-text-primary flex items-center justify-center rounded-lg shadow transition-all duration-200 hover:shadow-md"
            >
              Terms of Service
            </Link>
            <Link
              to={ROUTES.CONTACT}
              className="px-responsive-xl py-responsive-xs touch-friendly bg-background-surface text-text-secondary hover:text-text-primary flex items-center justify-center rounded-lg shadow transition-all duration-200 hover:shadow-md"
            >
              Contact Us
            </Link>
          </Box>
        </Box>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <Box className="space-responsive-sm fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Box className="space-responsive-lg bg-background-surface w-full max-w-md rounded-2xl shadow">
            <Box className="mb-4 flex justify-between">
              <Box className="gap-responsive-xs flex items-center">
                <Icon name="lock" className="mobile-icon-sm text-text-secondary" />
                Account Required
              </Box>
              <CloseButton onClick={() => setShowAuthModal(false)} />
            </Box>
            <BodyText size="sm" muted className="mb-4 text-center">
              Please log in or create an account to generate a report.
            </BodyText>
            <Box className="flex gap-2 sm:gap-3">
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
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
