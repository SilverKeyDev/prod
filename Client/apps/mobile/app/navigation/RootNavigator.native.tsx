import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet } from "react-native";

import { OnboardingScreenNative } from "packages/features/homeauth/native";
import { useAuthStore } from "packages/store";

import { AppStackIntegrations } from "../providers/AppStackIntegrations.native";
import { AppStack } from "./AppStack.native";
import { AuthStack } from "./AuthStack.native";
import { rootNavigationRef } from "./rootNavigationRef.native";
import { useDeepLink } from "./useDeepLink.native";

type AuthenticatedStackParamList = {
  Onboarding: undefined;
  Main: undefined;
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
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = authStatus === "authenticated";

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  const initialRoute: keyof AuthenticatedStackParamList =
    user?.has_preferences === true ? "Main" : "Onboarding";

  return (
    <AuthenticatedStack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        contentStyle: { flex: 1 },
      }}
    >
      <AuthenticatedStack.Screen name="Onboarding" component={OnboardingScreenWrapper} />
      <AuthenticatedStack.Screen name="Main" component={MainScreen} />
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
