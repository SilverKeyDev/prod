import React, { useCallback } from "react";

import { Linking, StyleSheet } from "react-native";
import WebView from "react-native-webview";

import { useLocalization } from "packages/contexts";
import type { ChecklistIntegrationComponentProps } from "packages/features/checklists/types/componentRegistry";
import { usePartnerPlacementPresentation } from "packages/features/partners/hooks/usePartnerPlacementPresentation";
import { partnerShowsIframe } from "packages/features/partners/types/integrationDisplay";
import { Button } from "packages/ui";
import KeyTurnLoader from "packages/ui/components/asset/loading/KeyTurnLoader";
import Card from "packages/ui/components/cards/Card";
import { Box, Image } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Subtitle from "packages/ui/components/text/Subtitle";

/**
 * Native checklist partner transaction integration (iframe via WebView + tracked open link).
 */
export default function PartnerTransactionIntegration({
  stepId,
  transactionSubjectId,
  placements = [],
  placementsLoading = false,
}: ChecklistIntegrationComponentProps) {
  const { t } = useLocalization();
  const rows = usePartnerPlacementPresentation({
    placements,
    stepId,
    transactionSubjectId,
  });

  if (placementsLoading) {
    return null;
  }

  if (rows.length === 0) {
    return (
      <Box className="mb-2 w-full px-4">
        <BodyText size="sm" muted>
          {t("partners.placement.none_for_step")}
        </BodyText>
      </Box>
    );
  }

  return (
    <Box className="mb-2 w-full gap-4 px-4">
      {rows.map(({ placement, href, displayMode, embedSrc }) => {
        const partner = placement.partner;
        const showIframe = partnerShowsIframe(displayMode) && Boolean(embedSrc?.trim());

        return (
          <PartnerTransactionIntegrationRowNative
            key={partner.id}
            name={partner.name}
            logoUrl={partner.logo_url}
            description={partner.description}
            showIframe={showIframe}
            embedSrc={embedSrc}
            openUrl={href}
            openLabel={t("partners.placement.open_partner")}
            loadingLabel={t("checklists.loading")}
          />
        );
      })}
    </Box>
  );
}

type PartnerTransactionIntegrationRowNativeProps = {
  name: string;
  logoUrl?: string | null;
  description?: string | null;
  showIframe: boolean;
  embedSrc: string | null;
  openUrl: string;
  openLabel: string;
  loadingLabel: string;
};

function PartnerTransactionIntegrationRowNative({
  name,
  logoUrl,
  description,
  showIframe,
  embedSrc,
  openUrl,
  openLabel,
  loadingLabel,
}: PartnerTransactionIntegrationRowNativeProps) {
  const handleOpen = useCallback(() => {
    void Linking.openURL(openUrl);
  }, [openUrl]);

  return (
    <Box className="gap-3">
      <Card border="dotted" padding="md">
        <Box className="flex-col gap-3">
          <Box className="flex-row items-start gap-4">
            {logoUrl ? (
              <Image
                source={{ uri: logoUrl }}
                className="border-border h-20 w-20 flex-shrink-0 rounded-lg border"
                label={name}
              />
            ) : null}
            <Box className="min-w-0 flex-1 flex-col gap-2">
              <Subtitle size="sm">{name}</Subtitle>
              {description ? (
                <Subtitle size="xs" muted className="leading-relaxed">
                  {description}
                </Subtitle>
              ) : null}
            </Box>
          </Box>
          <Button
            variant="outline"
            size="md"
            onPress={handleOpen}
            className="self-start border-dotted border-neutral-400"
          >
            {openLabel}
          </Button>
        </Box>
      </Card>
      {showIframe && embedSrc ? (
        <Box
          className="border-border overflow-hidden rounded-xl border"
          style={styles.webViewShell}
        >
          <WebView
            source={{ uri: embedSrc }}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <Box style={styles.loaderWrap}>
                <KeyTurnLoader message={loadingLabel} />
              </Box>
            )}
          />
        </Box>
      ) : null}
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
