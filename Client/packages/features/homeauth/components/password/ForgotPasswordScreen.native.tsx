/**
 * Native forgot password / reset password flow. Same hooks as web ResetPasswordFeature.
 */

import React, { useCallback, useEffect, useState } from "react";

import { StyleSheet } from "react-native";

import { color } from "packages/design-tokens";
import AuthPageLayoutNative from "packages/features/homeauth/components/core/AuthPageLayout.native";
import {
  useForgotPassword,
  useResetPassword,
} from "packages/features/homeauth/hooks/data/useAuthActions";
import { applyStoresAfterReset, mapResultUserToProfile } from "packages/features/homeauth/utils";
import { useAuthStore } from "packages/store";
import { useUserStore } from "packages/store";
import { usePasswordValidation } from "packages/ui/components/feedback";
import { Pressable } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives/box";
import { Input } from "packages/ui/components/primitives/input";
import { Text } from "packages/ui/components/primitives/text";

type Step = "request" | "verify" | "reset";

function getSubtitle(step: Step): string {
  switch (step) {
    case "request":
      return "Enter your email to receive a reset code";
    case "verify":
      return "Enter the verification code sent to your email";
    case "reset":
      return "Enter your new password";
    default:
      return "Enter your email to receive a reset code";
  }
}

export function ForgotPasswordScreenNative() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<Step>("request");
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [localError, setLocalError] = useState("");

  const { forgotPassword, isLoading: isForgotLoading, error: forgotError } = useForgotPassword();
  const { resetPassword, isLoading: isResetLoading, error: resetError } = useResetPassword();
  const setStoreUser = useAuthStore((s) => s.setUser);
  const setStoreIsAuthenticated = useAuthStore((s) => s.setIsAuthenticated);
  const setUserProfile = useUserStore((s) => s.setUserProfile);
  const { isValid: isPasswordValid, errors: passwordErrors } = usePasswordValidation(newPassword);

  const loading = isForgotLoading || isResetLoading;
  const error = forgotError ?? resetError ?? localError;

  const startCountdown = useCallback(() => {
    setCountdown(30);
    setCanResend(false);
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (countdown > 0 && !canResend) {
      interval = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [countdown, canResend]);

  const handleRequest = async () => {
    setLocalError("");
    const result = await forgotPassword(email);
    if (result.success) {
      setStep("verify");
      startCountdown();
    }
  };

  const handleVerify = () => {
    setLocalError("");
    if (!code.trim()) {
      setLocalError("Please enter the verification code");
      return;
    }
    setStep("reset");
  };

  const handleResend = async () => {
    setLocalError("");
    const result = await forgotPassword(email);
    if (result.success) startCountdown();
  };

  const handleReset = async () => {
    setLocalError("");
    if (!isPasswordValid) {
      setLocalError(
        Array.isArray(passwordErrors)
          ? passwordErrors.join(". ")
          : "Password does not meet requirements"
      );
      return;
    }
    const result = await resetPassword(email, code, newPassword);
    if (result.success && result.user) {
      const mappedUser = mapResultUserToProfile(result.user, email);
      applyStoresAfterReset(mappedUser, email, {
        setStoreUser,
        setStoreIsAuthenticated,
        setUserProfile,
      });
      // Root re-renders on store update and shows AppStack.
    }
  };

  const handleSubmit = () => {
    if (step === "request") void handleRequest();
    else if (step === "verify") handleVerify();
    else void handleReset();
  };

  const submitDisabled =
    loading ||
    (step === "request" && !email.trim()) ||
    (step === "verify" && !code.trim()) ||
    (step === "reset" && (!isPasswordValid || !newPassword));

  return (
    <AuthPageLayoutNative
      title="Reset Password"
      subtitle={getSubtitle(step)}
      backButtonText="Back to Login"
      error={error || undefined}
    >
      {step === "request" && (
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
        </Box>
      )}
      {step === "verify" && (
        <>
          <Box style={styles.field}>
            <Text style={styles.label}>Verification code</Text>
            <Input
              value={code}
              onValueChange={setCode}
              placeholder="Enter 6-digit code"
              keyboardType="number-pad"
              maxLength={6}
              label="Verification code"
            />
          </Box>
          {canResend ? (
            <Pressable onPress={handleResend} disabled={loading} style={styles.linkButton}>
              <Text style={styles.inlineLink}>Resend code</Text>
            </Pressable>
          ) : (
            <Text style={styles.countdown}>Resend available in {countdown}s</Text>
          )}
        </>
      )}
      {step === "reset" && (
        <Box style={styles.field}>
          <Text style={styles.label}>New password</Text>
          <Input
            value={newPassword}
            onValueChange={setNewPassword}
            placeholder="Enter new password"
            secureTextEntry
            label="New password"
          />
        </Box>
      )}

      <Pressable
        onPress={handleSubmit}
        disabled={submitDisabled}
        style={[styles.primaryButton, submitDisabled && styles.primaryButtonDisabled]}
      >
        <Text style={styles.primaryButtonText}>
          {loading
            ? "Please wait…"
            : step === "request"
              ? "Send code"
              : step === "verify"
                ? "Continue"
                : "Reset password"}
        </Text>
      </Pressable>
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
  linkButton: {
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  inlineLink: {
    fontSize: 14,
    color: color("neutral.600"),
  },
  countdown: {
    fontSize: 14,
    color: color("neutral.500"),
    marginBottom: 16,
  },
});
