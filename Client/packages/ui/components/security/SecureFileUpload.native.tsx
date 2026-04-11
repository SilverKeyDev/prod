import React from "react";

import { StyleSheet, View } from "react-native";

import { useLocalization } from "packages/contexts";
import { color } from "packages/design-tokens";
import { Text } from "packages/ui/components/primitives";

import type { SecureFileUploadProps } from "./SecureFileUpload";

/**
 * Native stub for SecureFileUpload.
 *
 * On mobile, in-app secure file upload (with EXIF stripping) is not yet
 * available. This component shows neutral copy so shared flows render
 * without "coming soon" or "view on web" messaging (parity).
 * Documents added by the team appear here; upgrade path is a native
 * file/image picker when implemented.
 */
export const SecureFileUpload: React.FC<SecureFileUploadProps> = ({
  label,
  disabled,
}) => {
  const { t } = useLocalization();

  return (
    <View style={[styles.card, disabled && styles.cardDisabled]}>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : (
        <Text style={styles.label}>
          {t("secure_upload.title_mobile_fallback", {
            defaultValue: "Document upload",
          })}
        </Text>
      )}
      <Text style={styles.description}>
        {t("secure_upload.mobile_description", {
          defaultValue: "Documents added by your team will appear here.",
        })}
      </Text>
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
  description: {
    fontSize: 13,
    color: color("neutral.600"),
    marginBottom: 12,
  },
});
