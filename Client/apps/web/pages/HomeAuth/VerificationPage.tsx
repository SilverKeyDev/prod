import React, { useEffect, useRef, useState } from "react";

import { ArrowLeft, Mail } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { log, LOG_CATEGORIES } from "../../../../logger";
import { useAuthVerification } from "../../../../packages/hooks/data/auth/useAuthVerification";
import { useCountdown } from "../../../../packages/hooks/ui";
import {
  applyCodeChange,
  applyPaste,
  getBackspaceFocusIndex,
} from "../../../../packages/utils/verification";
import Card from "../../components/layout/Card";
import { BodyText, Button, Input, MiniLogo, Title } from "../../components/ui";

type LocationState = {
  email?: string;
  fromLogin?: boolean;
};

export default function VerificationPage() {
  const { verify, resendCode } = useAuthVerification();
  const { countdown, canResend, startCountdown } = useCountdown(30);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [activeStep, setActiveStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFromSignup, setIsFromSignup] = useState(false);
  const [isFromLogin, setIsFromLogin] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState;
  const inputRefs = useRef<Array<HTMLInputElement | null>>(
    Array(6).fill(null) as Array<HTMLInputElement | null>,
  );

  // Pre-fill email if coming from signup or login
  useEffect(() => {
    if (locationState?.email) {
      setEmail(locationState.email);
      setActiveStep("code");
      if (locationState.fromLogin) {
        setIsFromLogin(true);
      } else {
        setIsFromSignup(true);
      }
      startCountdown();
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [locationState, startCountdown]);

  const handleCodeChange = (value: string, index: number) => {
    const { nextCode, nextFocusIndex } = applyCodeChange(code, value, index);
    setCode(nextCode);
    inputRefs.current[nextFocusIndex]?.focus();
    if (index === 5 && nextCode.every((digit) => digit)) {
      void handleVerify();
    }
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text/plain");
    const { nextCode, nextFocusIndex } = applyPaste(code, pasteData, index);
    setCode(nextCode);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const focusIndex = getBackspaceFocusIndex(code, index);
      if (focusIndex !== null) {
        inputRefs.current[focusIndex]?.focus();
      }
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { success, error } = await resendCode(email);

      if (!success) {
        throw new Error(error ?? "Failed to send verification code");
      }

      setActiveStep("code");
      startCountdown();
    } catch (error: unknown) {
      log.error(LOG_CATEGORIES.AUTH, "Resend code error", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again.";
      setError(errorMessage);
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
      timestamp: new Date().toISOString(),
    });

    setLoading(true);
    setError("");

    try {
      // Get the stored password from signup
      const storedPassword = sessionStorage.getItem("signupPassword");
      const userEmail = email ?? sessionStorage.getItem("signupEmail");

      log.debug(LOG_CATEGORIES.AUTH, "Verification retrieved stored data", {
        hasEmail: !!userEmail,
        hasPassword: !!storedPassword,
        email: userEmail,
      });

      if (!userEmail || !storedPassword) {
        log.error(
          LOG_CATEGORIES.AUTH,
          "Verification missing email or password",
        );
        throw new Error(
          "Email or password not found. Please go back and sign up again.",
        );
      }

      log.debug(LOG_CATEGORIES.AUTH, "Verification calling authApi.verify");

      // Call the verify API
      const {
        success,
        error: apiError,
        message,
      } = await verify(userEmail, verificationCode, storedPassword);

      log.debug(LOG_CATEGORIES.AUTH, "Verification authApi.verify response", {
        success,
        error: apiError,
        message,
      });

      if (!success) {
        throw new Error(
          apiError ?? message ?? "Failed to verify email. Please try again.",
        );
      }

      log.debug(
        LOG_CATEGORIES.AUTH,
        "Verification successful, clearing storage and navigating",
      );

      // Clear the stored signup data
      sessionStorage.removeItem("signupEmail");
      sessionStorage.removeItem("signupPassword");

      // On success, redirect to onboarding after a brief delay
      // Auth state will be picked up by AuthProvider via session verification
      setTimeout(() => {
        void navigate("/onboarding");
      }, 500);
    } catch (error: unknown) {
      log.error(LOG_CATEGORIES.AUTH, "Verification error", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Invalid verification code. Please try again.";
      setError(errorMessage);
      // Clear the code on error
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
      const userEmail = email ?? sessionStorage.getItem("signupEmail");
      if (!userEmail) {
        throw new Error("Email not found. Please go back and try again.");
      }

      const { success, error } = await resendCode(userEmail);

      if (!success) {
        throw new Error(error ?? "Failed to resend verification code");
      }

      // Reset UI state
      startCountdown();
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error: unknown) {
      log.error(LOG_CATEGORIES.AUTH, "Resend code error", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to resend verification code. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (activeStep === "code") {
      setActiveStep("email");
      setError("");
    } else {
      void navigate(-1);
    }
  };

  const renderCodeInputs = () => (
    <div className="flex justify-center gap-3">
      {code.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={digit}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleCodeChange(e.target.value, index)
          }
          onPaste={(e) => handlePaste(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="h-12 w-12 rounded-lg border-2 border-olive text-center text-lg font-bold text-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-olive disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading}
        />
      ))}
    </div>
  );

  return (
    <div className="px-responsive-sm py-responsive-md flex min-h-screen items-center justify-center bg-off-white">
      <div className="w-full max-w-md">
        <Card className="space-y-responsive-md">
          {/* Back Button - Hidden when coming from signup */}
          {!isFromSignup && (
            <Button
              onClick={handleBack}
              variant="ghost"
              icon={<ArrowLeft className="mobile-icon-sm" />}
              iconPosition="left"
            >
              Back
            </Button>
          )}

          {/* Header */}
          <div className="text-center">
            <Title
              size="lg"
              as="h2"
              className="mb-4 flex items-center justify-center gap-2"
            >
              <MiniLogo size="md" />
              {activeStep === "email"
                ? "Verify your email"
                : "Enter verification code"}
            </Title>
          </div>

          {/* Instructions */}
          <BodyText size="sm" muted className="text-center mb-4">
            {activeStep === "email"
              ? "We'll send you a code to verify your email"
              : `Enter the 6-digit code sent to ${email}`}
          </BodyText>

          {/* Warning Message - shown when redirected from login */}
          {isFromLogin && !error && (
            <div className="space-y-responsive-md space-responsive-sm text-responsive-sm rounded-md bg-yellow-50 text-yellow-800 p-3">
              Please verify your email address to continue. A verification code
              has been sent to your email.
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="space-y-responsive-md space-responsive-sm text-responsive-sm rounded-md bg-red-50 text-red-600">
              {error}
            </div>
          )}

          {/* Email Step */}
          {activeStep === "email" && (
            <form
              onSubmit={handleEmailSubmit}
              className="space-y-responsive-md"
            >
              <div>
                <label
                  id="verification-email-label"
                  htmlFor="verification-email"
                  className="text-responsive-sm space-y-responsive-xs block font-medium text-black"
                >
                  Email address
                </label>
                <Input
                  id="verification-email"
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your email"
                  leftIcon={<Mail className="mobile-icon-sm" />}
                  autoComplete="email"
                  variant="mobile"
                  size="md"
                />
              </div>

              <Button
                type="submit"
                variant="olive"
                size="md"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                Send verification code
              </Button>
            </form>
          )}

          {/* Verification Code Step */}
          {activeStep === "code" && (
            <form
              onSubmit={(e: React.FormEvent<HTMLFormElement>) =>
                e.preventDefault()
              }
              className="space-y-responsive-md"
            >
              {renderCodeInputs()}

              <div className="text-responsive-sm text-center text-black/60">
                Didn't receive a code?{" "}
                <Button
                  type="button"
                  onClick={handleResendCode}
                  variant="ghost"
                  size="sm"
                  disabled={!canResend || loading}
                  loading={loading}
                  className={
                    canResend ? "text-gold hover:text-gold/80" : "text-black/40"
                  }
                >
                  {loading
                    ? "Sending..."
                    : canResend
                      ? "Resend code"
                      : `Resend in ${countdown}s`}
                </Button>
              </div>

              <div className="flex justify-center mt-6">
                <Button
                  type="button"
                  onClick={handleVerify}
                  variant="olive"
                  size="md"
                  loading={loading}
                  disabled={loading || code.join("").length !== 6}
                  className="w-72"
                >
                  Verify
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
