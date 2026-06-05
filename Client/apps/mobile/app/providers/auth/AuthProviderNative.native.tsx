/**
 * Authentication Provider for React Native.
 * Gates the app until auth bootstrap completes. No useLocation; uses Linking for initial path.
 *
 * Auth / HTTP stack (shared with web): `runAuthBootstrap` → `authApi.verifySession` / `refreshToken`
 * (`packages/features/homeauth/api/handlers/session.ts`) → `apiGet` / `apiPost`
 * (`packages/services/http`) → `HttpClient` + cookie credentials. There is no
 * `BroadcastChannel` on native; session recovery after 401 uses `recoverSessionAfter401`. `getWindow()`
 * is null here, so `handleAuthenticationError` does not set `location.href` (callers still see errors).
 */

import { type ReactNode, useEffect, useRef, useState } from "react";

import { ActivityIndicator, Linking, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { runAuthBootstrap } from "packages/features/homeauth";
import { ClientSettingsBootstrap } from "packages/features/homeauth/components/ClientSettingsBootstrap";
import { log } from "packages/logger";
import { useAuthStore } from "packages/store";
import { Text } from "packages/ui/components/structure/primitives";
import { getSessionStorage } from "packages/utils/core/storage/platformStorage";

type AuthProviderNativeProps = {
  children: ReactNode;
};

const BOOTSTRAP_KEY = "auth_bootstrap_started";

function getInitialPathFromUrl(url: string | null): string {
  if (!url) return "/";
  try {
    const parsed = new URL(url);
    const path = parsed.pathname || "/";
    return path;
  } catch {
    return "/";
  }
}

export function AuthProviderNative({ children }: AuthProviderNativeProps) {
  const [initialPath, setInitialPath] = useState<string>("/");

  const storeAuthStatus = useAuthStore((s) => s.authStatus);
  const authReady = useAuthStore((s) => s.authReady);
  const setStoreAuthStatus = useAuthStore((s) => s.setAuthStatus);
  const setStoreAuthReady = useAuthStore((s) => s.setAuthReady);
  const setStoreUser = useAuthStore((s) => s.setUser);
  const setIsAuthenticated = useAuthStore((s) => s.setIsAuthenticated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const authStatusRef = useRef(storeAuthStatus);
  authStatusRef.current = storeAuthStatus;
  const bootstrapStartedRef = useRef(false);

  useEffect(() => {
    const resolvePath = async () => {
      try {
        const url = await Linking.getInitialURL();
        setInitialPath(getInitialPathFromUrl(url));
      } catch (err) {
        log.error("ERRORS", "AuthProvider getInitialURL failed", err);
        setInitialPath("/");
      }
    };
    void resolvePath();
  }, []);

  useEffect(() => {
    if (bootstrapStartedRef.current) return;
    bootstrapStartedRef.current = true;
    const storage = getSessionStorage();
    storage.setItem(BOOTSTRAP_KEY, "true");
    runAuthBootstrap(initialPath, {
      setStoreAuthStatus,
      setStoreAuthReady,
      setStoreUser,
      setIsAuthenticated,
      getAuthStatusRef: () => authStatusRef.current,
    }).catch((err) => {
      log.error("ERRORS", "Auth bootstrap unexpected rejection", err);
    });
  }, [initialPath, setStoreAuthStatus, setStoreAuthReady, setStoreUser, setIsAuthenticated]);

  if (!authReady || storeAuthStatus === "checking") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={color("primary")} />
        <Text style={styles.loadingLabel}>Checking auth…</Text>
      </View>
    );
  }

  return (
    <>
      {isAuthenticated ? <ClientSettingsBootstrap /> : null}
      {children}
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: color("background-base"),
  },
  loadingLabel: {
    marginTop: 12,
    fontSize: 14,
    color: color("text-secondary"),
  },
});
