import React from "react";

import { StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { Text } from "packages/ui/components/primitives/text";

import { validationRules } from "@/features/homeauth/utils/passwordValidation";

type PasswordValidationProps = {
  password: string;
  showValidation?: boolean;
};

export function PasswordValidation({
  password,
  showValidation = true,
}: PasswordValidationProps): React.ReactElement | null {
  if (!showValidation || !password) return null;

  return (
    <View style={styles.container}>
      {validationRules.map((rule) => {
        const isValid = rule.test(password);
        return (
          <View key={rule.id} style={styles.row}>
            <View style={[styles.bullet, isValid ? styles.bulletValid : styles.bulletInvalid]}>
              <Text style={styles.bulletText}>{isValid ? "✓" : "×"}</Text>
            </View>
            <Text style={[styles.label, isValid ? styles.labelValid : styles.labelInvalid]}>
              {rule.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(163, 177, 138, 0.3)",
    backgroundColor: "rgba(163, 177, 138, 0.12)",
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bullet: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  bulletValid: {
    backgroundColor: color("brand.accent"),
  },
  bulletInvalid: {
    backgroundColor: color("neutral.300"),
  },
  bulletText: {
    fontSize: 12,
    fontWeight: "700",
    color: color("neutral.50"),
    lineHeight: 12,
  },
  label: {
    fontSize: 14,
  },
  labelValid: {
    color: color("brand.accent"),
    fontWeight: "600",
  },
  labelInvalid: {
    color: color("neutral.600"),
    fontWeight: "500",
  },
});
