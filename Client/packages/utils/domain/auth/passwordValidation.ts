export type ValidationRule = {
  id: string;
  label: string;
  test: (password: string) => boolean;
};

export const validationRules: ValidationRule[] = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (password: string) => password.length >= 8,
  },
  {
    id: "uppercase",
    label: "Contains uppercase letter",
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    id: "lowercase",
    label: "Contains lowercase letter",
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    id: "number",
    label: "Contains number",
    test: (password: string) => /[0-9]/.test(password),
  },
];

export const validatePassword = (
  password: string,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  validationRules.forEach((rule) => {
    if (!rule.test(password)) {
      errors.push(rule.label.toLowerCase());
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};
