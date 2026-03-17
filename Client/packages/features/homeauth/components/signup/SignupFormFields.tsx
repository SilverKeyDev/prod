import React from "react";

import { Icon } from "@ui/icons";

import { spacing } from "packages/design-tokens";
import { GoogleSignInButton } from "packages/features/homeauth/components/auth";
import AuthDivider from "packages/features/homeauth/components/core/Divider";
import AuthLink from "packages/features/homeauth/components/core/Link";
import type { FieldKey, SignupFormData } from "packages/hooks/data/auth/useSignupAutofill";
import { Box } from "packages/ui/components/primitives";
import { getSharedInputTextStyles } from "packages/utils/ui/inputStyles";

import { PasswordValidation } from "@/components/feedback";
import { Button, FieldShell, Input, PhoneInput } from "@/components/ui";
const BarePhoneTextInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => {
  const { style, className, placeholder, ...rest } = props;
  return (
    <Input
      ref={ref}
      {...rest}
      placeholder={placeholder}
      className={`autofill-gold h-full w-full border-0 bg-transparent outline-none focus:outline-none focus:ring-0 ${(getSharedInputTextStyles as () => string)()} ${className ?? ""}`}
      style={{
        flex: 1,
        minWidth: spacing(0),
        position: "relative",
        zIndex: 1,
        cursor: "text",
        pointerEvents: "auto",
        border: "none",
        outline: "none",
        boxShadow: "none",
        padding: spacing(0),
        margin: spacing(0),
        appearance: "none",
        WebkitAppearance: "none",
        MozAppearance: "textfield",
        WebkitTapHighlightColor: "transparent",
        background: "transparent",
        WebkitTextFillColor: "inherit",
        ...style,
      }}
    />
  );
});
BarePhoneTextInput.displayName = "BarePhoneTextInput";
export type SignupFormFieldsProps = {
  formData: SignupFormData;
  setFormData: React.Dispatch<React.SetStateAction<SignupFormData>>;
  phoneValue: string | undefined;
  onPhoneChange: (value: string | undefined) => void;
  syncFromDom: (which: FieldKey) => void;
  lastFocusRef: React.MutableRefObject<FieldKey>;
  onSubmit: (e: React.FormEvent) => void;
  isSignupLoading: boolean;
  /** When true (e.g. on onboarding page), the name input is hidden. */
  onboarding?: boolean;
};
export default function SignupFormFields({
  formData,
  setFormData,
  phoneValue,
  onPhoneChange,
  syncFromDom,
  lastFocusRef,
  onSubmit: _onSubmit,
  isSignupLoading,
  onboarding = false,
}: SignupFormFieldsProps) {
  return (
    <>
      {!onboarding && (
        <Input
          label="Full Name"
          type="text"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setFormData((prev) => ({ ...prev, name: e.target.value }));
            setTimeout(() => syncFromDom("name"), 100);
          }}
          placeholder="Enter your full name"
          leftIcon={<Icon name="user" className="pointer-events-none h-4 w-4" />}
          name="name"
          id="name"
          autoComplete="name"
          variant="mobile"
          className="autofill-gold"
          onFocus={() => {
            lastFocusRef.current = "name";
            syncFromDom("all");
            setTimeout(() => syncFromDom("name"), 200);
            setTimeout(() => syncFromDom("name"), 500);
          }}
        />
      )}

      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setFormData((prev) => ({ ...prev, email: e.target.value }))
        }
        placeholder="Enter your email"
        leftIcon={<Icon name="mail" className="pointer-events-none h-4 w-4" />}
        name="email"
        id="email"
        autoComplete="email"
        variant="mobile"
        className="autofill-gold"
        onFocus={() => {
          lastFocusRef.current = "email";
          syncFromDom("email");
        }}
      />

      <FieldShell
        label="Phone Number"
        leftIcon={<Icon name="phone" className="pointer-events-none h-4 w-4" />}
        variant="mobile"
        size="md"
        className="autofill-parent"
        id="phone"
      >
        <PhoneInput
          international
          defaultCountry="US"
          value={phoneValue}
          onChange={onPhoneChange}
          placeholder="Enter phone number"
          id="phone"
          name="phone"
          inputMode="tel"
          autoComplete="tel"
          className="nested-phone-input"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            background: "transparent",
            border: "none",
            padding: `0 0 0 ${spacing(10)}`,
            margin: spacing(0),
          }}
          inputComponent={BarePhoneTextInput}
          onFocus={(e: React.FocusEvent<HTMLDivElement>) => {
            lastFocusRef.current = "phone";
            syncFromDom("phone");
            const inputEl = e.currentTarget.querySelector(
              "input.PhoneInputInput"
            ) as HTMLInputElement | null;
            if (inputEl) inputEl.focus();
          }}
        />
      </FieldShell>

      <Input
        label="Password"
        type="password"
        value={formData.password}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setFormData((prev) => ({ ...prev, password: e.target.value }))
        }
        placeholder="Create a password"
        leftIcon={<Icon name="lock" className="pointer-events-none h-4 w-4" />}
        name="new-password"
        id="password"
        autoComplete="new-password"
        variant="mobile"
        showPasswordToggle
        className="autofill-gold"
        data-form-type="other"
        onFocus={() => {
          lastFocusRef.current = "password";
          syncFromDom("password");
        }}
      />

      <Box className="space-y-3">
        <PasswordValidation
          password={formData.password}
          showValidation={formData.password.length > 0}
        />
      </Box>

      <Button
        type="submit"
        variant="primary"
        size="md"
        fullWidth
        loading={isSignupLoading}
        disabled={isSignupLoading}
      >
        Create account
      </Button>

      <AuthDivider />

      <GoogleSignInButton text="Sign up with Google" />

      <Box className="text-signup-mid text-center">
        Already have an account?
        <AuthLink
          to="/login"
          className="text-text-secondary hover:text-text-secondary underline-offset-4 transition-colors hover:underline"
        >
          Sign in
        </AuthLink>
      </Box>
    </>
  );
}
