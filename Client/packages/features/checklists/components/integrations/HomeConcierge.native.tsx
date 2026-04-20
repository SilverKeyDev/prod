import React, { useCallback } from "react";

import { Linking, StyleSheet } from "react-native";
import WebView from "react-native-webview";

import { useLocalization } from "packages/contexts";
import { useMoveConciergeEmbedUrl } from "packages/features/checklists/hooks/data/useMoveConciergeEmbedUrl";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader";
import Button from "packages/ui/components/button/Button";
import { Box } from "packages/ui/components/primitives";
import { Image } from "packages/ui/components/primitives";
import Subtitle from "packages/ui/components/text/Subtitle";

/**
 * MoveConcierge image for native. Ensure Client/public/MoveConcierge.jpg exists for Metro.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const moveConciergeSource = require("../../../../../public/MoveConcierge.jpg") as number;
/* eslint-enable @typescript-eslint/no-require-imports */

export default function HomeConcierge() {
  const { t } = useLocalization();
  const embedUrl = useMoveConciergeEmbedUrl();

  const handleOpenBrowser = useCallback(() => {
    void Linking.openURL(embedUrl);
  }, [embedUrl]);

  return (
    <Box className="mb-2 w-full px-4">
      <Box className="border-border bg-background-surface rounded-xl border p-4">
        <Box className="flex-row items-start gap-4">
          <Image
            source={moveConciergeSource}
            className="border-border h-28 w-28 flex-shrink-0 rounded-lg border"
            label={t("close.home_concierge.alt")}
          />
          <Box className="min-w-0 flex-1 flex-col justify-between self-stretch">
            <Subtitle size="sm" muted className="leading-relaxed">
              {t("close.home_concierge.subtitle")}
            </Subtitle>
            <Subtitle size="xs" muted className="mt-2 leading-relaxed">
              {t("close.home_concierge.how_possible")}
            </Subtitle>
          </Box>
        </Box>
      </Box>
      <Box
        className="border-border mt-3 overflow-hidden rounded-xl border"
        style={styles.webViewShell}
      >
        <WebView
          source={{ uri: embedUrl }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <Box style={styles.loaderWrap}>
              <KeyTurnLoader message={t("checklists.loading")} />
            </Box>
          )}
        />
      </Box>
      <Button
        variant="outline"
        size="md"
        onPress={handleOpenBrowser}
        className="mt-3 border-dotted border-neutral-400"
        iconName="calendar"
      >
        {t("close.home_concierge.open_in_browser")}
      </Button>
    </Box>
  );
}

const styles = StyleSheet.create({
  webViewShell: {
    minHeight: 440,
    width: "100%",
  },
  webview: {
    flex: 1,
    minHeight: 440,
    width: "100%",
  },
  loaderWrap: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 200,
    padding: 24,
  },
});
