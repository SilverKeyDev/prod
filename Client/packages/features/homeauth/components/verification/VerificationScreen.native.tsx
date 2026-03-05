/**
 * Native verification screen. Same useAuthVerification, performVerify, and flow as web.
 */

import React, { useEffect, useState } from "react";

import { StyleSheet } from "react-native";

import { color } from "packages/design-tokens";
import AuthPageLayoutNative from "packages/features/homeauth/components/core/AuthPageLayout.native";
import { useAuthVerification } from "packages/features/homeauth/hooks/data/useAuthVerification";
import { useCountdown } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useNavigation } from "packages/navigation";
import { Pressable } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives/box";
import { Input } from "packages/ui/components/primitives/input";
import { Text } from "packages/ui/components/primitives/text";
import { getSessionStorage } from "packages/utils/storage";
import { performVerify } from "packages/utils/verification";

type RouteState = { email?: string; fromLogin?: boolean };

export function VerificationScreenNative() {
  const { verify, resendCode } = useAuthVerification();
  const { countdown, canResend, startCountdown } = useCountdown(30);
  const { getCurrentRoute, navigateToPath } = useNavigation();
  const routeState = getCurrentRoute().state as RouteState | undefined;

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (routeState?.email) {
      setEmail(routeState.email);
      setStep("code");
      startCountdown();
    }
  }, [routeState?.email, startCountdown]);

  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { success, error: err } = await resendCode(email);
      if (!success) throw new Error(err ?? "Failed to send verification code");
      setStep("code");
      startCountdown();
    } catch (err: unknown) {
      log.error(LOG_CATEGORIES.AUTH, "Resend code error", err);
      setError(
        err instanceof Error ? err.message : "Failed to send verification code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.trim();
    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const session = getSessionStorage();
      const userEmail = email || session.getItem("signupEmail") || "";
      await performVerify(
        verify,
        userEmail,
        verificationCode,
        () => session.getItem("signupPassword"),
        () => {
          session.removeItem("signupEmail");
          session.removeItem("signupPassword");
        },
        (path) => navigateToPath(path),
        { postSuccessPath: routeState?.fromLogin ? "/search" : "/onboarding" }
      );
    } catch (err: unknown) {
      log.error(LOG_CATEGORIES.AUTH, "Verification error", err);
      setError(err instanceof Error ? err.message : "Invalid verification code. Please try again.");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true);
    setError("");
    try {
      const session = getSessionStorage();
      const userEmail = email || session.getItem("signupEmail");
      if (!userEmail) throw new Error("Email not found. Please go back and try again.");
      const { success, error: err } = await resendCode(userEmail);
      if (!success) throw new Error(err ?? "Failed to resend verification code");
      startCountdown();
      setCode("");
    } catch (err: unknown) {
      log.error(LOG_CATEGORIES.AUTH, "Resend code error", err);
      setError(
        err instanceof Error ? err.message : "Failed to resend verification code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayoutNative
      title="Verify your email"
      subtitle={
        step === "email"
          ? "Enter your email to receive a verification code"
          : "Enter the 6-digit code we sent you"
      }
      backButtonText="Back"
      error={error || undefined}
    >
      {step === "email" && (
        <Box style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <Input
            value={email}
            onValueChange={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            label="Email"
          />
          <Pressable
            onPress={handleEmailSubmit}
            disabled={loading}
            style={[
              styles.primaryButton,
              styles.buttonMargin,
              loading && styles.primaryButtonDisabled,
            ]}
          >
            <Text style={styles.primaryButtonText}>{loading ? "Sending…" : "Send code"}</Text>
          </Pressable>
        </Box>
      )}
      {step === "code" && (
        <>
          <Box style={styles.field}>
            <Text style={styles.label}>Verification code</Text>
            <Input
              value={code}
              onValueChange={setCode}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              label="Verification code"
            />
          </Box>
          <Pressable
            onPress={handleVerify}
            disabled={loading || code.length !== 6}
            style={[
              styles.primaryButton,
              styles.buttonMargin,
              (loading || code.length !== 6) && styles.primaryButtonDisabled,
            ]}
          >
            <Text style={styles.primaryButtonText}>{loading ? "Verifying…" : "Verify"}</Text>
          </Pressable>
          {canResend ? (
            <Pressable onPress={handleResend} disabled={loading} style={styles.linkButton}>
              <Text style={styles.inlineLink}>Resend code</Text>
            </Pressable>
          ) : (
            <Text style={styles.countdown}>Resend available in {countdown}s</Text>
          )}
        </>
      )}
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
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: color("neutral.50"),
  },
  buttonMargin: {
    marginTop: 8,
    marginBottom: 16,
  },
  linkButton: {
    alignSelf: "flex-start",
  },
  inlineLink: {
    fontSize: 14,
    color: color("neutral.600"),
  },
  countdown: {
    fontSize: 14,
    color: color("neutral.500"),
    marginTop: 8,
  },
});
