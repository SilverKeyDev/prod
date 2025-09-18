/**
 * Step-up Authentication Modal
 * Requires users to re-authenticate with password and optional MFA for sensitive actions
 */

import { Shield, AlertTriangle, Lock } from "lucide-react";
import React, { useState, useEffect } from "react";

import { reportSecurityEvent } from "../../core/services/security/errorReporting";
import { log } from "../../core/services/security/secureLogger";
import BaseModal from "../modals/BaseModal";
import Button from "../ui/button/Button";
import Input from "../ui/form/Input";

type StepUpAuthProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
  requireMFA?: boolean;
  maxAttempts?: number;
  lockoutDuration?: number;
};

export const StepUpAuth: React.FC<StepUpAuthProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = "Security Verification Required",
  description = "Please verify your identity to continue with this sensitive action.",
  requireMFA = false,
  maxAttempts = 3,
  lockoutDuration = 90 * 60 * 1000, // 30 minutes
}) => {
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
  const [step, setStep] = useState<"password" | "mfa">("password");

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setMfaCode("");
      setError("");
      setStep("password");
      checkLockoutStatus();
    }
  }, [isOpen]);

  // Check if user is locked out from previous attempts
  const checkLockoutStatus = () => {
    const lockoutKey = `stepup_lockout_${Date.now()}`;
    const lockoutData = sessionStorage.getItem(lockoutKey);

    if (lockoutData) {
      const parsedData = JSON.parse(lockoutData) as { until: number };
      if (Date.now() < parsedData.until) {
        setIsLockedOut(true);
        setLockoutEndTime(parsedData.until);
        return;
      } else {
        sessionStorage.removeItem(lockoutKey);
      }
    }

    setIsLockedOut(false);
    setLockoutEndTime(null);
  };

  // Handle lockout timer
  useEffect(() => {
    if (lockoutEndTime) {
      const timer = setInterval(() => {
        if (Date.now() >= lockoutEndTime) {
          setIsLockedOut(false);
          setLockoutEndTime(null);
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [lockoutEndTime]);

  const recordAttempt = (success: boolean) => {
    setAttempts((prev) => prev + 1);

    // Check for lockout after failed attempts
    if (!success && attempts >= maxAttempts) {
      const lockoutUntil = Date.now() + lockoutDuration;
      sessionStorage.setItem(
        `stepup_lockout_${Date.now()}`,
        JSON.stringify({
          until: lockoutUntil,
        })
      );

      setIsLockedOut(true);
      setLockoutEndTime(lockoutUntil);

      reportSecurityEvent({
        type: "authentication_failure",
        severity: "high",
        description: `Step-up authentication locked out after ${maxAttempts} failed attempts`,
      });
    }
  };

  const validatePassword = async (password: string): Promise<boolean> => {
    try {
      // In a real implementation, this would validate against the backend
      // For now, simulate validation
      const response = await fetch("/api/v1/auth/validate-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const data = (await response.json()) as { valid: boolean };
        return data.valid === true;
      }

      return false;
    } catch (error: unknown) {
      // Type-safe error handling with proper type guards
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null
            ? (() => {
                try {
                  return JSON.stringify(error);
                } catch {
                  return "[Object]";
                }
              })()
            : (() => {
                try {
                  if (typeof error === "string") return error;
                  if (typeof error === "number") return String(error);
                  if (typeof error === "boolean") return String(error);
                  if (error === null || error === undefined)
                    return "Unknown error";
                  return "[Unknown]";
                } catch {
                  return "[Unknown]";
                }
              })();
      log.error("STEP_UP_AUTH", "Password validation failed", {
        error: errorMessage,
      });
      return false;
    }
  };

  const validateMFA = async (code: string): Promise<boolean> => {
    try {
      // In a real implementation, this would validate MFA code
      const response = await fetch("/api/v1/auth/validate-mfa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        const data = (await response.json()) as { valid: boolean };
        return data.valid === true;
      }

      return false;
    } catch (error: unknown) {
      // Type-safe error handling with proper type guards
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null
            ? (() => {
                try {
                  return JSON.stringify(error);
                } catch {
                  return "[Object]";
                }
              })()
            : (() => {
                try {
                  if (typeof error === "string") return error;
                  if (typeof error === "number") return String(error);
                  if (typeof error === "boolean") return String(error);
                  if (error === null || error === undefined)
                    return "Unknown error";
                  return "[Unknown]";
                } catch {
                  return "[Unknown]";
                }
              })();
      log.error("STEP_UP_AUTH", "MFA validation failed", {
        error: errorMessage,
      });
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const isValid = await validatePassword(password);

      if (isValid) {
        if (requireMFA) {
          setStep("mfa");
        } else {
          handleSuccess();
        }
      } else {
        recordAttempt(false);
        setError("Invalid password. Please try again.");
        reportSecurityEvent({
          type: "authentication_failure",
          severity: "medium",
          description: "Step-up authentication password validation failed",
        });
      }
    } catch (error: unknown) {
      recordAttempt(false);
      setError("Authentication failed. Please try again.");
      // Type-safe error handling with proper type guards
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null
            ? (() => {
                try {
                  return JSON.stringify(error);
                } catch {
                  return "[Object]";
                }
              })()
            : (() => {
                try {
                  if (typeof error === "string") return error;
                  if (typeof error === "number") return String(error);
                  if (typeof error === "boolean") return String(error);
                  if (error === null || error === undefined)
                    return "Unknown error";
                  return "[Unknown]";
                } catch {
                  return "[Unknown]";
                }
              })();
      log.error("STEP_UP_AUTH", "Password validation error", {
        error: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFASubmit = async () => {
    if (!mfaCode.trim()) {
      setError("MFA code is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const isValid = await validateMFA(mfaCode);

      if (isValid) {
        handleSuccess();
      } else {
        recordAttempt(false);
        setError("Invalid MFA code. Please try again.");
        reportSecurityEvent({
          type: "authentication_failure",
          severity: "medium",
          description: "Step-up authentication MFA validation failed",
        });
      }
    } catch (error: unknown) {
      recordAttempt(false);
      setError("MFA validation failed. Please try again.");
      // Type-safe error handling with proper type guards
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null
            ? (() => {
                try {
                  return JSON.stringify(error);
                } catch {
                  return "[Object]";
                }
              })()
            : (() => {
                try {
                  if (typeof error === "string") return error;
                  if (typeof error === "number") return String(error);
                  if (typeof error === "boolean") return String(error);
                  if (error === null || error === undefined)
                    return "Unknown error";
                  return "[Unknown]";
                } catch {
                  return "[Unknown]";
                }
              })();
      log.error("STEP_UP_AUTH", "MFA validation error", {
        error: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    log.security("STEP_UP_AUTH", "Step-up authentication successful");

    // Store successful authentication timestamp for session
    sessionStorage.setItem(`stepup_${title}`, Date.now().toString());

    onSuccess();
    onClose();
  };

  const getRemainingLockoutTime = (): string => {
    if (!lockoutEndTime) return "";

    const remaining = Math.ceil((lockoutEndTime - Date.now()) / 1000);
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const headerContent = (
    <div className="flex items-center space-x-2">
      <Shield className="h-5 w-5 text-brand-accent" />
      <span className="text-base font-medium text-gray-900 sm:text-lg">
        {title}
      </span>
    </div>
  );

  const footerContent = (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:gap-2">
      <Button
        variant="ghost"
        onClick={onClose}
        disabled={isLoading}
        className="order-2 sm:order-1"
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={step === "password" ? handleSubmit : handleMFASubmit}
        loading={isLoading}
        disabled={
          isLockedOut || !password || (requireMFA && step === "mfa" && !mfaCode)
        }
        className="order-1 sm:order-2"
      >
        {isLoading ? "Verifying..." : "Verify Identity"}
      </Button>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      headerContent={headerContent}
      footerContent={footerContent}
      closeOnBackdropClick={false}
    >
      {/* Action Description */}
      <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start">
          <AlertTriangle className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-800">{description}</p>
          </div>
        </div>
      </div>

      {/* Lockout Message */}
      {isLockedOut && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Account Temporarily Locked
              </p>
              <p className="text-sm text-red-700">
                Too many failed attempts. Try again in{" "}
                {getRemainingLockoutTime()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Password Step */}
      {step === "password" && !isLockedOut && (
        <div className="space-y-4">
          {/* Password Field */}
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            placeholder="Enter your password"
            disabled={isLoading ?? isLockedOut}
            required
            showPasswordToggle
            autoComplete="current-password"
            leftIcon={<Lock className="h-4 w-4" />}
          />
        </div>
      )}

      {/* MFA Step */}
      {step === "mfa" && !isLockedOut && (
        <div className="space-y-4">
          {/* MFA Field */}
          {requireMFA && (
            <Input
              label="MFA Code"
              type="text"
              value={mfaCode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="Enter 6-digit MFA code"
              disabled={isLoading ?? isLockedOut}
              required
              maxLength={6}
              autoComplete="one-time-code"
            />
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </BaseModal>
  );
};
