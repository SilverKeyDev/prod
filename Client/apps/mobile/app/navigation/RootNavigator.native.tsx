import { useEffect } from "react";

import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet } from "react-native";

import { OnboardingScreenNative } from "packages/features/homeauth/native";
import { PropertyDetailsScreenNative } from "packages/features/propertyDetails/native";
import { useAuthStore } from "packages/store";

import { AppStackIntegrations } from "../providers/AppStackIntegrations.native";
import { AppStack } from "./AppStack.native";
import { AuthStack } from "./AuthStack.native";
import { rootNavigationRef } from "./rootNavigationRef.native";
import { useDeepLink } from "./useDeepLink.native";

type PropertyDetailsScreenParams = {
  address: string;
  propertyId?: string;
};

type AuthenticatedStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  PropertyDetails: PropertyDetailsScreenParams;
};

const AuthenticatedStack = createNativeStackNavigator<AuthenticatedStackParamList>();

function OnboardingScreenWrapper() {
  const navigation = useNavigation<{
    navigate: (name: keyof AuthenticatedStackParamList) => void;
    reset: (state: {
      index: number;
      routes: { name: keyof AuthenticatedStackParamList }[];
    }) => void;
  }>();
  const setUser = useAuthStore((s) => s.setUser);
  const onSubmitSuccess = () => {
    const current = useAuthStore.getState().user;
    if (current) setUser({ ...current, has_preferences: true });
    navigation.reset({ index: 0, routes: [{ name: "Main" }] });
  };
  return <OnboardingScreenNative onSubmitSuccess={onSubmitSuccess} />;
}

function MainScreen() {
  return (
    <AppStackIntegrations>
      <AppStack />
    </AppStackIntegrations>
  );
}

function RootContent() {
  useDeepLink();
  const authStatus = useAuthStore((s) => s.authStatus);
  const isAuthenticated = authStatus === "authenticated";
  const postAuthRedirectPath = useAuthStore((s) => s.postAuthRedirectPath);
  const setPostAuthRedirectPath = useAuthStore((s) => s.setPostAuthRedirectPath);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!postAuthRedirectPath) return;
    if (!rootNavigationRef.isReady()) return;
    const normalized = postAuthRedirectPath.replace(/\/$/, "") || "/";
    if (normalized === "/search") {
      rootNavigationRef.navigate("Search" as never);
    } else if (normalized === "/onboarding") {
      rootNavigationRef.navigate("Onboarding" as never);
    }
    setPostAuthRedirectPath(null);
  }, [isAuthenticated, postAuthRedirectPath, setPostAuthRedirectPath]);

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  return (
    <AuthenticatedStack.Navigator
      initialRouteName="Main"
      screenOptions={{
        headerShown: false,
        contentStyle: { flex: 1 },
      }}
    >
      <AuthenticatedStack.Screen name="Onboarding" component={OnboardingScreenWrapper} />
      <AuthenticatedStack.Screen name="Main" component={MainScreen} />
      <AuthenticatedStack.Screen
        name="PropertyDetails"
        component={PropertyDetailsScreenNative}
        options={{ headerShown: false }}
      />
    </AuthenticatedStack.Navigator>
  );
}

/**
 * Root navigator: shows AuthStack when unauthenticated, AppStack (tabs) when authenticated.
 * App stack is wrapped with store integrations. Deep link handler runs on mount.
 */
export function RootNavigator() {
  return (
    <NavigationContainer ref={rootNavigationRef} style={styles.container}>
      <RootContent />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
