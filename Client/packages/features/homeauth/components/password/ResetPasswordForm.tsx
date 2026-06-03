import React, { type RefObject } from "react";

import { Icon } from "@ui/icons";

import { log } from "packages/logger";

import { PasswordValidation } from "@/components/feedback/PasswordValidation";
import { Button, Input, VerificationCodeInput } from "@/components/ui";
export type ResetPasswordStep = "request" | "verify" | "reset";
import { Box } from "packages/ui/components/primitives";
type ResetPasswordFormProps = {
  step: ResetPasswordStep;
  email: string;
  setEmail: (v: string) => void;
  code: string;
  setCode: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  loading: boolean;
  isPasswordValid: boolean;
  countdown: number;
  canResend: boolean;
  codeInputWrapperRef: RefObject<HTMLDivElement | null>;
  onSubmitRequest: (e: React.FormEvent) => void;
  onSubmitVerify: (e: React.FormEvent) => void;
  onSubmitReset: (e: React.FormEvent) => void;
  onResendCode: () => void;
};
export function ResetPasswordForm({
  step,
  email,
  setEmail,
  code,
  setCode,
  newPassword,
  setNewPassword,
  loading,
  isPasswordValid,
  countdown,
  canResend,
  codeInputWrapperRef,
  onSubmitRequest,
  onSubmitVerify,
  onSubmitReset,
  onResendCode,
}: ResetPasswordFormProps) {
  const onSubmit =
    step === "request" ? onSubmitRequest : step === "verify" ? onSubmitVerify : onSubmitReset;
  return (
    <form onSubmit={onSubmit} className="card space-y-responsive-md">
      {step === "request" ? (
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          placeholder="Enter your email"
          leftIcon={<Icon name="mail" className="h-4 w-4" />}
          name="email"
          id="email-request"
          autoComplete="username"
          variant="mobile"
          className="autofill-gold"
        />
      ) : step === "verify" ? (
        <Box ref={codeInputWrapperRef}>
          <VerificationCodeInput
            length={6}
            value={code}
            onChange={setCode}
            onComplete={(completedCode) => {
              setCode(completedCode);
              log.debug("AUTH", "Verification code input completed", {
                code: completedCode,
              });
            }}
            disabled={loading}
          />
        </Box>
      ) : (
        <Box className="space-y-1">
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            leftIcon={<Icon name="lock" className="h-4 w-4" />}
            name="new-password"
            id="new-password"
            autoComplete="new-password"
            variant="mobile"
            showPasswordToggle
            className="autofill-gold"
          />
          <PasswordValidation password={newPassword} showValidation={newPassword.length > 0} />
        </Box>
      )}

      <Button
        type="submit"
        variant="primary"
        size="md"
        fullWidth
        loading={loading}
        disabled={
          loading ||
          (step === "verify" && (!code || code.trim().length === 0)) ||
          (step === "reset" && !isPasswordValid)
        }
        className={step === "verify" ? "mb-1 mt-6" : ""}
      >
        {step === "request"
          ? "Send reset code"
          : step === "verify"
            ? "Verify code"
            : "Reset password"}
      </Button>

      {step === "verify" && (
        <Box className="text-responsive-sm text-text-secondary text-center">
          Didn't receive a code?{" "}
          <Button
            type="button"
            onClick={onResendCode}
            variant="ghost"
            size="sm"
            disabled={!canResend || loading}
            loading={loading && !canResend}
            className={canResend ? "text-accent hover:text-accent" : "text-text-disabled"}
          >
            {canResend ? "Resend code" : `Resend in ${countdown}s`}
          </Button>
        </Box>
      )}
    </form>
  );
}
