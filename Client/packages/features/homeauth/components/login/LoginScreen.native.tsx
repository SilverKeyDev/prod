/**
 * Native login screen. Uses same useSecureAuth and navigation as web LoginFeature.
 */

import React, { useState } from "react";

import { StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { GoogleSignInButton } from "packages/features/homeauth/components/auth";
import AuthPageLayoutNative from "packages/features/homeauth/components/core/AuthPageLayout.native";
import AuthDivider from "packages/features/homeauth/components/core/Divider";
import AuthLink from "packages/features/homeauth/components/core/Link";
import { useSecureAuth } from "packages/features/homeauth/hooks/data/useSecureAuth";
import { applyLoginResult } from "packages/features/homeauth/utils/applyLoginResult";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useNavigation } from "packages/navigation";
import { Pressable } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives/box";
import { Input } from "packages/ui/components/primitives/input";
import { Text } from "packages/ui/components/primitives/text";

export function LoginScreenNative() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { navigate } = useNavigation();
  const { login, isLoading, error, clearError } = useSecureAuth();

  const handleSubmit = async () => {
    clearError();
    const result = await login(email, password);

    if (!result.success && !result.needsVerification) {
      log.error(LOG_CATEGORIES.AUTH, "Login failed, not navigating");
      return;
    }

    applyLoginResult(result, {
      email,
      password,
      onNeedsVerification: () =>
        navigate("VERIFICATION", undefined, { state: { email, fromLogin: true } }),
    });
  };

  return (
    <AuthPageLayoutNative
      title="Welcome back"
      subtitle="Continue your home search journey"
      backButtonText="Back to Home"
      error={error ?? undefined}
    >
      <Box style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <Input
          value={email}
          onValueChange={setEmail}
          placeholder="Enter your email"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          label="Email"
        />
      </Box>
      <Box style={styles.field}>
        <Text style={styles.label}>Password</Text>
        <Input
          value={password}
          onValueChange={setPassword}
          placeholder="Enter your password"
          secureTextEntry
          autoComplete="password"
          label="Password"
        />
      </Box>

      <Pressable
        onPress={handleSubmit}
        disabled={isLoading}
        style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
      >
        <Text style={styles.primaryButtonText}>{isLoading ? "Signing in…" : "Login"}</Text>
      </Pressable>

      <AuthDivider />

      <GoogleSignInButton text="Sign up with Google" />

      <View style={styles.links}>
        <AuthLink to="/signup">
          <Text style={styles.inlineLink}>Create an account</Text>
        </AuthLink>
        <AuthLink to="/forgot-password">
          <Text style={styles.inlineLink}>Forgot password?</Text>
        </AuthLink>
      </View>
    </AuthPageLayoutNative>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: color("neutral.700"),
    marginBottom: 6,
  },
  primaryButton: {
    backgroundColor: color("brand.accent"),
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: color("neutral.50"),
  },
  links: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
  },
  inlineLink: {
    fontSize: 14,
    color: color("neutral.600"),
  },
});
