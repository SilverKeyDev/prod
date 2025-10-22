import { Mail, ArrowLeft } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { KeyTurnLoader, MiniLogo, Input } from "../../components/ui";
import { authApi } from "../../../../packages/config/api";
import Card from "../../components/layout/Card";

type LocationState = {
  email?: string;
};

export default function VerificationPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [activeStep, setActiveStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  const [isFromSignup, setIsFromSignup] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState;
  const inputRefs = useRef<Array<HTMLInputElement | null>>(
    Array(6).fill(null) as Array<HTMLInputElement | null>
  );

  // Pre-fill email if coming from signup
  useEffect(() => {
    if (locationState?.email) {
      setEmail(locationState.email);
      setActiveStep("code");
      setIsFromSignup(true);
      startCountdown();
      // Focus first input field when coming from signup
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [locationState]);

  // Countdown timer for resend button
  useEffect(() => {
    let interval: NodeJS.Timeout | number;
    if (countdown > 0 && !canResend) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [countdown, canResend]);

  const startCountdown = () => {
    setCountdown(30);
    setCanResend(false);
  };

  // Handle code input change
  const handleCodeChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return; // Only allow numbers

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only take the last character
    setCode(newCode);

    // Move to next input or submit if last digit
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (index === 5 && newCode.every((digit) => digit)) {
      void handleVerify();
    }
  };

  // Handle paste
  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    index: number
  ) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text/plain").slice(0, 6);
    if (!/^\d+$/.test(pasteData)) return;

    const newCode = [...code];
    const pasteDigits = pasteData.split("");

    // Fill in the code array with pasted digits
    pasteDigits.forEach((digit, i) => {
      if (index + i < 6) {
        newCode[index + i] = digit;
      }
    });

    setCode(newCode);

    // Focus the next empty input or the last one if all filled
    const nextEmptyIndex = newCode.findIndex((digit) => !digit);
    const focusIndex = nextEmptyIndex === -1 ? 5 : Math.min(nextEmptyIndex, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  // Handle backspace
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
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
      const { success, error } = await authApi.resendCode(email);

      if (!success) {
        throw new Error(error ?? "Failed to send verification code");
      }

      setActiveStep("code");
      startCountdown();
    } catch (error: unknown) {
      console.error("Resend code error:", error);
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

    console.log("🔍 VERIFICATION_PAGE: handleVerify called", {
      codeLength: verificationCode.length,
      email,
      timestamp: new Date().toISOString(),
    });

    setLoading(true);
    setError("");

    try {
      // Get the stored password from signup
      const storedPassword = localStorage.getItem("signupPassword");
      const userEmail = email ?? localStorage.getItem("signupEmail");

      console.log("🔍 VERIFICATION_PAGE: Retrieved stored data", {
        hasEmail: !!userEmail,
        hasPassword: !!storedPassword,
        email: userEmail,
      });

      if (!userEmail || !storedPassword) {
        console.error("❌ VERIFICATION_PAGE: Missing email or password");
        throw new Error(
          "Email or password not found. Please go back and sign up again."
        );
      }

      console.log("🔍 VERIFICATION_PAGE: Calling authApi.verify...");

      // Call the verify API
      const {
        success,
        error: apiError,
        message,
      } = await authApi.verify(userEmail, verificationCode, storedPassword);

      console.log("🔍 VERIFICATION_PAGE: authApi.verify response", {
        success,
        error: apiError,
        message,
      });

      if (!success) {
        throw new Error(
          apiError ?? message ?? "Failed to verify email. Please try again."
        );
      }

      console.log(
        "✅ VERIFICATION_PAGE: Verification successful, clearing storage and navigating"
      );

      // Clear the stored signup data
      localStorage.removeItem("signupEmail");
      localStorage.removeItem("signupPassword");

      // On success, redirect to dashboard after a brief delay
      // Auth state will be picked up by AuthProvider via session verification
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (error: unknown) {
      console.error("❌ VERIFICATION_PAGE: Verification error:", error);
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
      const userEmail = email ?? localStorage.getItem("signupEmail");
      if (!userEmail) {
        throw new Error("Email not found. Please go back and try again.");
      }

      const { success, error } = await authApi.resendCode(userEmail);

      if (!success) {
        throw new Error(error ?? "Failed to resend verification code");
      }

      // Reset UI state
      startCountdown();
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error: unknown) {
      console.error("Resend code error:", error);
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
      navigate(-1);
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
            <button
              onClick={handleBack}
              className="space-y-responsive-md flex items-center text-black/60 transition-colors hover:text-black"
            >
              <ArrowLeft className="mobile-icon-sm mr-1" />
              Back
            </button>
          )}

          {/* Header */}
          <div className="text-center">
            <h2 className="text-responsive-xl space-y-responsive-xs gap-responsive-xs flex items-center justify-center font-serif text-black mb-4">
              <MiniLogo size="md" />
              {activeStep === "email"
                ? "Verify your email"
                : "Enter verification code"}
            </h2>
          </div>

          {/* Instructions */}
          <p className="text-responsive-sm font-light text-black/60 text-center mb-4">
            {activeStep === "email"
              ? "We'll send you a code to verify your email"
              : `Enter the 6-digit code sent to ${email}`}
          </p>

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
                <label className="text-responsive-sm space-y-responsive-xs block font-medium text-black">
                  Email address
                </label>
                <Input
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

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <KeyTurnLoader message="Sending..." />
                ) : (
                  "Send verification code"
                )}
              </button>
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
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={!canResend || loading}
                  className={`${
                    canResend ? "text-gold hover:text-gold/80" : "text-black/40"
                  } font-medium transition-colors`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="mr-1">
                        <KeyTurnLoader message="" />
                      </div>
                      Sending...
                    </div>
                  ) : canResend ? (
                    "Resend code"
                  ) : (
                    `Resend in ${countdown}s`
                  )}
                </button>
              </div>

              <div className="flex justify-center mt-6">
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={loading ?? code.join("").length !== 6}
                  className="btn-primary w-72 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="mr-2">
                        <KeyTurnLoader message="" />
                      </div>
                      Verifying...
                    </div>
                  ) : (
                    "Verify"
                  )}
                </button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
