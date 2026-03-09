/**
 * Native Google sign-in button. Opens backend Google OAuth URL via Linking.
 * Uses Image (PNG URI) for the Google icon so it displays without react-native-svg.
 */

import React from "react";

import { Linking, Platform, Pressable, StyleSheet } from "react-native";

import { getEnv } from "packages/config";
import AppImage from "packages/ui/components/asset/AppImage.native";
import {
  GOOGLE_SIGN_IN_ANDROID_SOURCE,
  GOOGLE_SIGN_IN_IOS_SOURCE,
} from "packages/ui/components/asset/logoSource.native";

interface GoogleSignInButtonProps {
  text?: string;
}

function GoogleIcon() {
  // Asset selection by platform (icon asset), not feature gating — rule expects useFeature for rollout
  // eslint-disable-next-line silverkey/no-platform-feature-check
  const source = Platform.OS === "ios" ? GOOGLE_SIGN_IN_IOS_SOURCE : GOOGLE_SIGN_IN_ANDROID_SOURCE;

  return (
    <AppImage
      source={source}
      style={styles.icon}
      resizeMode="contain"
      alt="Sign up with Google"
      accessibilityRole="image"
    />
  );
}

export default function GoogleSignInButton({
  text: _text = "Sign up with Google",
}: GoogleSignInButtonProps) {
  const handlePress = () => {
    const apiUrl = getEnv().isDevelopment ? "http://localhost:5000" : "https://usesilverkey.com";
    void Linking.openURL(`${apiUrl}/api/v1/auth/google/start`);
  };

  return (
    <Pressable onPress={handlePress} style={styles.button} accessibilityRole="button">
      <GoogleIcon />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  icon: {
    height: 48,
    resizeMode: "contain",
  },
});
