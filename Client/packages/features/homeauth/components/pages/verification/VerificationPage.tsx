import React, { useEffect, useRef, useState } from "react";

import { useAuthVerification } from "packages/hooks/data/auth/useAuthVerification";
import { useCountdown } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useNavigation } from "packages/navigation";
import { dateNow } from "packages/utils/date";
import { getSessionStorage } from "packages/utils/storage";
import { performVerify } from "packages/utils/verification";

import { VerificationForm, type VerificationStep } from "./VerificationForm";

type LocationState = { email?: string; fromLogin?: boolean };

export default function VerificationPage() {
  const { verify, resendCode } = useAuthVerification();
  const { countdown, canResend, startCountdown } = useCountdown(30);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [activeStep, setActiveStep] = useState<VerificationStep>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFromSignup, setIsFromSignup] = useState(false);
  const [isFromLogin, setIsFromLogin] = useState(false);
  const { navigateToPath, goBack, getCurrentRoute } = useNavigation();
  const locationState = getCurrentRoute().state as LocationState;
  const inputRefs = useRef<Array<HTMLInputElement | null>>(
    Array(6).fill(null) as Array<HTMLInputElement | null>
  );

  useEffect(() => {
    if (locationState?.email) {
      setEmail(locationState.email);
      setActiveStep("code");
      if (locationState.fromLogin) setIsFromLogin(true);
      else setIsFromSignup(true);
      startCountdown();
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [locationState, startCountdown]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { success, error: err } = await resendCode(email);
      if (!success) throw new Error(err ?? "Failed to send verification code");
      setActiveStep("code");
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
    const verificationCode = code.join("");
    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }
    log.debug(LOG_CATEGORIES.AUTH, "Verification handleVerify called", {
      codeLength: verificationCode.length,
      email,
      timestamp: dateNow().toISOString(),
    });
    setLoading(true);
    setError("");
    try {
      const session = getSessionStorage();
      const userEmail = email ?? session.getItem("signupEmail");
      await performVerify(
        verify,
        userEmail ?? "",
        verificationCode,
        () => session.getItem("signupPassword"),
        () => {
          session.removeItem("signupEmail");
          session.removeItem("signupPassword");
        },
        navigateToPath,
        { postSuccessPath: locationState?.fromLogin ? "/search" : "/onboarding" }
      );
    } catch (err: unknown) {
      log.error(LOG_CATEGORIES.AUTH, "Verification error", err);
      setError(err instanceof Error ? err.message : "Invalid verification code. Please try again.");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    setLoading(true);
    setError("");
    try {
      const session = getSessionStorage();
      const userEmail = email ?? session.getItem("signupEmail");
      if (!userEmail) throw new Error("Email not found. Please go back and try again.");
      const { success, error: err } = await resendCode(userEmail);
      if (!success) throw new Error(err ?? "Failed to resend verification code");
      startCountdown();
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      log.error(LOG_CATEGORIES.AUTH, "Resend code error", err);
      setError(
        err instanceof Error ? err.message : "Failed to resend verification code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (activeStep === "code") {
      setActiveStep("email");
      setError("");
    } else {
      goBack();
    }
  };

  return (
    <VerificationForm
      activeStep={activeStep}
      email={email}
      setEmail={setEmail}
      code={code}
      setCode={setCode}
      setError={setError}
      loading={loading}
      error={error}
      isFromSignup={isFromSignup}
      isFromLogin={isFromLogin}
      countdown={countdown}
      canResend={canResend}
      inputRefs={inputRefs}
      onBack={handleBack}
      onEmailSubmit={handleEmailSubmit}
      onVerify={handleVerify}
      onResendCode={handleResendCode}
    />
  );
}
