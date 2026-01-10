import { Mail, Lock, User as UserIcon, Phone } from "lucide-react";
import React, { useEffect, useState, useCallback, useRef } from "react";
import PhoneInput from "react-phone-number-input";
import { useNavigate } from "react-router-dom";

import "react-phone-number-input/style.css"; // keep base layout; visual overrides below
import {
  PasswordValidation,
  usePasswordValidation,
} from "../../components/feedback";
import { Button, Input, FieldShell } from "../../components/ui";
import { getSharedInputTextStyles } from "../../components/ui/form/InputStyleUtils";
import { useSignup } from "../../../../packages/hooks/data/useAuthActions";
import { showErrorToast } from "../../../../packages/hooks/ui/useToast";
import AuthDivider from "../../features/homeauth/Auth/Divider";
import AuthLink from "../../features/homeauth/Auth/Link";
import AuthPageLayout from "../../features/homeauth/Auth/PageLayout";
import GoogleSignInButton from "../../components/auth/GoogleSignInButton";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type SignupPageProps = {
  // No props currently needed
};

const BarePhoneTextInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => {
  const { style, className, placeholder, ...rest } = props;
  return (
    <input
      ref={ref}
      {...rest}
      placeholder={placeholder}
      className={`autofill-gold h-full w-full border-0 bg-transparent outline-none focus:outline-none focus:ring-0 ${(getSharedInputTextStyles as () => string)()} ${
        className ?? ""
      }`}
      style={{
        // real input owns the space & is clickable
        flex: 1,
        minWidth: 0,
        position: "relative",
        zIndex: 1,
        cursor: "text",
        pointerEvents: "auto",

        // strip native styles
        border: "none",
        outline: "none",
        boxShadow: "none",
        padding: "0",
        margin: "0",
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

// E.164 normalizer with email validation guard
const formatToE164 = (phoneNumber: string | undefined): string | undefined => {
  if (!phoneNumber?.trim()) return undefined;

  // If the value looks like an email (common autofill quirk), ignore
  if (phoneNumber.includes("@")) {
    // Phone autofill received email value, ignoring
    return undefined;
  }

  const cleaned = phoneNumber.replace(/[\s\-().]/g, "");

  // Basic phone validation: digits and optional leading +
  if (!/^[+]?[\d]+$/.test(cleaned)) {
    // Phone autofill received invalid format, ignoring
    return undefined;
  }

  if (!cleaned.startsWith("+")) return `+1${cleaned}`;
  return cleaned;
};

type FieldKey = "all" | "name" | "email" | "password" | "phone";

export default function SignupPage(_props: SignupPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    agencyName: "",
  });
  const [phoneValue, setPhoneValue] = useState<string | undefined>(undefined);
  const [, setAutofilled] = useState(false);
  const lastFocusRef = useRef<FieldKey>("all"); // tracks which field initiated sync intent

  const navigate = useNavigate();
  const { signup, isLoading: isSignupLoading } = useSignup();

  // DOM getters
  const getDomEls = () => {
    const nameEl = document.getElementById("name") as HTMLInputElement | null;
    const emailEl = document.getElementById("email") as HTMLInputElement | null;
    const pwdEl = document.getElementById(
      "password"
    ) as HTMLInputElement | null;
    const phoneEl = document.querySelector("input.PhoneInputInput");
    return { nameEl, emailEl, pwdEl, phoneEl };
  };

  // Field-aware sync function
  const syncFromDom = useCallback((which: FieldKey) => {
    const { nameEl, emailEl, pwdEl, phoneEl } = getDomEls();

    // Helper readers
    const readName = () => nameEl?.value ?? "";
    const readEmail = () => emailEl?.value ?? "";
    const readPwd = () => pwdEl?.value ?? "";
    const readPhone = (): string | undefined => {
      const raw =
        phoneEl && "value" in phoneEl && typeof phoneEl.value === "string"
          ? (phoneEl.value as string).trim()
          : undefined;
      if (!raw) return undefined;
      return formatToE164(raw);
    };

    // Determine if anything is actually filled (to avoid wiping)
    const anyFilled: boolean =
      !!nameEl?.value?.trim() ||
      !!emailEl?.value?.trim() ||
      !!pwdEl?.value ||
      !!(phoneEl && "value" in phoneEl && typeof phoneEl.value === "string"
        ? (phoneEl.value as string).trim()
        : undefined);

    if (!anyFilled) return;

    // Apply per-field rules
    if (which === "all" || which === "name") {
      // Name autofill should pull name, email, phone, and password
      const nextData = {
        name: readName(),
        email: readEmail(),
        password: readPwd(),
      };
      const p = readPhone();

      setFormData((prev) => ({ ...prev, ...nextData }));
      if (p !== undefined) setPhoneValue(p);
      setAutofilled(true);
      return;
    }

    // Email-only
    if (which === "email") {
      const nextEmail = readEmail();
      if (nextEmail !== undefined) {
        setFormData((prev) => ({ ...prev, email: nextEmail }));
      }
      setAutofilled(true);
      return;
    }

    // Password-only (do not autofill email)
    if (which === "password") {
      const nextPwd = readPwd();
      if (nextPwd !== undefined) {
        setFormData((prev) => ({ ...prev, password: nextPwd }));
      }
      setAutofilled(true);
      return;
    }

    // Phone-only
    if (which === "phone") {
      const p = readPhone();
      if (p) setPhoneValue(p);
      setAutofilled(true);
      return;
    }
  }, []);

  // Initial + safety resyncs pull *all* (mimics browser-wide autofill on load)
  useEffect(() => {
    // First pass: try to capture any page-load autofill
    syncFromDom("all");
    // Staggered retries to catch delayed autofill paints
    const t1 = setTimeout(() => syncFromDom("all"), 250);
    const t2 = setTimeout(() => syncFromDom("all"), 800);
    const t3 = setTimeout(() => syncFromDom("all"), 1500);

    const onVisibility = () => syncFromDom("all");

    // Add input event listeners to detect autofill
    const handleInputEvent = (e: Event) => {
      const target = e.target as HTMLInputElement;

      if (target.id === "name" || target.name === "name") {
        setTimeout(() => syncFromDom("name"), 50);
      } else if (target.id === "password" || target.name === "new-password") {
        setTimeout(() => syncFromDom("password"), 50);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("input", handleInputEvent, true);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("input", handleInputEvent, true);
    };
  }, [syncFromDom]);

  const { isValid: isPasswordValid, errors: passwordErrors } = (
    usePasswordValidation as (password: string) => {
      isValid: boolean;
      errors: string[];
    }
  )(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      showErrorToast(
        `Password must meet all requirements: ${Array.isArray(passwordErrors) ? passwordErrors.join(", ") : "Unknown error"}`
      );
      return;
    }

    const result = await signup({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: phoneValue ?? undefined, // E.164
      agency_name: formData.agencyName ?? undefined,
    });

    if (result.success) {
      localStorage.setItem("signupEmail", formData.email);
      localStorage.setItem("signupPassword", formData.password);
      navigate("/verification", { state: { email: formData.email } });
    } else if (result.error) {
      showErrorToast(result.error);
    }
  };

  const handlePhoneChange = (value: string | undefined) => {
    const fieldShell = document.querySelector("#phone.autofill-parent");
    if (fieldShell)
      (fieldShell as HTMLElement).classList.remove("is-autofilled");
    setPhoneValue(formatToE164(value));
  };

  return (
    <AuthPageLayout
      title="Create your account"
      subtitle="Join thousands of users making smarter property decisions"
      logoSize="lg"
      showHeader={false}
      variant="wide"
    >
      {/* Inline style block for autofill color + clickability fixes */}
      <style>{`
        /* Ensure PhoneInput layout doesn't overlay the input */
        #phone-field .nested-phone-input {
          width: 100%;
          display: flex;
          align-items: center;
          background: transparent;
          border: none;
          padding: 0 0 0 2.5rem; /* space for left icon */
          margin: 0;
          position: relative;
        }
        #phone-field .PhoneInputCountry {
          flex: 0 0 auto; /* don't let it overlap the input */
        }
        #phone-field .PhoneInputInput {
          flex: 1;
          min-width: 0;
          position: relative;
          z-index: 1; /* float above any decorative layers */
          border: 0 !important;
          outline: 0 !important;
          background: transparent !important;
        }

        /* Keep your gold-ish autofill background without blocking clicks */
        #phone-field .PhoneInputInput.autofill-gold:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px rgba(255, 243, 191, 0.8) inset !important;
          box-shadow: inset 0 0 0 1000px rgba(255, 243, 191, 0.8) !important;
          -webkit-text-fill-color: inherit !important;
          caret-color: inherit !important;
          transition: background-color 5000s ease-in-out 0s; /* prevent flash */
        }
        #phone-field .PhoneInputInput.autofill-gold:-moz-autofill {
          box-shadow: inset 0 0 0 1000px rgba(255, 243, 191, 0.8) !important;
          -moz-text-fill-color: inherit !important;
          caret-color: inherit !important;
        }

        /* Belt & suspenders: keep any FieldShell overlays non-interactive */
        #phone-field .fieldshell-overlay,
        #phone-field .fieldshell-left,
        #phone-field .fieldshell-right {
          pointer-events: none;
        }
      `}</style>

      <form
        onSubmit={handleSubmit}
        className="card space-y-responsive-md"
        autoComplete="on"
        method="post"
        action="/signup"
      >
        <Input
          label="Full Name"
          type="text"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setFormData((prev) => ({ ...prev, name: e.target.value }));
            // Trigger autofill detection on manual input too
            setTimeout(() => syncFromDom("name"), 100);
          }}
          placeholder="Enter your full name"
          leftIcon={<UserIcon className="pointer-events-none h-4 w-4" />}
          name="name"
          id="name"
          autoComplete="name"
          variant="mobile"
          className="autofill-gold"
          onFocus={() => {
            lastFocusRef.current = "name";
            // Name-triggered autofill should pull *all* fields
            syncFromDom("all");
            // Additional delayed sync for slow autofill
            setTimeout(() => syncFromDom("name"), 200);
            setTimeout(() => syncFromDom("name"), 500);
          }}
        />

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
          placeholder="Enter your email"
          leftIcon={<Mail className="pointer-events-none h-4 w-4" />}
          name="email"
          id="email"
          autoComplete="email"
          variant="mobile"
          className="autofill-gold"
          onFocus={() => {
            lastFocusRef.current = "email";
            // Email-triggered autofill should update only email
            syncFromDom("email");
          }}
        />

        <FieldShell
          label="Phone Number"
          leftIcon={<Phone className="pointer-events-none h-4 w-4" />}
          variant="mobile"
          size="md"
          className="autofill-parent"
          id="phone"
        >
          <PhoneInput
            international
            defaultCountry="US"
            value={phoneValue}
            onChange={handlePhoneChange}
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
              padding: "0 0 0 2.5rem",
              margin: 0,
            }}
            inputComponent={BarePhoneTextInput}
            onFocus={(e: React.FocusEvent<HTMLDivElement>) => {
              lastFocusRef.current = "phone";
              // Phone-triggered autofill should update only phone
              syncFromDom("phone");
              // If the wrapper receives focus first, forward it to the input
              const inputEl = e.currentTarget.querySelector(
                "input.PhoneInputInput"
              ) as HTMLInputElement | null;
              if (inputEl) {
                inputEl.focus();
              }
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
          leftIcon={<Lock className="pointer-events-none h-4 w-4" />}
          name="new-password"
          id="password"
          autoComplete="new-password"
          variant="mobile"
          showPasswordToggle
          className="autofill-gold"
          data-form-type="other"
          onFocus={() => {
            lastFocusRef.current = "password";
            // Password focus should ONLY sync password, never email
            syncFromDom("password");
          }}
        />

        <div className="space-y-3">
          <PasswordValidation
            password={formData.password}
            showValidation={formData.password.length > 0}
          />
        </div>

        <Button
          type="submit"
          variant="olive"
          size="md"
          fullWidth
          loading={isSignupLoading}
          disabled={isSignupLoading}
        >
          Create account
        </Button>

        <AuthDivider />

        <GoogleSignInButton text="Sign up with Google" />

        <div className="text-center text-signup-mid">
          Already have an account?
          <AuthLink
            to="/login"
            className="text-brown underline-offset-4 transition-colors hover:text-brown/80 hover:underline"
          >
            Sign in
          </AuthLink>
        </div>
      </form>
    </AuthPageLayout>
  );
}
