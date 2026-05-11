import React, { useCallback, useEffect } from "react";

import { useNavigation, useRoute } from "@react-navigation/native";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { color } from "packages/design-tokens";
import { PropertyDetailsBody } from "packages/features/propertyDetails/components/PropertyDetailsModal/body/PropertyDetailsBody";
import { PropertyHeader } from "packages/features/propertyDetails/components/PropertyDetailsModal/header/PropertyHeader";
import { usePropertyDetails } from "packages/hooks/data";
import type { PropertyDetailsStreamProperty } from "packages/types";
import { ScrollView } from "packages/ui/components/primitives";
import { setToStorage } from "packages/utils/storage";

export type PropertyDetailsScreenParams = {
  address: string;
  propertyId?: string;
};

function buildMinimalProperty(address: string, propertyId?: string): PropertyDetailsStreamProperty {
  return {
    id: propertyId ?? "",
    address,
    price: "",
    bedrooms: 0,
    bathrooms: 0,
    sqft: 0,
    lat: 0,
    lng: 0,
    latitude: 0,
    longitude: 0,
  };
}

export function PropertyDetailsScreenNative() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as PropertyDetailsScreenParams | undefined;
  const address = params?.address ?? "";
  const propertyId = params?.propertyId;

  const { selectedProperty, isLoading, fetchPropertyDetails, clearSelectedProperty } =
    usePropertyDetails();

  useEffect(() => {
    if (address && address.trim().length > 0) {
      const minimal = buildMinimalProperty(address, propertyId);
      void fetchPropertyDetails(minimal);
    }
    return () => {
      clearSelectedProperty();
    };
  }, [address, propertyId, fetchPropertyDetails, clearSelectedProperty]);

  const property = selectedProperty ?? buildMinimalProperty(address, propertyId);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  const handleGenerateReport = useCallback(() => {
    const p = selectedProperty ?? buildMinimalProperty(address, propertyId);
    const generateReportState = {
      address: typeof p.address === "string" ? p.address : address,
      reportType: "detailed",
      selectedClientId: "",
    };
    setToStorage("generateReportState", generateReportState);
    navigation.navigate("LIBRARY");
  }, [address, navigation, propertyId, selectedProperty]);

  if (!address || address.trim().length === 0) {
    return null;
  }

  return (
    <>
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <PropertyHeader
          property={property}
          onClose={handleBack}
          onBack={handleBack}
          onGenerateReport={handleGenerateReport}
          toolbarButtonSize="medium"
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <PropertyDetailsBody property={property} isLoading={isLoading} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color("neutral.50"),
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});
