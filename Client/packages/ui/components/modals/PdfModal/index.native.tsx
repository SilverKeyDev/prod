import React, { useState } from "react";

import Button from "@ui/button/Button";
import { ActivityIndicator, Linking, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { useLocalization } from "packages/contexts";
import { color } from "packages/design-tokens";
import BaseModal from "packages/ui/components/modals/BaseModal";
import { Text } from "packages/ui/components/primitives";

import type { PdfModalProps } from "./index";

const PdfModalNative: React.FC<PdfModalProps> = ({
  currentPdf,
  currentReportAddress,
  reportId, // eslint-disable-line @typescript-eslint/no-unused-vars
  onClose,
  onShare,
}) => {
  const { t } = useLocalization();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const isOpen = !!currentPdf;
  // Keep default copy platform-neutral: no "Open in browser" or "coming soon"
  const title = currentReportAddress ?? t("pdf.viewer_title_mobile");

  const handleOpen = () => {
    if (!currentPdf) return;
    void Linking.openURL(currentPdf);
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      handleOpen();
    }
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleWebViewError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title}>
      <View style={styles.body}>
        {currentPdf ? (
          <>
            <View style={styles.viewerContainer}>
              <WebView
                source={{ uri: currentPdf }}
                style={styles.webview}
                originWhitelist={["*"]}
                onLoadEnd={handleLoadEnd}
                onError={handleWebViewError}
              />
              {isLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="small" color={color("neutral.800")} />
                  <Text style={styles.loadingText}>{t("pdf.loading")}</Text>
                </View>
              )}
              {hasError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{t("pdf.load_failed")}</Text>
                  <Button variant="primary" size="sm" onPress={handleOpen}>
                    <Text style={styles.primaryLabel}>{t("pdf.try_again")}</Text>
                  </Button>
                </View>
              )}
            </View>
            <View style={styles.actions}>
              <Button variant="secondary" size="sm" onPress={handleOpen} iconName="flag">
                <Text style={styles.secondaryLabel}>{t("pdf.open_report")}</Text>
              </Button>
              <Button variant="secondary" size="sm" onPress={handleShare} iconName="share">
                <Text style={styles.secondaryLabel}>{t("pdf.share_report")}</Text>
              </Button>
            </View>
          </>
        ) : (
          <Text style={styles.description}>{t("pdf.fallback_unavailable")}</Text>
        )}
      </View>
    </BaseModal>
  );
};

export default PdfModalNative;

const styles = StyleSheet.create({
  body: {
    paddingVertical: 8,
  },
  viewerContainer: {
    height: 320,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: color("neutral.100"),
    marginBottom: 16,
  },
  webview: {
    flex: 1,
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
    marginTop: 4,
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: color("neutral.700"),
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: color("neutral.50"),
  },
  errorText: {
    fontSize: 14,
    color: color("danger.700"),
    textAlign: "center",
    marginBottom: 12,
  },
});
