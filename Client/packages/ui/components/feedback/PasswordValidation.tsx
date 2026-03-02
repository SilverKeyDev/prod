import React from "react";

import { Check, X } from "lucide-react";

import BodyText from "packages/ui/components/text/BodyText";

import { validationRules } from "@/features/homeauth/utils/passwordValidation";

type PasswordValidationProps = {
  password: string;
  showValidation?: boolean;
};

export const PasswordValidation: React.FC<PasswordValidationProps> = ({
  password,
  showValidation = true,
}) => {
  if (!showValidation || !password) {
    return null;
  }

  return (
    <div className="space-responsive-sm border-olive/30 bg-olive/10 mt-3 rounded-lg border">
      <div className="space-y-responsive-xs">
        {validationRules.map((rule) => {
          const isValid = rule.test(password);
          return (
            <div key={rule.id} className="gap-responsive-sm flex items-center">
              <div
                className={`mobile-icon-sm flex flex-shrink-0 items-center justify-center rounded-full ${
                  isValid ? "bg-olive" : "bg-gray-300"
                }`}
              >
                {isValid ? (
                  <Check className="mobile-icon-xs text-white" />
                ) : (
                  <X className="mobile-icon-xs text-gray-500" />
                )}
              </div>
              <BodyText
                as="span"
                className={`text-responsive-sm ${
                  isValid ? "text-olive font-medium" : "text-gray-600"
                }`}
              >
                {rule.label}
              </BodyText>
            </div>
          );
        })}
      </div>
    </div>
  );
};
