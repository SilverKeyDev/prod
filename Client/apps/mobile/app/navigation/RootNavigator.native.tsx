import { useRef } from "react";

import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet } from "react-native";

import { AgentProfileScreenNative } from "packages/features/agent";
import { OnboardingScreenNative } from "packages/features/homeauth";
import { PropertyDetailsScreenNative } from "packages/features/propertyDetails";
import type {
  AgentProfileScreenParams,
  PropertyDetailsScreenParams,
} from "packages/navigation/types";
import { useAuthStore } from "packages/store";

import { AppStackIntegrations } from "../providers/AppStackIntegrations.native";
import { AppStack } from "./AppStack.native";
import { AuthStack } from "./AuthStack.native";
import { rootNavigationRef } from "./rootNavigationRef.native";
import { useDeepLink } from "./useDeepLink.native";

type AuthenticatedStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  PropertyDetails: PropertyDetailsScreenParams;
  AgentProfile: AgentProfileScreenParams;
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
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const userRef = useRef(user);
  userRef.current = user;
  const onSubmitSuccess = () => {
    const current = userRef.current;
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
      <AuthenticatedStack.Screen
        name="AgentProfile"
        component={AgentProfileScreenNative}
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
