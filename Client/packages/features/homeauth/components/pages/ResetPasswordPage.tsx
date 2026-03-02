import React, { useState } from "react";

import { Key, Lock, Mail } from "lucide-react";

import AuthLink from "packages/features/homeauth/Auth/Link";
import AuthPageLayout from "packages/features/homeauth/Auth/PageLayout";
import {
  useForgotPassword,
  useResetPassword,
} from "packages/features/homeauth/hooks/data/useAuthActions";
import { useNavigation } from "packages/navigation";
import { Button, Input } from "packages/ui/components";
import { usePasswordValidation } from "packages/ui/components/feedback";
import { PasswordValidation } from "packages/ui/components/feedback/PasswordValidation";
import SuccessDialog from "packages/ui/components/modals/dialogs/SuccessDialog";

export default function ResetPasswordPage() {
  const { getSearchParams, navigate } = useNavigation();
  const [email, setEmail] = useState(() => getSearchParams().get("email") || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"request" | "reset">("request");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

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

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await forgotPassword(email);
    if (result.success) {
      setStep("reset");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (newPassword !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    // Validate password using comprehensive validation
    if (!isPasswordValid) {
      setLocalError(
        `Password must meet all requirements: ${Array.isArray(passwordErrors) ? passwordErrors.join(", ") : "Unknown error"}`
      );
      return;
    }

    const result = await resetPassword(email, code, newPassword);
    if (result.success) {
      setShowSuccessDialog(true);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessDialog(false);
    navigate("LOGIN");
  };

  return (
    <AuthPageLayout
      title="Reset Password"
      subtitle="Enter your email to receive a reset code"
      error={error}
      variant="wide"
    >
      {/* Reset Form */}
      <form
        onSubmit={step === "request" ? handleRequestReset : handleResetPassword}
        className="card space-y-responsive-md"
      >
        {step === "request" ? (
          // Step 1: Request reset code
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            placeholder="Enter your email"
            leftIcon={<Mail className="h-4 w-4" />}
            name="email"
            id="email-request"
            autoComplete="username"
            variant="mobile"
            className="autofill-gold"
          />
        ) : (
          // Step 2: Reset password with code
          <>
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="Enter your email"
              leftIcon={<Mail className="h-4 w-4" />}
              name="email"
              id="email-request"
              autoComplete="username"
              variant="mobile"
              className="autofill-gold"
            />

            <Input
              label="Verification code"
              type="text"
              value={code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
              placeholder="Enter verification code"
              leftIcon={<Key className="h-4 w-4" />}
              name="code"
              id="verification-code"
              variant="mobile"
              className="autofill-gold"
            />

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
              <PasswordValidation password={newPassword} showValidation={newPassword.length > 0} />
            </div>

            <Input
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConfirmPassword(e.target.value)
              }
              placeholder="Confirm new password"
              leftIcon={<Lock className="h-4 w-4" />}
              name="confirm-password"
              id="confirm-password"
              autoComplete="new-password"
              variant="mobile"
              showPasswordToggle
              className="autofill-gold"
            />
          </>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="olive"
          size="md"
          fullWidth
          loading={loading}
          disabled={loading}
        >
          {step === "request" ? "Send reset code" : "Reset password"}
        </Button>

        <div className="text-responsive-xs text-center">
          Remember your password?
          <AuthLink
            to="/login"
            className="text-brown hover:text-brown/80 underline-offset-4 transition-colors hover:underline"
          >
            Login
          </AuthLink>
        </div>
      </form>

      {/* Success Dialog */}
      <SuccessDialog
        isOpen={showSuccessDialog}
        title="Password Reset Successful"
        message="Your password has been successfully reset. You can now log in with your new password."
        confirmText="Go to Login"
        onConfirm={handleSuccessConfirm}
      />
    </AuthPageLayout>
  );
}
