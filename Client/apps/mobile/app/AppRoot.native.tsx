import React, { useCallback, useEffect, useState } from "react";

import { CommonActions } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { color } from "packages/design-tokens";
import { log, LOG_CATEGORIES } from "packages/logger";
import { Text } from "packages/ui/components/primitives";

import { runPlatformBootstrap } from "@/bootstrap/platformBootstrap.native";

import { AppContent } from "./AppContent.native";
import { ToastsPortalNative } from "./components/ToastsPortalNative.native";
import { ErrorBoundaryNative } from "./error/ErrorBoundaryNative.native";
import { rootNavigationRef } from "./navigation/rootNavigationRef.native";
import { CoreProvidersNative } from "./providers/CoreProvidersNative.native";

/** Optional KeyboardProvider from react-native-keyboard-controller. Loaded after mount to avoid blocking bridge init (scene-update watchdog). */
type KeyboardProviderType = React.ComponentType<{ children: React.ReactNode }> | null;
function useKeyboardProvider(): KeyboardProviderType {
  const [Provider, setProvider] = useState<KeyboardProviderType>(null);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    let mounted = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const module = require("react-native-keyboard-controller");
      const Comp = module?.KeyboardProvider ?? null;
      // Only use as provider if it's a valid component (avoids "Cannot read property 'children' of null")
      const valid = typeof Comp === "function" ? Comp : null;
      if (mounted) setProvider(valid);
    } catch {
      if (mounted) setProvider(null);
    }
    return () => {
      mounted = false;
    };
  }, []);
  return Provider;
}

/** Wraps KeyboardProvider so a parent-passed ref is consumed on a host View. On native we never use KeyboardProvider (avoids "Cannot read property 'children' of null"); on web, use it only when the module is linked. */
function KeyboardProviderRefSafe({
  children,
  keyboardProvider,
}: {
  children: React.ReactNode;
  keyboardProvider: KeyboardProviderType;
}) {
  const content = (
    <View collapsable={false} style={styles.keyboardProviderWrapper}>
      {children}
    </View>
  );
  if (Platform.OS !== "web") return content;
  if (!keyboardProvider || typeof keyboardProvider !== "function") return content;
  const KeyboardProvider = keyboardProvider;
  return (
    <View collapsable={false} style={styles.keyboardProviderWrapper}>
      <KeyboardProvider>{children}</KeyboardProvider>
    </View>
  );
}

SplashScreen.preventAutoHideAsync();

export function AppRoot() {
  const [bootstrapped, setBootstrapped] = useState(false);
  const keyboardProvider = useKeyboardProvider();

  useEffect(() => {
    runPlatformBootstrap()
      .then(() => setBootstrapped(true))
      .catch((err) => {
        log.error(LOG_CATEGORIES.ERRORS, "Platform bootstrap failed", err);
        setBootstrapped(true);
      });
  }, []);

  const onGoHome = useCallback(() => {
    if (rootNavigationRef.isReady()) {
      const state = rootNavigationRef.getRootState();
      const firstRoute = state?.routes?.[0];
      if (firstRoute && state) {
        rootNavigationRef.dispatch(
          CommonActions.reset({
            ...state,
            index: 0,
            routes: [firstRoute],
          })
        );
      }
    }
  }, []);

  const onRootError = useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    if (
      error instanceof TypeError &&
      error.message.includes("children") &&
      error.message.includes("null")
    ) {
      log.error(LOG_CATEGORIES.ERRORS, "AppRoot: children-of-null TypeError", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }, []);

  if (!bootstrapped) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={color("brand.accent")} />
        <Text style={styles.loadingLabel}>Loading…</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  // Always a valid React node so no downstream component ever receives null/undefined children.
  const appContent = (
    <View style={styles.flex1} collapsable={false}>
      <AppContent />
      <ToastsPortalNative />
      <StatusBar style="auto" />
    </View>
  );
  return (
    <View style={styles.root}>
      <ErrorBoundaryNative onGoHome={onGoHome} onError={onRootError}>
        <SafeAreaProvider style={styles.flex1}>
          <SafeAreaView style={styles.flex1} edges={["top"]}>
            <KeyboardProviderRefSafe keyboardProvider={keyboardProvider}>
              <CoreProvidersNative onGoHome={onGoHome}>{appContent}</CoreProvidersNative>
            </KeyboardProviderRefSafe>
          </SafeAreaView>
        </SafeAreaProvider>
      </ErrorBoundaryNative>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color("neutral.50"),
  },
  flex1: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: color("neutral.50"),
  },
  loadingLabel: {
    marginTop: 12,
    fontSize: 14,
    color: color("neutral.600"),
  },
  keyboardProviderWrapper: {
    flex: 1,
  },
});
