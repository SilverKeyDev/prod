import React, { useEffect } from "react";

import { Platform, View } from "react-native";
import { verifyInstallation } from "nativewind";

import { Pressable } from "packages/ui/components/primitives";
import { Box } from "packages/ui/components/primitives/box";
import { log, LOG_CATEGORIES } from "packages/logger";
import { Text } from "packages/ui/components/primitives/text";

export function NativewindSmokeScreen() {
  useEffect(() => {
    log.info(LOG_CATEGORIES.PAGES, "NativewindSmokeScreen mounted", {
      platform: Platform.OS,
    });

    try {
      verifyInstallation();
      log.info(LOG_CATEGORIES.PAGES, "NativeWind verifyInstallation() succeeded");
    } catch (error) {
      log.error(LOG_CATEGORIES.ERRORS, "NativeWind verifyInstallation() failed", error);
    }
  }, []);

  return (
    <View className="flex-1 bg-brand-accent">
      <Box className="flex-1 items-center justify-center px-6">
        <Text className="text-2xl font-semibold text-white">NativeWind styling OK</Text>
        <Text className="mt-2 text-sm text-white/90">
          If this screen is not olive with white text, className transforms are not applying.
        </Text>

        <Pressable className="mt-6 rounded-xl bg-white px-5 py-3">
          <Text className="text-base font-semibold text-brand-accent">
            Pressable className works
          </Text>
        </Pressable>
      </Box>
    </View>
  );
}
