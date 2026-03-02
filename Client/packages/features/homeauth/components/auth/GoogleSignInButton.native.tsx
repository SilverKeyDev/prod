/**
 * Native Google sign-in button. Opens backend Google OAuth URL via Linking.
 * Uses Image (PNG URI) for the Google icon so it displays without react-native-svg.
 */

import React from "react";

import { Linking, Pressable, StyleSheet, View } from "react-native";

import { getEnv } from "packages/config";
import { color } from "packages/design-tokens";
import AppImage from "packages/ui/components/asset/AppImage.native";
import { GOOGLE_ICON_URI } from "packages/ui/components/asset/logoSource.native";
import { Text } from "packages/ui/components/primitives/text";

interface GoogleSignInButtonProps {
  text?: string;
}

function GoogleIcon() {
  return <AppImage uri={GOOGLE_ICON_URI} style={styles.icon} resizeMode="contain" alt="Google" />;
}

export default function GoogleSignInButton({
  text = "Sign up with Google",
}: GoogleSignInButtonProps) {
  const handlePress = () => {
    const apiUrl = getEnv().isDevelopment ? "http://localhost:5000" : "https://usesilverkey.com";
    void Linking.openURL(`${apiUrl}/api/v1/auth/google/start`);
  };

  return (
    <Pressable onPress={handlePress} style={styles.button}>
      <View style={styles.content}>
        <GoogleIcon />
        <Text style={styles.label}>{text}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: color("neutral.50"),
    borderWidth: 1,
    borderColor: color("neutral.300"),
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  icon: {
    width: 22,
    height: 22,
    flexShrink: 0,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: color("neutral.700"),
  },
});
