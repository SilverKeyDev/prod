import React from "react";

import { StyleSheet, View } from "react-native";

import { useLocalization } from "packages/contexts";
import { color } from "packages/design-tokens";
import { Button } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives/text";

import type { SecureFileUploadProps } from "./SecureFileUpload";

/**
 * Native stub for SecureFileUpload.
 *
 * On mobile, we currently do not support in-app secure file upload with
 * EXIF stripping. This component surfaces a clear message so that shared
 * flows can render without breaking, and can be upgraded later to use a
 * native file/image picker.
 */
export const SecureFileUpload: React.FC<SecureFileUploadProps> = ({
  label,
  required,
  disabled,
}) => {
  const { t } = useLocalization();

  return (
    <View style={[styles.card, disabled && styles.cardDisabled]}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : (
        <Text style={styles.label}>{t("secure_upload.title_mobile_fallback")}</Text>
      )}
      <Text style={styles.description}>
        {t("secure_upload.mobile_not_supported", {
          defaultValue:
            "Secure file upload is currently available on the web experience. Please use the web app to upload documents.",
        })}
      </Text>
      <Button
        variant="secondary"
        size="sm"
        disabled={disabled}
        onPress={() => {
          // Intentionally no-op for now. We can later wire this to open
          // a help article or deep link into the web experience.
        }}
        style={styles.button}
      >
        <Text style={styles.buttonLabel}>
          {t("secure_upload.view_on_web_cta", { defaultValue: "Open web app" })}
        </Text>
      </Button>
    </View>
  );
};

export default SecureFileUpload;

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color("neutral.200"),
    backgroundColor: color("neutral.50"),
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: color("neutral.900"),
    marginBottom: 4,
  },
  required: {
    color: color("rose.500"),
  },
  description: {
    fontSize: 13,
    color: color("neutral.600"),
    marginBottom: 12,
  },
  button: {
    alignSelf: "flex-start",
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: color("neutral.800"),
  },
});
