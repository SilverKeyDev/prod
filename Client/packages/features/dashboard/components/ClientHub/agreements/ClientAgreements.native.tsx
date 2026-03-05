import React from "react";

import { StyleSheet, View } from "react-native";

import { useLocalization } from "packages/contexts";
import { AgreementDetailModal, CreateAgreementModal } from "packages/features/documents";
import { Box, Text } from "packages/ui/components/primitives";

type ClientAgreementsProps = {
  clientId: string;
};

export default function ClientAgreementsNative({ clientId: _clientId }: ClientAgreementsProps) {
  const { t } = useLocalization();

  return (
    <>
      <Box className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-semibold text-gray-900">
          {t("dashboard.agreements_title")}
        </Text>
      </Box>

      <View style={styles.centered}>
        <Text className="mb-2 text-center text-sm text-gray-700">
          {t("dashboard.agreements_not_available", {
            defaultValue: "Agreements are not available on mobile yet.",
          })}
        </Text>
        <Text className="mb-4 text-center text-xs text-gray-600">
          {t("dashboard.agreements_not_available_body", {
            defaultValue:
              "We are migrating to a new signing provider. You can review agreements from the Documents section on web.",
          })}
        </Text>
      </View>

      <CreateAgreementModal isOpen={false} onClose={() => {}} preselectedBuyerId={undefined} />
      <AgreementDetailModal agreementId={null} isOpen={false} onClose={() => {}} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: 4,
  },
  centered: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
