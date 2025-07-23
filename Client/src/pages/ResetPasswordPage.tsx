import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, ArrowLeft, Key } from "lucide-react";
import { authApi } from "../lib/api";
import SuccessDialog from "../components/SuccessDialog";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const navigate = useNavigate();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { success, error } = await authApi.forgotPassword(email);

      if (!success) {
        throw new Error(error || 'Failed to send reset code');
      }

      setStep('reset');
    } catch (error: unknown) {
      console.error('Forgot password error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset code. Please try again.';
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

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      const { success, error } = await authApi.resetPassword(email, code, newPassword);

      if (!success) {
        throw new Error(error || 'Failed to reset password');
      }

      setShowSuccessDialog(true);
    } catch (error: unknown) {
      console.error('Reset password error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password. Please try again.';
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
    <div className="min-h-screen bg-off-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-serif text-black mb-2">
            {step === 'request' ? 'Reset your password' : 'Enter new password'}
          </h2>
          <p className="text-black/60 font-light text-sm sm:text-base">
            {step === 'request' 
              ? 'Enter your email to receive a reset code'
              : 'Enter the code sent to your email and your new password'
            }
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-md">
            {error}
          </div>
        )}

        {/* Reset Form */}
        <form onSubmit={step === 'request' ? handleRequestReset : handleResetPassword} className="card space-y-4 sm:space-y-6">
          {/* Home Button */}
          <Link
            to="/login"
            className="inline-flex items-center text-black/60 hover:text-black transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Back to Login</span>
          </Link>

          {step === 'request' ? (
            // Step 1: Request reset code
            <div>
              <label className="block text-xs font-medium text-black mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-black/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10 h-12 sm:h-10 text-base sm:text-sm"
                  placeholder="Enter your email"
                  autoComplete="username"
                  required
                />
              </div>
            </div>
          ) : (
            // Step 2: Reset password with code
            <>
              <div>
                <label className="block text-xs font-medium text-black mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-black/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10 h-12 sm:h-10 text-base sm:text-sm"
                    placeholder="Enter your email"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-2">
                  Verification code
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-black/40" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="input-field pl-10 h-12 sm:h-10 text-base sm:text-sm"
                    placeholder="Enter verification code"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-2">
                  New password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-black/40" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field pl-10 h-12 sm:h-10 text-base sm:text-sm"
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-2">
                  Confirm new password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-black/40" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field pl-10 h-12 sm:h-10 text-base sm:text-sm"
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed h-12 sm:h-10 text-base sm:text-sm font-semibold"
          >
            {loading ? (
              <div className="shimmer w-16 h-5 rounded mx-auto"></div>
            ) : step === 'request' ? (
              "Send reset code"
            ) : (
              "Reset password"
            )}
          </button>

          {step === 'reset' && (
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => setStep('request')}
                className="text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base"
              >
                Didn't receive code? Send again
              </button>
            </div>
          )}

          <div className="flex items-center justify-center gap-6 text-sm">
            <Link
              to="/login"
              className="text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base"
            >
              Back to login
            </Link>
            <Link
              to="/signup"
              className="text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base"
            >
              Create an account
            </Link>
          </div>
        </form>

        {/* Footer Links */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-col items-center justify-center gap-4 text-sm text-center">
            <div className="flex flex-wrap items-center justify-center gap-6 text-black/60">
              <Link 
                to="/privacy" 
                className="hover:text-black transition-colors hover:underline underline-offset-4 decoration-brown/40"
              >
                Privacy Policy
              </Link>
              <Link 
                to="/terms" 
                className="hover:text-black transition-colors hover:underline underline-offset-4 decoration-brown/40"
              >
                Terms of Service
              </Link>
              <Link 
                to="/contact" 
                className="hover:text-black transition-colors hover:underline underline-offset-4 decoration-brown/40"
              >
                Contact Us
              </Link>
            </div>
            <p className="text-xs text-black/40">
              © {new Date().getFullYear()} SilverKey. All rights reserved.
            </p>
          </div>
        </div>
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
