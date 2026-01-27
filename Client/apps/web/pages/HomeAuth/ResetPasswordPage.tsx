import { Mail, Lock } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { PasswordValidation } from "../../components/feedback/PasswordValidation";
import { usePasswordValidation } from "../../components/feedback/PasswordValidationUtils";
import { Button, Input, VerificationCodeInput } from "../../components/ui";
import {
  useForgotPassword,
  useResetPassword,
} from "../../../../packages/hooks/data/auth/useAuthActions";
import AuthPageLayout from "../../features/homeauth/Auth/PageLayout";
import { useAuthStore } from "../../../../packages/store/auth.slice";
import { useUserStore } from "../../../../packages/store/user.slice";
import { log, LOG_CATEGORIES } from "../../../../logger";
import type { UserProfile } from "../../../../packages/schemas/auth/user";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"request" | "verify" | "reset">("request");
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();

  const { forgotPassword, isLoading: isForgotPasswordLoading, error: forgotPasswordError } = useForgotPassword();
  const { resetPassword, isLoading: isResetPasswordLoading, error: resetPasswordError } = useResetPassword();
  const setStoreUser = useAuthStore((s) => s.setUser);
  const setStoreIsAuthenticated = useAuthStore((s) => s.setIsAuthenticated);
  const setUserProfile = useUserStore((s) => s.setUserProfile);
  const [localError, setLocalError] = useState("");
  
  const loading = isForgotPasswordLoading || isResetPasswordLoading;
  const error = forgotPasswordError || resetPasswordError || localError;

  // Password validation
  const { isValid: isPasswordValid, errors: passwordErrors } = (
    usePasswordValidation as (password: string) => {
      isValid: boolean;
      errors: string[];
    }
  )(newPassword);

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

    // Store the code and proceed to reset step
    // The actual verification happens when we submit the password reset
    setStep("reset");
  };

  const handleResendCode = async () => {
    setLocalError("");
    
    if (!email) {
      setLocalError("Email is required to resend code");
      return;
    }

    const result = await forgotPassword(email);
    if (result.success) {
      startCountdown();
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    // Validate password using comprehensive validation
    if (!isPasswordValid) {
      setLocalError(
        `Password must meet all requirements: ${Array.isArray(passwordErrors) ? passwordErrors.join(", ") : "Unknown error"}`
      );
      return;
    }

    const result = await resetPassword(email, code, newPassword);
    if (result.success) {
      // Server uses HTTP-only cookies for access/refresh tokens
      // Tokens are automatically set by the backend response
      // Update auth state if user data is provided (similar to login flow)
      if (result.user) {
        // Map user data to UserProfile format (similar to login flow)
        const userId =
          result.user.id ||
          ("user_sub" in result.user
            ? result.user.user_sub
            : undefined) ||
          undefined;
        
        const mappedUser: UserProfile = {
          id: userId || "",
          email: result.user.email,
          name: result.user.name || "Unknown User",
          phone: ("phone" in result.user ? result.user.phone : undefined) as string | null | undefined,
          created_at: null,
          is_active: true,
          has_subscription: false,
          subscription: null,
          has_preferences: false,
          is_agent:
            ("is_agent" in result.user
              ? (result.user.is_agent ?? false)
              : false) ?? false,
          auth_method: ("auth_method" in result.user ? result.user.auth_method : undefined) as "cognito" | "google" | "both" | "unknown" | undefined,
        };
        
        // Convert to user store format to fix type compatibility
        const userStoreProfile = {
          ...mappedUser,
          name: mappedUser.name || undefined, // Convert null to undefined for user store
        };
        
        // Update stores (similar to login flow in useSecureAuth)
        setStoreIsAuthenticated(true);
        setStoreUser(mappedUser);
        setUserProfile(userStoreProfile);
        
        log.info(LOG_CATEGORIES.AUTH, "Password reset and auto-login successful", {
          email,
          userId: mappedUser.id,
          storageMethod: "http_only_cookies",
          authMethod: "cookie_based",
        });
      }

      // Navigate to dashboard - AuthProvider will pick up auth state from cookies
      // Use a small delay to ensure cookies are set before navigation
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 100);
    }
  };

  const getSubtitle = () => {
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
  };

  return (
    <AuthPageLayout
      title="Reset Password"
      subtitle={getSubtitle()}
      error={error}
      variant="wide"
      backButtonTo="/login"
      backButtonText="Back to Login"
    >
      {/* Reset Form */}
      <form
        onSubmit={
          step === "request"
            ? handleRequestReset
            : step === "verify"
            ? handleVerifyCode
            : handleResetPassword
        }
        className="card space-y-responsive-md"
      >
        {step === "request" ? (
          // Step 1: Request reset code
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            placeholder="Enter your email"
            leftIcon={<Mail className="h-4 w-4" />}
            name="email"
            id="email-request"
            autoComplete="username"
            variant="mobile"
            className="autofill-gold"
          />
        ) : step === "verify" ? (
          // Step 2: Verify code
          <VerificationCodeInput
            length={6}
            value={code}
            onChange={setCode}
            onComplete={(completedCode) => {
              setCode(completedCode);
              // Temporary debug log to verify submitted value
              log.debug(
                LOG_CATEGORIES.AUTH,
                "Verification code input completed",
                { code: completedCode },
              );
            }}
            autoFocus
            disabled={loading}
          />
        ) : (
          // Step 3: Reset password
          <div className="space-y-1">
            <Input
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewPassword(e.target.value)
              }
              placeholder="Enter new password"
              leftIcon={<Lock className="h-4 w-4" />}
              name="new-password"
              id="new-password"
              autoComplete="new-password"
              variant="mobile"
              showPasswordToggle
              className="autofill-gold"
            />
            <PasswordValidation
              password={newPassword}
              showValidation={newPassword.length > 0}
            />
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="olive"
          size="md"
          fullWidth
          loading={loading}
          disabled={loading || (step === "verify" && (!code || code.trim().length === 0)) || (step === "reset" && !isPasswordValid)}
          className={step === "verify" ? "mt-6 mb-1" : ""}
        >
          {step === "request"
            ? "Send reset code"
            : step === "verify"
            ? "Verify code"
            : "Reset password"}
        </Button>

        {step === "verify" && (
          <div className="text-responsive-sm text-center text-black/60">
            Didn't receive a code?{" "}
            <Button
              type="button"
              onClick={handleResendCode}
              variant="ghost"
              size="sm"
              disabled={!canResend || loading}
              loading={loading && !canResend}
              className={canResend ? "text-gold hover:text-gold/80" : "text-black/40"}
            >
              {loading && !canResend ? "Sending..." : canResend ? "Resend code" : `Resend in ${countdown}s`}
            </Button>
          </div>
        )}
      </form>
    </AuthPageLayout>
  );
}
