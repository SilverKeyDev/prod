import React, { type RefObject } from "react";

import { Icon } from "@ui/icons";

import { applyCodeChange, applyPaste, getBackspaceFocusIndex } from "packages/utils/verification";

import Card from "@/components/layout/Card.web";
import { BodyText, Button, Input, Label, MiniLogo, Title } from "@/components/ui";
export type VerificationStep = "email" | "code";
type VerificationCodeInputsProps = {
  code: string[];
  setCode: (v: string[]) => void;
  inputRefs: RefObject<Array<HTMLInputElement | null>>;
  loading: boolean;
  onVerify: () => void;
};
export function VerificationCodeInputs({
  code,
  setCode,
  inputRefs,
  loading,
  onVerify,
}: VerificationCodeInputsProps) {
  const handleCodeChange = (value: string, index: number) => {
    const { nextCode, nextFocusIndex } = applyCodeChange(code, value, index);
    setCode(nextCode);
    inputRefs.current?.[nextFocusIndex]?.focus();
    if (index === 5 && nextCode.every((digit) => digit)) void onVerify();
  };
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text/plain");
    const { nextCode, nextFocusIndex } = applyPaste(code, pasteData, index);
    setCode(nextCode);
    inputRefs.current?.[nextFocusIndex]?.focus();
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const focusIndex = getBackspaceFocusIndex(code, index);
      if (focusIndex !== null) inputRefs.current?.[focusIndex]?.focus();
    }
  };
  return (
    <div className="flex justify-center gap-3">
      {code.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => {
            if (inputRefs.current) inputRefs.current[index] = el;
          }}
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
          className="border-olive focus:ring-olive h-12 w-12 rounded-lg border-2 text-center text-lg font-bold text-gray-500 focus:border-transparent focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading}
        />
      ))}
    </div>
  );
}
type VerificationFormProps = {
  activeStep: VerificationStep;
  email: string;
  setEmail: (v: string) => void;
  code: string[];
  setCode: (v: string[]) => void;
  setError: (v: string) => void;
  loading: boolean;
  error: string;
  isFromSignup: boolean;
  isFromLogin: boolean;
  countdown: number;
  canResend: boolean;
  inputRefs: RefObject<Array<HTMLInputElement | null>>;
  onBack: () => void;
  onEmailSubmit: (e: React.FormEvent) => void;
  onVerify: () => void;
  onResendCode: () => void;
};
export function VerificationForm({
  activeStep,
  email,
  setEmail,
  code,
  setCode: _setCode,
  setError,
  loading,
  error,
  isFromSignup,
  isFromLogin,
  countdown,
  canResend,
  inputRefs: _inputRefs,
  onBack,
  onEmailSubmit,
  onVerify,
  onResendCode,
}: VerificationFormProps) {
  return (
    <div className="px-responsive-sm py-responsive-md bg-off-white flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        <Card className="space-y-responsive-md">
          {!isFromSignup && (
            <Button
              onClick={onBack}
              variant="ghost"
              icon={<Icon name="arrow-left" className="mobile-icon-sm" />}
              iconPosition="left"
            >
              Back
            </Button>
          )}
          <div className="text-center">
            <Title size="lg" as="h2" className="mb-4 flex items-center justify-center gap-2">
              <MiniLogo size="md" />
              {activeStep === "email" ? "Verify your email" : "Enter verification code"}
            </Title>
          </div>
          <BodyText size="sm" muted className="mb-4 text-center">
            {activeStep === "email"
              ? "We'll send you a code to verify your email"
              : `Enter the 6-digit code sent to ${email}`}
          </BodyText>
          {isFromLogin && !error && (
            <div className="space-y-responsive-md space-responsive-sm text-responsive-sm rounded-md bg-yellow-50 p-3 text-yellow-800">
              Please verify your email address to continue. A verification code has been sent to
              your email.
            </div>
          )}
          {error && (
            <div className="space-y-responsive-md space-responsive-sm text-responsive-sm rounded-md bg-red-50 text-red-600">
              {error}
            </div>
          )}
          {activeStep === "email" && (
            <form onSubmit={onEmailSubmit} className="space-y-responsive-md">
              <div>
                <Label
                  id="verification-email-label"
                  htmlFor="verification-email"
                  className="text-responsive-sm space-y-responsive-xs block font-medium text-black"
                >
                  Email address
                </Label>
                <Input
                  id="verification-email"
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your email"
                  leftIcon={<Icon name="mail" className="mobile-icon-sm" />}
                  autoComplete="email"
                  variant="mobile"
                  size="md"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                Send verification code
              </Button>
            </form>
          )}
          {activeStep === "code" && (
            <form
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => e.preventDefault()}
              className="space-y-responsive-md"
            >
              <VerificationCodeInputs
                code={code}
                setCode={_setCode}
                inputRefs={_inputRefs}
                loading={loading}
                onVerify={onVerify}
              />
              <div className="text-responsive-sm text-center text-black/60">
                Didn't receive a code?{" "}
                <Button
                  type="button"
                  onClick={onResendCode}
                  variant="ghost"
                  size="sm"
                  disabled={!canResend || loading}
                  loading={loading}
                  className={canResend ? "text-gold hover:text-gold/80" : "text-black/40"}
                >
                  {loading ? "Sending..." : canResend ? "Resend code" : `Resend in ${countdown}s`}
                </Button>
              </div>
              <div className="mt-6 flex justify-center">
                <Button
                  type="button"
                  onClick={onVerify}
                  variant="primary"
                  size="md"
                  loading={loading}
                  disabled={loading || code.join("").length !== 6}
                  className="w-72"
                >
                  Verify
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
