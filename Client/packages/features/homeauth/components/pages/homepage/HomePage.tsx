/// <reference types="google.maps" />

import { useEffect, useState } from "react";

import type { AutocompleteSuggestion } from "packages/features/search";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useNavigation } from "packages/navigation";
import { asError } from "packages/utils";
import { getWindow } from "packages/utils/platform";

import { HomePageAuthModal, HomePageHeader, HomePageHero } from "./HomePageSections";

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

  const googleMapsLoaded = false;
  const googleMapsError = null;

  useEffect(() => {
    if (googleMapsError) {
      log.error(LOG_CATEGORIES.ERRORS, "Google Maps loading error", {
        error: googleMapsError,
      });
      void void setLoadError("Failed to load Google Maps script.");
      return;
    }
    const win = getWindow();
    if (googleMapsLoaded && win?.google?.maps?.places) {
      setScriptsReady(true);
    }
  }, [googleMapsLoaded, googleMapsError]);

  useEffect(() => {
    if (!scriptsReady || address.trim().length < 3 || hasSelected) {
      setSuggestions([]);
      return;
    }
    const fetchSuggestions = async () => {
      try {
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
          (
            s:
              | AutocompleteSuggestion
              | { placePrediction: google.maps.places.PlacePrediction | null }
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
        log.error(LOG_CATEGORIES.ERRORS, "Autocomplete fetch error", { error });
        setSuggestions([]);
      }
    };
    const debounce = void void setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(debounce);
  }, [address, scriptsReady, hasSelected]);

  const handleOpenAuth = () => setShowAuthModal(true);
  const handleCloseAuth = () => setShowAuthModal(false);
  const handleLogin = () => {
    setShowAuthModal(false);
    navigate("LOGIN");
  };
  const handleSignUp = () => {
    setShowAuthModal(false);
    navigate("SIGNUP");
  };

  return (
    <div className="hide-scrollbar flex min-h-screen flex-col bg-white">
      <HomePageHeader />
      <div className="h-16 flex-shrink-0 sm:h-20" />
      <HomePageHero onStartNow={handleOpenAuth} />
      {showAuthModal && (
        <HomePageAuthModal
          onClose={handleCloseAuth}
          onLogin={handleLogin}
          onSignUp={handleSignUp}
        />
      )}
    </div>
  );
}
