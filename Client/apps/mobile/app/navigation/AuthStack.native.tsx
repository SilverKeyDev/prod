import { useRef } from "react";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import {
  ContactUsScreenNative,
  ForgotPasswordScreenNative,
  HomeScreenNative,
  LoginScreenNative,
  OnboardingScreenNative,
  PrivacyPolicyScreenNative,
  SignupScreenNative,
  TermsOfServiceScreenNative,
  VerificationScreenNative,
} from "packages/features/homeauth";
import { useAuthStore } from "packages/store";

function OnboardingScreenWrapper() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const userRef = useRef(user);
  userRef.current = user;
  const onSubmitSuccess = () => {
    const current = userRef.current;
    if (current) setUser({ ...current, has_preferences: true });
  };
  return <OnboardingScreenNative onSubmitSuccess={onSubmitSuccess} />;
}

export type AuthStackScreenParams = { title?: string };

export type AuthStackParamList = {
  Home: AuthStackScreenParams;
  Login: AuthStackScreenParams;
  Signup: AuthStackScreenParams;
  ForgotPassword: AuthStackScreenParams;
  Onboarding: AuthStackScreenParams;
  Verification: AuthStackScreenParams;
  Privacy: AuthStackScreenParams;
  Terms: AuthStackScreenParams;
  Contact: AuthStackScreenParams;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        contentStyle: { backgroundColor: "#f5f5f0", flex: 1 },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreenNative} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreenNative} options={{ title: "Log in" }} />
      <Stack.Screen name="Signup" component={SignupScreenNative} options={{ title: "Sign up" }} />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreenNative}
        options={{ title: "Forgot password" }}
      />
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreenWrapper}
        options={{ title: "Onboarding" }}
      />
      <Stack.Screen
        name="Verification"
        component={VerificationScreenNative}
        options={{ title: "Verify" }}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacyPolicyScreenNative}
        options={{ title: "Privacy" }}
      />
      <Stack.Screen
        name="Terms"
        component={TermsOfServiceScreenNative}
        options={{ title: "Terms" }}
      />
      <Stack.Screen
        name="Contact"
        component={ContactUsScreenNative}
        options={{ title: "Contact" }}
      />
    </Stack.Navigator>
  );
}

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;
