import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, ArrowLeft, Key } from "lucide-react";
import { authApi } from "../../lib/api";
import SuccessDialog from "../../components/modals/SuccessDialog";
import {
  PasswordValidation,
  usePasswordValidation,
} from "../../components/feedback/PasswordValidation";
import MiniLogo from "../../components/ui/MiniLogo";
import AuthInput from "../../components/ui/AuthInput";
import AuthButton from "../../components/ui/AuthButton";
import AuthLink from "../../components/ui/AuthLink";
import AuthFooter from "../../components/ui/AuthFooter";

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
    <div className="min-h-screen bg-off-white flex items-center justify-center px-responsive-sm py-responsive-md">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center space-y-responsive-lg">
          <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif text-black space-y-responsive-xs flex items-center justify-center gap-responsive-xs">
            <MiniLogo size="md" />
            {step === "request" ? "Reset your password" : "Enter new password"}
          </h2>
          <p className="text-black/60 font-light text-responsive-xs">
            {step === "request"
              ? "Enter your email to receive a reset code"
              : "Enter the code sent to your email and your new password"}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="space-y-responsive-md space-responsive-sm bg-red-50 text-red-600 text-responsive-sm rounded-md">
            {error}
          </div>
        )}

        {/* Reset Form */}
        <form
          onSubmit={
            step === "request" ? handleRequestReset : handleResetPassword
          }
          className="card space-y-responsive-md"
        >
          {/* Home Button */}
          <AuthLink to="/login" variant="back">
            <ArrowLeft className="mobile-icon-sm mr-2" />
            <span className="text-responsive-xs font-medium">Back to Login</span>
          </AuthLink>

          {step === "request" ? (
            // Step 1: Request reset code
            <AuthInput
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              icon={Mail}
              autoComplete="username"
              required
            />
          ) : (
            // Step 2: Reset password with code
            <>
              <AuthInput
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                icon={Mail}
                autoComplete="username"
                required
              />

              <AuthInput
                label="Verification code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter verification code"
                icon={Key}
                required
              />

              <div className="mb-6">
                <label className="block text-responsive-xs font-medium text-black space-y-responsive-xs">
                  New password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 mobile-icon-xs text-black/40" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field pl-10 btn-responsive-md text-responsive-sm border-gray-300 focus:border-brown focus:ring-brown/20"
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <PasswordValidation
                  password={newPassword}
                  showValidation={newPassword.length > 0}
                />
              </div>

              <AuthInput
                label="Confirm new password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                icon={Lock}
                autoComplete="new-password"
                required
              />
            </>
          )}

          {/* Submit Button */}
          <AuthButton
            type="submit"
            loading={loading}
            disabled={loading}
          >
            {step === "request" ? "Send reset code" : "Reset password"}
          </AuthButton>

          <div className="text-center text-responsive-xs">
            <span className="text-gray-600 text-responsive-xs">
              Remember your password?{" "}
            </span>
            <AuthLink
              to="/login"
              className="text-brown hover:text-brown/80 hover:underline underline-offset-4 transition-colors"
            >
              Sign in
            </AuthLink>
          </div>
        </form>

        <AuthFooter />
      </div>

      {/* Success Dialog */}
      <SuccessDialog
        isOpen={showSuccessDialog}
        title="Password Reset Successful"
        message="Your password has been successfully reset. You can now log in with your new password."
        confirmText="Go to Login"
        onConfirm={handleSuccessConfirm}
      />
    </div>
  );
}
