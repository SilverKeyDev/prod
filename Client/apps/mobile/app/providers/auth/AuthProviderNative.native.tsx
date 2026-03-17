/**
 * Authentication Provider for React Native.
 * Gates the app until auth bootstrap completes. No useLocation; uses Linking for initial path.
 */

import { type ReactNode, useEffect, useRef, useState } from "react";

import { ActivityIndicator, Linking, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { runAuthBootstrap } from "packages/features/homeauth";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useAuthStore } from "packages/store";
import { Text } from "packages/ui/components/primitives";
import { getSessionStorage } from "packages/utils/storage/platformStorage";

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

  const authStatusRef = useRef(storeAuthStatus);
  authStatusRef.current = storeAuthStatus;
  const bootstrapStartedRef = useRef(false);

  useEffect(() => {
    const resolvePath = async () => {
      try {
        const url = await Linking.getInitialURL();
        setInitialPath(getInitialPathFromUrl(url));
      } catch (err) {
        log.error(LOG_CATEGORIES.ERRORS, "AuthProvider getInitialURL failed", err);
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
      log.error(LOG_CATEGORIES.ERRORS, "Auth bootstrap unexpected rejection", err);
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

  return <>{children}</>;
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
