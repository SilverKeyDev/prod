import React from "react";

import { StyleSheet } from "react-native";

import { color } from "packages/design-tokens";
import { useNavigation } from "packages/navigation";
import { Text } from "packages/ui/components/structure/primitives";

import type { AuthTermsDisclaimerFlow } from "./AuthTermsDisclaimer";

type AuthTermsDisclaimerProps = {
  flow: AuthTermsDisclaimerFlow;
};

const FLOW_COPY: Record<AuthTermsDisclaimerFlow, string> = {
  login: "signing in",
  signup: "signing up",
};

export function AuthTermsDisclaimer({ flow }: AuthTermsDisclaimerProps) {
  const navigation = useNavigation<{ navigate: (screen: string) => void }>();
  const action = FLOW_COPY[flow];

  return (
    <Text style={styles.text}>
      By {action} (including with Google), you agree to our{" "}
      <Text onPress={() => navigation.navigate("Terms")} style={styles.link}>
        Terms of Service
      </Text>{" "}
      and{" "}
      <Text onPress={() => navigation.navigate("Privacy")} style={styles.link}>
        Privacy Policy
      </Text>
      .
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
    lineHeight: 18,
    color: color("neutral.600"),
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  link: {
    color: color("brand.accent"),
    fontWeight: "600",
  },
});
