import { useMemo } from "react";

import { validatePassword, validationRules } from "@/features/homeauth/utils/passwordValidation";

export function usePasswordValidation(password: string) {
  const validation = useMemo(() => validatePassword(password), [password]);

  return {
    isValid: validation.isValid,
    errors: validation.errors,
    rules: validationRules.map((rule) => ({
      ...rule,
      isValid: rule.test(password),
    })),
  };
}
