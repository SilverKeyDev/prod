/**
 * Mobile-only Auth home / landing screen.
 * Instagram-style: rippled background, centered logo + buttons, Log in link at bottom.
 */

import React from "react";

import type { ParamListBase } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { color } from "packages/design-tokens";
import { GoogleSignInButton } from "packages/features/homeauth/components/auth";
import AppImage from "packages/ui/components/asset/AppImage.native";
import { LOGO_SOURCE } from "packages/ui/components/asset/logoSource.native";
import { RippleBackground } from "packages/ui/components/backgrounds";
import { ScrollView } from "packages/ui/components/primitives";
import { Pressable } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";

/** Minimal auth stack screen names we navigate to from Home. Matches AuthStackParamList in apps/mobile. */
type AuthHomeNavigation = NativeStackNavigationProp<
  ParamListBase & {
    Login: undefined;
    Signup: undefined;
    Privacy: undefined;
    Terms: undefined;
    Contact: undefined;
  },
  "Home"
>;

export function HomeScreenNative() {
  const navigation = useNavigation<AuthHomeNavigation>();

  return (
    <SafeAreaView
      style={styles.root}
      edges={["top", "left", "right", "bottom"]}
    >
      <RippleBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centerBlock}>
          <AppImage
            source={LOGO_SOURCE}
            style={styles.logo}
            resizeMode="contain"
            alt="SilverKey"
          />

          <View style={styles.actions}>
            <GoogleSignInButton text="Sign up with Google" />
            <Pressable
              onPress={() => navigation.navigate("Signup")}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Sign up</Text>
            </Pressable>
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginPrompt}>Have an account? </Text>
            <Pressable
              onPress={() => navigation.navigate("Login")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.loginLink}>Log in</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            onPress={() => navigation.navigate("Privacy")}
            style={styles.footerLink}
          >
            <Text style={styles.footerLinkText}>Privacy</Text>
          </Pressable>
          <Text style={styles.footerDot}> · </Text>
          <Pressable
            onPress={() => navigation.navigate("Terms")}
            style={styles.footerLink}
          >
            <Text style={styles.footerLinkText}>Terms</Text>
          </Pressable>
          <Text style={styles.footerDot}> · </Text>
          <Pressable
            onPress={() => navigation.navigate("Contact")}
            style={styles.footerLink}
          >
            <Text style={styles.footerLinkText}>Contact</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color("neutral.50"),
  },
  scroll: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 48,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  centerBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 200,
    height: 72,
    marginBottom: 48,
  },
  actions: {
    width: "100%",
    alignItems: "stretch",
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: color("brand.accent"),
    minHeight: 44,
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: color("neutral.50"),
  },
  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loginPrompt: {
    fontSize: 14,
    color: color("neutral.600"),
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "600",
    color: color("brand.accent"),
  },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 16,
  },
  footerLink: {
    minHeight: 44,
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  footerLinkText: {
    fontSize: 12,
    color: color("neutral.500"),
  },
  footerDot: {
    fontSize: 12,
    color: color("neutral.400"),
  },
});
