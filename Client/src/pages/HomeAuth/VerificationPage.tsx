import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { KeyTurnLoader, MiniLogo, Input } from "../../components/ui";
import { authApi } from "../../api";
import { secureTokenUtils } from "../../hooks/useSecureAuth";

interface LocationState {
  email?: string;
}

export default function VerificationPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [activeStep, setActiveStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState;
  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(6).fill(null));

  // Pre-fill email if coming from signup
  useEffect(() => {
    if (locationState?.email) {
      setEmail(locationState.email);
      setActiveStep("code");
      startCountdown();
      // Focus first input field when coming from signup
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [locationState]);

  // Countdown timer for resend button
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0 && !canResend) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
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
      handleVerify();
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
        throw new Error(error || "Failed to send verification code");
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

    setLoading(true);
    setError("");

    try {
      const userEmail = email || localStorage.getItem("signupEmail") || "";
      const userPassword = localStorage.getItem("signupPassword") || "";

      if (!userPassword) {
        throw new Error("Password not found. Please sign up again.");
      }

      const response = await authApi.verify({
        email: userEmail,
        code: verificationCode,
        password: userPassword,
      });

      // Clear the stored signup data
      localStorage.removeItem("signupEmail");
      localStorage.removeItem("signupPassword");

      // Store authentication tokens securely
      secureTokenUtils.storeTokens({
        access_token: response?.access_token,
        id_token: response?.id_token,
        refresh_token: response?.refresh_token
      });
      
      // Store user data (non-sensitive)
      if (response?.user) {
        localStorage.setItem("user", JSON.stringify(response.user));
      }

      // On success, redirect to onboarding
      navigate("/onboarding");
    } catch (error: unknown) {
      console.error("Verification error:", error);
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
      const userEmail = email || localStorage.getItem("signupEmail");
      if (!userEmail) {
        throw new Error("Email not found. Please go back and try again.");
      }

      const { success, error } = await authApi.resendCode(userEmail);

      if (!success) {
        throw new Error(error || "Failed to resend verification code");
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
    <div className="flex justify-center gap-responsive-xs space-y-responsive-lg">
      {code.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleCodeChange(e.target.value, index)}
          onPaste={(e) => handlePaste(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="mobile-icon-md btn-responsive-lg text-responsive-lg text-center border-2 border-olive rounded-lg focus:outline-none focus:ring-2 focus:ring-olive focus:border-transparent font-bold"
          disabled={loading}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center px-responsive-sm py-responsive-md">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center text-black/60 hover:text-black space-y-responsive-md transition-colors"
        >
          <ArrowLeft className="mobile-icon-sm mr-1" />
          Back
        </button>

        {/* Header */}
        <div className="text-center space-y-responsive-lg">
          <h2 className="text-responsive-xl font-serif text-black space-y-responsive-xs flex items-center justify-center gap-responsive-xs">
            <MiniLogo size="md" />
            {activeStep === "email"
              ? "Verify your email"
              : "Enter verification code"}
          </h2>
          <p className="text-black/60 font-light text-responsive-sm">
            {activeStep === "email"
              ? "We'll send you a code to verify your email"
              : `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="space-y-responsive-md space-responsive-sm bg-red-50 text-red-600 text-responsive-sm rounded-md">
            {error}
          </div>
        )}

        {/* Email Step */}
        {activeStep === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-responsive-md">
            <div>
              <label className="block text-responsive-sm font-medium text-black space-y-responsive-xs">
                Email address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
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
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
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
            onSubmit={(e) => e.preventDefault()}
            className="space-y-responsive-md"
          >
            {renderCodeInputs()}

            <div className="text-center text-responsive-sm text-black/60">
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
                  <span className="inline-flex items-center">
                    <div className="mr-1">
                      <KeyTurnLoader message="" />
                    </div>
                    Sending...
                  </span>
                ) : canResend ? (
                  "Resend code"
                ) : (
                  `Resend in ${countdown}s`
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleVerify}
              disabled={loading || code.join("").length !== 6}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="mr-2">
                    <KeyTurnLoader message="" />
                  </div>
                  Verifying...
                </div>
              ) : (
                "Verify and continue"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
