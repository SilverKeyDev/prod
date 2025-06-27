import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, ArrowLeft, RefreshCw } from "lucide-react";
import { authApi } from "../lib/api";

interface LocationState {
  email?: string;
}

export default function VerificationPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", ""]);
  const [activeStep, setActiveStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState;

  // Pre-fill email if coming from signup
  useEffect(() => {
    if (locationState?.email) {
      setEmail(locationState.email);
      setActiveStep("code");
      startCountdown();
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
        throw new Error(error || 'Failed to send verification code');
      }

      setActiveStep("code");
      startCountdown();
    } catch (error: unknown) {
      console.error('Resend code error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send verification code. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string, index: number) => {
    if (value && !/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const verificationCode = code.join("");
    if (verificationCode.length !== 4) {
      setError("Please enter a 4-digit code");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const userEmail = email || localStorage.getItem('signupEmail') || '';
      const { success, error, data } = await authApi.verify({
        email: userEmail,
        code: verificationCode,
      });

      if (!success) {
        throw new Error(error || 'Verification failed');
      }
      
      // Clear the stored email
      localStorage.removeItem('signupEmail');
      
      // Store user data from the response
      if (data?.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      // On success, redirect to dashboard
      navigate("/dashboard");
    } catch (error: unknown) {
      console.error('Verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Invalid verification code. Please try again.';
      setError(errorMessage);
      // Clear the code on error
      setCode(["", "", "", ""]);
      document.getElementById('code-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    setLoading(true);
    setError("");
    
    try {
      const userEmail = email || localStorage.getItem('signupEmail');
      if (!userEmail) {
        throw new Error('Email not found. Please go back and try again.');
      }
      
      const { success, error } = await authApi.resendCode(userEmail);

      if (!success) {
        throw new Error(error || 'Failed to resend verification code');
      }
      
      // Reset UI state
      startCountdown();
      setCode(["", "", "", ""]);
      document.getElementById('code-0')?.focus();
    } catch (error: unknown) {
      console.error('Resend code error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend verification code. Please try again.';
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

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center text-navy/60 hover:text-navy mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif text-navy mb-2">
            {activeStep === "email" ? "Verify your email" : "Enter verification code"}
          </h2>
          <p className="text-navy/60 font-light">
            {activeStep === "email"
              ? "We'll send you a code to verify your email"
              : `Enter the 4-digit code sent to ${email}`}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-md">
            {error}
          </div>
        )}

        {/* Email Step */}
        {activeStep === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-navy mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-navy/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  className="input-field pl-10 w-full"
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                  Sending...
                </div>
              ) : (
                "Send verification code"
              )}
            </button>
          </form>
        )}

        {/* Verification Code Step */}
        {activeStep === "code" && (
          <form onSubmit={handleCodeSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-center space-x-3">
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={code[index]}
                    onChange={(e) => handleCodeChange(e.target.value, index)}
                    onKeyDown={(e) => {
                      // Handle backspace to move to previous input
                      if (e.key === "Backspace" && !code[index] && index > 0) {
                        const prevInput = document.getElementById(`code-${index - 1}`);
                        if (prevInput) prevInput.focus();
                      }
                    }}
                    className="w-16 h-16 text-2xl text-center border border-navy/20 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              
              <div className="text-center text-sm text-navy/60">
                Didn't receive a code?{" "}
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={!canResend || loading}
                  className={`${
                    canResend ? "text-gold hover:text-gold/80" : "text-navy/40"
                  } font-medium transition-colors`}
                >
                  {loading ? (
                    <span className="inline-flex items-center">
                      <RefreshCw className="animate-spin h-3 w-3 mr-1" />
                      Sending...
                    </span>
                  ) : canResend ? (
                    "Resend code"
                  ) : (
                    `Resend in ${countdown}s`
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || code.join("").length !== 4}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <RefreshCw className="animate-spin h-5 w-5 mr-2" />
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
