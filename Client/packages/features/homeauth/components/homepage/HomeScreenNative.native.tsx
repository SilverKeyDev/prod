/**
 * Mobile auth home — full marketing landing (PR #116 structure) with sign-up CTAs.
 */

import { useEffect, useRef } from "react";

import type { ParamListBase } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { color } from "packages/design-tokens";
import { GoogleSignInButton } from "packages/features/homeauth/components/auth";
import {
  registerLandingScrollTarget,
  scrollToLandingSection,
} from "packages/features/homeauth/utils/landingScroll";
import { LANDING_SECTION_IDS } from "packages/features/homeauth/utils/landingSectionIds";
import { Box, Pressable, ScrollView, Text } from "packages/ui/components/structure/primitives";

import {
  LandingDemoPreview,
  LandingFAQ,
  LandingFinalCTA,
  LandingFooter,
  LandingHero,
  LandingInfoSection,
  LandingNav,
  LandingPartners,
  LandingPricing,
  LandingSavingsCalculator,
  LandingSectionDivider,
} from "./landing";

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

function LandingNativeAuthStrip({ onSignup }: { onSignup: () => void }) {
  return (
    <View style={styles.authStrip}>
      <GoogleSignInButton text="Sign up with Google" />
      <Pressable onPress={onSignup} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Sign up</Text>
      </Pressable>
    </View>
  );
}

export function HomeScreenNative() {
  const navigation = useNavigation<AuthHomeNavigation>();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    registerLandingScrollTarget({
      scrollTo: (options) => scrollRef.current?.scrollTo(options),
      scrollToEnd: (options) => scrollRef.current?.scrollToEnd(options),
    });
    return () => registerLandingScrollTarget(null);
  }, []);

  const goSignup = () => navigation.navigate("Signup");
  const goLogin = () => navigation.navigate("Login");
  const goBookDemo = () => scrollToLandingSection(LANDING_SECTION_IDS.finalCta);

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Box className="bg-background-base min-h-full min-w-0 flex-col">
          <LandingNav onBookDemo={goBookDemo} />
          <Box className="pt-[calc(env(safe-area-inset-top,0px)+3.5rem)]">
            <LandingHero onBookDemo={goBookDemo} />
            <LandingNativeAuthStrip onSignup={goSignup} />
            <LandingDemoPreview />
            <LandingSectionDivider />
            <LandingPartners />
            <LandingSectionDivider />
            <LandingInfoSection />
            <LandingSectionDivider />
            <LandingSavingsCalculator />
            <LandingSectionDivider />
            <LandingPricing />
            <LandingSectionDivider />
            <LandingFAQ />
            <LandingSectionDivider />
            <LandingFinalCTA />
          </Box>
          <LandingFooter />
          <View style={styles.loginRow}>
            <Text style={styles.loginPrompt}>Have an account? </Text>
            <Pressable onPress={goLogin} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.loginLink}>Log in</Text>
            </Pressable>
          </View>
        </Box>
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
  },
  scrollContent: {
    flexGrow: 1,
  },
  authStrip: {
    width: "100%",
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
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
    paddingVertical: 16,
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
});
