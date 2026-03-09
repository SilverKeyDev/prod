import { useEffect } from "react";

import { Linking } from "react-native";

import { log, LOG_CATEGORIES } from "packages/logger";
import { useAuthStore } from "packages/store";

import { rootNavigationRef } from "./rootNavigationRef.native";

const AUTH_SCREENS: Record<string, string> = {
  "/": "Home",
  "/login": "Login",
  "/signup": "Signup",
  "/forgot-password": "ForgotPassword",
  "/onboarding": "Onboarding",
  "/verification": "Verification",
  "/privacy": "Privacy",
  "/terms": "Terms",
  "/contact": "Contact",
};

const APP_TABS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/search": "Search",
  "/saved": "Saved",
  "/messaging": "Messaging",
  "/profile": "Profile",
};

function getPathnameFromUrl(url: string | null): string {
  if (!url) return "/";
  try {
    const parsed = new URL(url);
    return parsed.pathname || "/";
  } catch {
    return "/";
  }
}

function navigateToPath(pathname: string) {
  if (!rootNavigationRef.isReady()) return;
  const isAuthenticated = useAuthStore.getState().authStatus === "authenticated";
  const normalized = pathname.replace(/\/$/, "") || "/";

  if (isAuthenticated) {
    const tab = APP_TABS[normalized] ?? (normalized === "/settings" ? "Profile" : null);
    if (tab) {
      // Root is AuthenticatedStack (Onboarding, Main, PropertyDetails). Tabs live inside Main.
      rootNavigationRef.navigate("Main", { screen: tab } as never);
    }
    return;
  }

  const screen = AUTH_SCREENS[normalized] ?? AUTH_SCREENS["/"];
  rootNavigationRef.navigate(screen as never);
}

export function useDeepLink() {
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      try {
        const pathname = getPathnameFromUrl(url);
        navigateToPath(pathname);
      } catch (err) {
        log.error(LOG_CATEGORIES.ERRORS, "Deep link handleUrl failed", err);
      }
    };

    Linking.getInitialURL()
      .then(handleUrl)
      .catch((err) => {
        log.error(LOG_CATEGORIES.ERRORS, "Deep link getInitialURL failed", err);
      });
    const sub = Linking.addEventListener("url", (e) => {
      try {
        handleUrl(e.url);
      } catch (err) {
        log.error(LOG_CATEGORIES.ERRORS, "Deep link url event failed", err);
      }
    });

    return () => sub.remove();
  }, []);
}
