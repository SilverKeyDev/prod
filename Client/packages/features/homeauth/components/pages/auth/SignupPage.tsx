import React, { useState } from "react";

import AuthPageLayout from "packages/features/homeauth/components/core/PageLayout";
import { useSignup } from "packages/features/homeauth/hooks/data/useAuthActions";
import {
  getSignupPayload,
  persistSignupEmailForVerification,
} from "packages/features/homeauth/utils/signupPayload";
import { type SignupFormData, useSignupAutofill } from "packages/hooks/data/auth/useSignupAutofill";
import { signupFormatPhone } from "packages/hooks/data/auth/useSignupAutofill";
import { showErrorToast } from "packages/hooks/ui/toast/useToast";
import { useNavigation } from "packages/navigation";
import { ROUTES } from "packages/navigation";
import { getDocument } from "packages/utils/platform";

import { usePasswordValidation } from "@/components/feedback";

import SignupFormFields from "./SignupFormFields";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type SignupPageProps = {
  // No props currently needed
};

const SIGNUP_PHONE_AUTOFILL_STYLES = `
  #phone-field .nested-phone-input {
    width: 100%;
    display: flex;
    align-items: center;
    background: transparent;
    border: none;
    padding: 0 0 0 2.5rem;
    margin: 0;
    position: relative;
  }
  #phone-field .PhoneInputCountry { flex: 0 0 auto; }
  #phone-field .PhoneInputInput {
    flex: 1;
    min-width: 0;
    position: relative;
    z-index: 1;
    border: 0 !important;
    outline: 0 !important;
    background: transparent !important;
  }
  #phone-field .PhoneInputInput.autofill-gold:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px rgba(255, 243, 191, 0.8) inset !important;
    box-shadow: inset 0 0 0 1000px rgba(255, 243, 191, 0.8) !important;
    -webkit-text-fill-color: inherit !important;
    caret-color: inherit !important;
    transition: background-color 5000s ease-in-out 0s;
  }
  #phone-field .PhoneInputInput.autofill-gold:-moz-autofill {
    box-shadow: inset 0 0 0 1000px rgba(255, 243, 191, 0.8) !important;
    -moz-text-fill-color: inherit !important;
    caret-color: inherit !important;
  }
  #phone-field .fieldshell-overlay,
  #phone-field .fieldshell-left,
  #phone-field .fieldshell-right { pointer-events: none; }
`;

export default function SignupPage(_props: SignupPageProps) {
  const [formData, setFormData] = useState<SignupFormData>({
    name: "",
    email: "",
    password: "",
    agencyName: "",
  });
  const [phoneValue, setPhoneValue] = useState<string | undefined>(undefined);

  const { navigate, getCurrentRoute } = useNavigation();
  const { signup, isLoading: isSignupLoading } = useSignup();
  const isOnboarding = getCurrentRoute().pathname === ROUTES.ONBOARDING;
  const { syncFromDom, lastFocusRef } = useSignupAutofill(setFormData, setPhoneValue);

  const { isValid: isPasswordValid, errors: passwordErrors } = usePasswordValidation(
    formData.password
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      showErrorToast(
        `Password must meet all requirements: ${Array.isArray(passwordErrors) ? passwordErrors.join(", ") : "Unknown error"}`
      );
      return;
    }
    const result = await signup(
      getSignupPayload({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: phoneValue ?? undefined,
        agencyName: formData.agencyName ?? undefined,
      })
    );
    if (result.success) {
      persistSignupEmailForVerification(formData.email, formData.password);
      navigate("VERIFICATION", undefined, { state: { email: formData.email } });
    } else if (result.error) {
      showErrorToast(result.error);
    }
  };

  const handlePhoneChange = (value: string | undefined) => {
    const doc = getDocument();
    const fieldShell = doc?.querySelector("#phone.autofill-parent");
    if (fieldShell) (fieldShell as HTMLElement).classList.remove("is-autofilled");
    setPhoneValue(signupFormatPhone(value));
  };

  return (
    <AuthPageLayout
      title="Create your account"
      subtitle="Join thousands of users making smarter property decisions"
      logoSize="lg"
      showHeader={false}
      variant="wide"
    >
      <style>{SIGNUP_PHONE_AUTOFILL_STYLES}</style>
      <form
        onSubmit={handleSubmit}
        className="card space-y-responsive-md"
        autoComplete="on"
        method="post"
        action="/signup"
      >
        <SignupFormFields
          formData={formData}
          setFormData={setFormData}
          phoneValue={phoneValue}
          onPhoneChange={handlePhoneChange}
          syncFromDom={syncFromDom}
          lastFocusRef={lastFocusRef}
          onSubmit={handleSubmit}
          isSignupLoading={isSignupLoading}
          onboarding={isOnboarding}
        />
      </form>
    </AuthPageLayout>
  );
}
