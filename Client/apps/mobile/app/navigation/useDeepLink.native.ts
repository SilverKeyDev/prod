import { useEffect } from "react";

import { Linking } from "react-native";

import { log } from "packages/logger";
import { useAuthStore } from "packages/store";
import { getPathnameFromUrl, resolveDeepLinkTarget } from "packages/utils/navigation";

import { rootNavigationRef } from "./rootNavigationRef.native";

function navigateToResolvedTarget(pathname: string, isAuthenticated: boolean): void {
  if (!rootNavigationRef.isReady()) return;
  const normalized = pathname.replace(/\/$/, "") || "/";
  const target = resolveDeepLinkTarget(normalized, isAuthenticated);
  if (!target) return;
  if (target.type === "app") {
    rootNavigationRef.navigate("Main", { screen: target.tab } as never);
    return;
  }
  if (target.type === "rootStack") {
    rootNavigationRef.navigate(target.screen as never, (target.params ?? undefined) as never);
    return;
  }
  rootNavigationRef.navigate(target.screen as never);
}

export function useDeepLink() {
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      try {
        const pathname = getPathnameFromUrl(url);
        const isAuthenticated = useAuthStore.getState().authStatus === "authenticated";
        navigateToResolvedTarget(pathname, isAuthenticated);
      } catch (err) {
        log.error("ERRORS", "Deep link handleUrl failed", err);
      }
    };

    Linking.getInitialURL()
      .then(handleUrl)
      .catch((err) => {
        log.error("ERRORS", "Deep link getInitialURL failed", err);
      });
    const sub = Linking.addEventListener("url", (e) => {
      try {
        handleUrl(e.url);
      } catch (err) {
        log.error("ERRORS", "Deep link url event failed", err);
      }
    });

    return () => sub.remove();
  }, []);
}
