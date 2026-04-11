import React from "react";

import { Linking } from "react-native";

import { useLocalization } from "packages/contexts";
import Button from "packages/ui/components/button/Button";
import { Box } from "packages/ui/components/primitives";
import { Image } from "packages/ui/components/primitives";
import Subtitle from "packages/ui/components/text/Subtitle";

const MOVE_CONCIERGE_URL = "https://mc.partners/SilverKey";

/**
 * MoveConcierge image for native. Ensure Client/public/MoveConcierge.jpg exists for Metro.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const moveConciergeSource =
  require("../../../../../public/MoveConcierge.jpg") as number;
/* eslint-enable @typescript-eslint/no-require-imports */

export default function HomeConcierge() {
  const { t } = useLocalization();

  const handleStartToday = () => {
    void Linking.openURL(MOVE_CONCIERGE_URL);
  };

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
            <Button
              variant="outline"
              size="md"
              onPress={handleStartToday}
              className="mt-3 border-dotted border-neutral-400"
            >
              {t("close.home_concierge.start_today")}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
