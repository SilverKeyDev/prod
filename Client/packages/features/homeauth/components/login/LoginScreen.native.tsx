/**
 * Native login screen. Uses same useSecureAuth and navigation as web LoginFeature.
 */

import React, { useState } from "react";

import KeyTurnLoader from "@ui/asset/loading/KeyTurnLoader";
import Input from "@ui/form/Input";
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
import { Box } from "packages/ui/components/primitives";
import { Pressable } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives";

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
        <Input
          value={password}
          onValueChange={setPassword}
          placeholder="Enter your password"
          secureTextEntry
          autoComplete="password"
          label="Password"
          showPasswordToggle
        />
      </Box>

      <Pressable
        onPress={handleSubmit}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityState={{ busy: isLoading }}
        style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
      >
        {isLoading ? (
          <KeyTurnLoader message="" />
        ) : (
          <Text style={styles.primaryButtonText}>Login</Text>
        )}
      </Pressable>

      <AuthDivider />

      <GoogleSignInButton text="Sign in with Google" />
      <Text style={styles.oauthLegal}>
        By signing in (including with Google), you agree to our Terms and Privacy Policy. Open the
        links from the home screen footer to read them.
      </Text>

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
  oauthLegal: {
    fontSize: 12,
    lineHeight: 16,
    color: color("neutral.600"),
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
});
