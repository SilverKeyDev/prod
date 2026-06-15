import { useCallback, useEffect, useState } from "react";

import * as SplashScreen from "expo-splash-screen";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { useAuthStoreIntegration } from "packages/features/homeauth/hooks/store/useAuthStoreIntegration";
import { useHealthCheck, useSessionTimeout } from "packages/hooks/ui";
import { Text } from "packages/ui/components/structure/primitives";

import { RootNavigator } from "./navigation/RootNavigator.native";
import { MaintenanceScreenNative } from "./screens/MaintenanceScreen.native";

/**
 * Content after auth is ready: wait for health check, show maintenance or navigator.
 * Session timeout with onLogout so RN can clear auth store and show Auth stack.
 */
export function AppContent() {
  const [loading, setLoading] = useState(true);
  const { maintenance, healthCheckComplete } = useHealthCheck();

  const { logout: authLogout } = useAuthStoreIntegration();

  const handleSessionTimeoutLogout = useCallback(() => {
    void authLogout();
  }, [authLogout]);

  useSessionTimeout({ onLogout: handleSessionTimeoutLogout });

  useEffect(() => {
    if (healthCheckComplete) {
      const timer = setTimeout(() => {
        setLoading(false);
        void SplashScreen.hideAsync();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [healthCheckComplete]);

  // Safety: if health check hangs (e.g. backend unreachable), stop loading and hide splash after max wait
  useEffect(() => {
    const maxWaitMs = 12_000;
    const timer = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          void SplashScreen.hideAsync();
          return false;
        }
        return prev;
      });
    }, maxWaitMs);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={color("primary")} />
        <Text style={styles.loadingLabel}>Loading…</Text>
      </View>
    );
  }

  if (maintenance) {
    return <MaintenanceScreenNative />;
  }

  return <RootNavigator />;
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
