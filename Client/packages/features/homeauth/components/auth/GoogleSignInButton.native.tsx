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
  disabled?: boolean;
}

function GoogleIcon() {
  const source =
    Platform.select({
      ios: GOOGLE_SIGN_IN_IOS_SOURCE,
      default: GOOGLE_SIGN_IN_ANDROID_SOURCE,
    }) ?? GOOGLE_SIGN_IN_ANDROID_SOURCE;

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
  disabled = false,
}: GoogleSignInButtonProps) {
  const handlePress = () => {
    if (disabled) return;
    const apiUrl = getEnv().isDevelopment ? "http://localhost:5000" : "https://usesilverkey.com";
    void Linking.openURL(`${apiUrl}/api/v1/auth/google/start`);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.button, disabled && styles.buttonDisabled]}
      accessibilityRole="button"
      disabled={disabled}
    >
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
  buttonDisabled: {
    opacity: 0.45,
  },
  icon: {
    height: 48,
    resizeMode: "contain",
  },
});
