import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, Key } from "lucide-react";
import { authApi } from "../../lib/api";
import SuccessDialog from "../../components/modals/SuccessDialog";
import {
  PasswordValidation,
  usePasswordValidation,
} from "../../components/feedback/PasswordValidation";
import Input from "../../components/ui/base/Input";
import AuthButton from "../../components/ui/homeauth/AuthButton";
import AuthLink from "../../components/ui/homeauth/AuthLink";
import AuthPageLayout from "../../components/layout/AuthPageLayout";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"request" | "reset">("request");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const navigate = useNavigate();

  // Password validation
  const { isValid: isPasswordValid, errors: passwordErrors } =
    usePasswordValidation(newPassword);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { success, error } = await authApi.forgotPassword(email);

      if (!success) {
        throw new Error(error || "Failed to send reset code");
      }

      setStep("reset");
    } catch (error: unknown) {
      console.error("Forgot password error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send reset code. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password using comprehensive validation
    if (!isPasswordValid) {
      setError(
        `Password must meet all requirements: ${passwordErrors.join(", ")}`
      );
      setLoading(false);
      return;
    }

    try {
      const { success, error } = await authApi.resetPassword(
        email,
        code,
        newPassword
      );

      if (!success) {
        throw new Error(error || "Failed to reset password");
      }

      setShowSuccessDialog(true);
    } catch (error: unknown) {
      console.error("Reset password error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to reset password. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessDialog(false);
    navigate("/login");
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
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            leftIcon={<Mail className="w-4 h-4" />}
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
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              leftIcon={<Mail className="w-4 h-4" />}
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
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter verification code"
              leftIcon={<Key className="w-4 h-4" />}
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
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                leftIcon={<Lock className="w-4 h-4" />}
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

            <Input
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              leftIcon={<Lock className="w-4 h-4" />}
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
        <AuthButton type="submit" loading={loading} disabled={loading}>
          {step === "request" ? "Send reset code" : "Reset password"}
        </AuthButton>

        <div className="text-center text-responsive-xs">
          <span className="text-gray-600 text-responsive-xs">Remember your password?</span><AuthLink
            to="/login"
            className="text-brown hover:text-brown/80 hover:underline underline-offset-4 transition-colors"
          >Login</AuthLink>
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
