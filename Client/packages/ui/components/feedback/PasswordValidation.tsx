import React from "react";

import { Icon } from "@ui/icons";

import { Box, Text } from "packages/ui/components/primitives";

import { validationRules } from "@/features/homeauth/utils/passwordValidation";

type PasswordValidationProps = {
  password: string;
  showValidation?: boolean;
};

/**
 * Shared PasswordValidation — uses Box, Text, Icon. Works on web and native.
 */
export function PasswordValidation({
  password,
  showValidation = true,
}: PasswordValidationProps): React.ReactElement | null {
  if (!showValidation || !password) {
    return null;
  }
  return (
    <Box className="border-olive/30 bg-olive/10 mt-3 gap-2 rounded-lg border p-3">
      {validationRules.map((rule) => {
        const isValid = rule.test(password);
        return (
          <Box key={rule.id} className="flex flex-row items-center gap-2">
            <Box
              className={`flex size-4 flex-shrink-0 items-center justify-center rounded-full ${
                isValid ? "bg-olive" : "bg-gray-300"
              }`}
            >
              {isValid ? (
                <Icon name="check" className="size-3 text-white" />
              ) : (
                <Icon name="x" className="size-3 text-gray-500" />
              )}
            </Box>
            <Text
              className={`text-sm ${isValid ? "text-olive font-semibold" : "font-medium text-gray-600"}`}
            >
              {rule.label}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
