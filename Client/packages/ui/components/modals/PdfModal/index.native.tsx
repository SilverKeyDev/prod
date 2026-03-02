import React from "react";

import { Linking, StyleSheet, View } from "react-native";

import { useLocalization } from "packages/contexts";
import { color } from "packages/design-tokens";
import BaseModal from "packages/ui/components/modals/BaseModal";
import { Button } from "packages/ui/components/primitives";
import { Text } from "packages/ui/components/primitives/text";

import type { PdfModalProps } from "./index";

/**
 * Native-friendly PdfModal implementation.
 *
 * For now, we delegate actual PDF viewing to the system browser. This keeps
 * the shared API working on mobile without introducing a heavy WebView/SDK
 * dependency, and can be upgraded later.
 */
const PdfModalNative: React.FC<PdfModalProps> = ({
  currentPdf,
  currentReportAddress,
  reportId, // eslint-disable-line @typescript-eslint/no-unused-vars
  onClose,
  onShare,
}) => {
  const { t } = useLocalization();

  const isOpen = !!currentPdf;
  const title =
    currentReportAddress ??
    t("pdf.viewer_title_mobile", {
      defaultValue: "Property report",
    });

  const handleOpenInBrowser = () => {
    if (!currentPdf) return;
    void Linking.openURL(currentPdf);
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      handleOpenInBrowser();
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title}>
      <View style={styles.body}>
        <Text style={styles.description}>
          {t("pdf.mobile_fallback_message", {
            defaultValue:
              "PDF viewing is currently optimized for the web app. You can open this report in your browser from your device.",
          })}
        </Text>
        <View style={styles.actions}>
          <Button variant="primary" size="sm" onPress={handleOpenInBrowser}>
            <Text style={styles.primaryLabel}>
              {t("pdf.open_in_browser", { defaultValue: "Open in browser" })}
            </Text>
          </Button>
          <Button variant="secondary" size="sm" onPress={handleShare}>
            <Text style={styles.secondaryLabel}>
              {t("pdf.share_report", { defaultValue: "Share report" })}
            </Text>
          </Button>
        </View>
      </View>
    </BaseModal>
  );
};

export default PdfModalNative;

const styles = StyleSheet.create({
  body: {
    paddingVertical: 8,
  },
  description: {
    fontSize: 14,
    color: color("neutral.700"),
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    columnGap: 12,
  },
  primaryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: color("neutral.50"),
  },
  secondaryLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: color("neutral.800"),
  },
});
