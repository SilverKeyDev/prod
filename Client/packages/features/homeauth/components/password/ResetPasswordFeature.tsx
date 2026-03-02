import React, { useEffect, useRef, useState } from "react";

import AuthPageLayout from "packages/features/homeauth/components/core/PageLayout";
import {
  useForgotPassword,
  useResetPassword,
} from "packages/features/homeauth/hooks/data/useAuthActions";
import { useNavigation } from "packages/navigation";
import { useAuthStore } from "packages/store";
import { useUserStore } from "packages/store";

import { usePasswordValidation } from "@/components/feedback";
import {
  applyStoresAfterReset,
  mapResultUserToProfile,
  type ResetPasswordStores,
} from "@/features/homeauth/utils";

import { ResetPasswordForm, type ResetPasswordStep } from "./ResetPasswordForm";

function getSubtitle(step: ResetPasswordStep): string {
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

export function ResetPasswordFeature() {
  const { getSearchParams, navigate } = useNavigation();
  const [email, setEmail] = useState(() => getSearchParams().get("email") || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<ResetPasswordStep>("request");
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [localError, setLocalError] = useState("");
  const codeInputWrapperRef = useRef<HTMLDivElement>(null);

  const {
    forgotPassword,
    isLoading: isForgotPasswordLoading,
    error: forgotPasswordError,
  } = useForgotPassword();
  const {
    resetPassword,
    isLoading: isResetPasswordLoading,
    error: resetPasswordError,
  } = useResetPassword();
  const setStoreUser = useAuthStore((s) => s.setUser);
  const setStoreIsAuthenticated = useAuthStore((s) => s.setIsAuthenticated);
  const setUserProfile = useUserStore((s) => s.setUserProfile);

  const loading = isForgotPasswordLoading || isResetPasswordLoading;
  const error = forgotPasswordError || resetPasswordError || localError;
  const { isValid: isPasswordValid, errors: passwordErrors } = (
    usePasswordValidation as (password: string) => {
      isValid: boolean;
      errors: string[];
    }
  )(newPassword);

  useEffect(() => {
    let interval: NodeJS.Timeout | number;
    if (countdown > 0 && !canResend) {
      interval = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [countdown, canResend]);

  useEffect(() => {
    if (step === "verify") {
      const firstInput = codeInputWrapperRef.current?.querySelector("input");
      firstInput?.focus();
    }
  }, [step]);

  const startCountdown = () => {
    setCountdown(30);
    setCanResend(false);
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    const result = await forgotPassword(email);
    if (result.success) {
      setStep("verify");
      startCountdown();
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    if (!code || code.trim().length === 0) {
      setLocalError("Please enter the verification code");
      return;
    }
    setStep("reset");
  };

  const handleResendCode = async () => {
    setLocalError("");
    if (!email) {
      setLocalError("Email is required to resend code");
      return;
    }
    const result = await forgotPassword(email);
    if (result.success) startCountdown();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    if (!isPasswordValid) {
      setLocalError(
        `Password must meet all requirements: ${Array.isArray(passwordErrors) ? passwordErrors.join(", ") : "Unknown error"}`
      );
      return;
    }
    const result = await resetPassword(email, code, newPassword);
    if (result.success && result.user) {
      const stores: ResetPasswordStores = {
        setStoreUser,
        setStoreIsAuthenticated,
        setUserProfile,
      };
      const mappedUser = mapResultUserToProfile(result.user, email);
      applyStoresAfterReset(mappedUser, email, stores);
      setTimeout(() => navigate("DASHBOARD", undefined, { replace: true }), 100);
    }
  };

  return (
    <AuthPageLayout
      title="Reset Password"
      subtitle={getSubtitle(step)}
      error={error}
      variant="wide"
      backButtonTo="/login"
      backButtonText="Back to Login"
    >
      <ResetPasswordForm
        step={step}
        email={email}
        setEmail={setEmail}
        code={code}
        setCode={setCode}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        loading={loading}
        isPasswordValid={isPasswordValid}
        countdown={countdown}
        canResend={canResend}
        codeInputWrapperRef={codeInputWrapperRef}
        onSubmitRequest={handleRequestReset}
        onSubmitVerify={handleVerifyCode}
        onSubmitReset={handleResetPassword}
        onResendCode={handleResendCode}
      />
    </AuthPageLayout>
  );
}
