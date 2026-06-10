import { useCallback, useEffect, useRef, useState } from "react";

import { getDocument } from "packages/utils/core/platform";

export type FieldKey = "all" | "name" | "email" | "password" | "phone";

export type SignupFormData = {
  name: string;
  email: string;
  password: string;
  agencyName: string;
};

function formatToE164(phoneNumber: string | undefined): string | undefined {
  if (!phoneNumber?.trim()) return undefined;
  if (phoneNumber.includes("@")) return undefined;
  const cleaned = phoneNumber.replace(/[\s\-().]/g, "");
  if (!/^[+]?[\d]+$/.test(cleaned)) return undefined;
  if (!cleaned.startsWith("+")) return `+1${cleaned}`;
  return cleaned;
}

function getSignupDomEls(doc: Document | null) {
  if (!doc) return { nameEl: null, emailEl: null, pwdEl: null, phoneEl: null };
  const nameEl = doc.getElementById("name") as HTMLInputElement | null;
  const emailEl = doc.getElementById("email") as HTMLInputElement | null;
  const pwdEl = doc.getElementById("password") as HTMLInputElement | null;
  const phoneEl = doc.querySelector("input.PhoneInputInput");
  return { nameEl, emailEl, pwdEl, phoneEl };
}

/**
 * Hook to sync signup form state from DOM (browser autofill).
 * Call syncFromDom on focus and use the returned lastFocusRef if needed.
 */
export function useSignupAutofill(
  setFormData: React.Dispatch<React.SetStateAction<SignupFormData>>,
  setPhoneValue: React.Dispatch<React.SetStateAction<string | undefined>>
) {
  const lastFocusRef = useRef<FieldKey>("all");
  const [, setAutofilled] = useState(false);

  const syncFromDom = useCallback(
    (which: FieldKey) => {
      const { nameEl, emailEl, pwdEl, phoneEl } = getSignupDomEls(getDocument());
      const readName = () => nameEl?.value ?? "";
      const readEmail = () => emailEl?.value ?? "";
      const readPwd = () => pwdEl?.value ?? "";
      const readPhone = (): string | undefined => {
        const raw =
          phoneEl && "value" in phoneEl && typeof phoneEl.value === "string"
            ? (phoneEl.value as string).trim()
            : undefined;
        return raw ? formatToE164(raw) : undefined;
      };
      const anyFilled =
        !!nameEl?.value?.trim() ||
        !!emailEl?.value?.trim() ||
        !!pwdEl?.value ||
        !!(
          phoneEl &&
          "value" in phoneEl &&
          typeof phoneEl.value === "string" &&
          (phoneEl.value as string).trim()
        );
      if (!anyFilled) return;

      if (which === "all" || which === "name") {
        setFormData((prev) => ({
          ...prev,
          name: readName(),
          email: readEmail(),
          password: readPwd(),
        }));
        const p = readPhone();
        if (p !== undefined) setPhoneValue(p);
        setAutofilled(true);
        return;
      }
      if (which === "email") {
        const nextEmail = readEmail();
        if (nextEmail !== undefined) {
          setFormData((prev) => ({ ...prev, email: nextEmail }));
        }
        setAutofilled(true);
        return;
      }
      if (which === "password") {
        const nextPwd = readPwd();
        if (nextPwd !== undefined) {
          setFormData((prev) => ({ ...prev, password: nextPwd }));
        }
        setAutofilled(true);
        return;
      }
      if (which === "phone") {
        const p = readPhone();
        if (p) setPhoneValue(p);
        setAutofilled(true);
      }
    },
    [setFormData, setPhoneValue]
  );

  useEffect(() => {
    const doc = getDocument();
    if (!doc) return;
    syncFromDom("all");
    const t1 = setTimeout(() => syncFromDom("all"), 250);
    const t2 = setTimeout(() => syncFromDom("all"), 800);
    const t3 = setTimeout(() => syncFromDom("all"), 1500);
    const onVisibility = () => syncFromDom("all");
    const handleInputEvent = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.id === "name" || target.name === "name") {
        setTimeout(() => syncFromDom("name"), 50);
      } else if (target.id === "password" || target.name === "new-password") {
        setTimeout(() => syncFromDom("password"), 50);
      }
    };
    doc.addEventListener("visibilitychange", onVisibility);
    doc.addEventListener("input", handleInputEvent, true);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      doc.removeEventListener("visibilitychange", onVisibility);
      doc.removeEventListener("input", handleInputEvent, true);
    };
  }, [syncFromDom]);

  return { syncFromDom, lastFocusRef };
}

/** E.164 normalizer for phone input (e.g. for handlePhoneChange). */
export function signupFormatPhone(value: string | undefined): string | undefined {
  return formatToE164(value);
}
