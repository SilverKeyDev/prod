import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordValidationProps {
  password: string;
  showValidation?: boolean;
}

interface ValidationRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

const validationRules: ValidationRule[] = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (password: string) => password.length >= 8
  },
  {
    id: 'uppercase',
    label: 'Contains uppercase letter',
    test: (password: string) => /[A-Z]/.test(password)
  },
  {
    id: 'lowercase',
    label: 'Contains lowercase letter',
    test: (password: string) => /[a-z]/.test(password)
  },
  {
    id: 'number',
    label: 'Contains number',
    test: (password: string) => /[0-9]/.test(password)
  }
];

export const PasswordValidation: React.FC<PasswordValidationProps> = ({ 
  password, 
  showValidation = true 
}) => {
  if (!showValidation || !password) {
    return null;
  }

  return (
    <div className="mt-3 space-responsive-sm bg-olive/10 rounded-lg border border-olive/30">
      <div className="space-y-responsive-xs">
        {validationRules.map((rule) => {
          const isValid = rule.test(password);
          return (
            <div key={rule.id} className="flex items-center gap-responsive-sm">
              <div className={`flex-shrink-0 mobile-icon-sm rounded-full flex items-center justify-center ${
                isValid 
                  ? 'bg-olive' 
                  : 'bg-gray-300'
              }`}>
                {isValid ? (
                  <Check className="mobile-icon-xs text-white" />
                ) : (
                  <X className="mobile-icon-xs text-gray-500" />
                )}
              </div>
              <span className={`text-responsive-sm ${
                isValid 
                  ? 'text-olive font-medium' 
                  : 'text-gray-600'
              }`}>
                {rule.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Helper function to validate password
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  validationRules.forEach((rule) => {
    if (!rule.test(password)) {
      errors.push(rule.label.toLowerCase());
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Hook for password validation
export const usePasswordValidation = (password: string) => {
  const validation = React.useMemo(() => validatePassword(password), [password]);
  
  return {
    isValid: validation.isValid,
    errors: validation.errors,
    rules: validationRules.map(rule => ({
      ...rule,
      isValid: rule.test(password)
    }))
  };
};
