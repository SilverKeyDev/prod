import React, { useMemo, useState } from "react";

import { useLocalization } from "packages/contexts";
import type { PropertyComponentProps } from "packages/features/propertyDetails/components/PropertyDetailsModal/types";
import { useUserPreferences } from "packages/hooks/data/useUserData";
import { Box, Icon, Pressable } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";
import { estimateMonthlyPayment, mapCreditScoreToNumber } from "packages/utils/affordability";

/** Subset of saved user prefs used for payment estimate (avoid profile feature type imports). */
type PaymentEstimatePreferences = {
  down_payment?: number | string;
  ideal_zip_code?: string;
  credit_score_range?: string;
};

function getListingZip(property: Record<string, unknown>, fallbackZip: string | undefined): string {
  const z =
    (typeof property.zipCode === "string" && property.zipCode) ||
    (typeof property.zipcode === "string" && property.zipcode) ||
    (typeof property.address === "object" &&
      property.address !== null &&
      typeof (property.address as { zipcode?: string }).zipcode === "string" &&
      (property.address as { zipcode: string }).zipcode) ||
    fallbackZip;
  return typeof z === "string" ? z : "";
}

function getListingPrice(property: Record<string, unknown>): number | null {
  const p = property.price;
  if (typeof p === "number" && Number.isFinite(p) && p > 0) return p;
  if (typeof p === "string") {
    const n = parseFloat(p.replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}

function computeMonthlyPayment(
  property: Record<string, unknown>,
  preferences: PaymentEstimatePreferences | null
): number | null {
  const homePrice = getListingPrice(property);
  if (!homePrice || !preferences?.down_payment || !preferences?.ideal_zip_code) return null;
  const zipCode = getListingZip(property, preferences.ideal_zip_code);
  if (!zipCode || zipCode.length < 2) return null;
  const creditScore = mapCreditScoreToNumber(preferences.credit_score_range);
  return estimateMonthlyPayment({
    homePrice,
    downPayment: preferences.down_payment,
    zipCode,
    creditScore,
  });
}

export const PropertyPaymentSnapshot: React.FC<PropertyComponentProps> = ({ property }) => {
  const { t } = useLocalization();
  const { userPreferences } = useUserPreferences();
  const [expanded, setExpanded] = useState(false);

  const record = property as Record<string, unknown>;
  const price = getListingPrice(record);
  const prefs = (userPreferences ?? null) as PaymentEstimatePreferences | null;

  const monthlyPayment = useMemo(() => computeMonthlyPayment(record, prefs), [record, prefs]);

  if (price === null) return null;

  const title = t("property_details.estimated_payment", {
    defaultValue: "Est. payment",
  });
  const paymentSuffix = t("property_details.estimated_payment_suffix", {
    defaultValue: "/mo",
  });
  const canExpandDetails = monthlyPayment !== null;

  return (
    <Box className="px-6 pb-4">
      <Box className="border-border-card bg-bg-card-subtle rounded-xl border p-4">
        {canExpandDetails ? (
          <Pressable
            onPress={() => setExpanded(!expanded)}
            className="-m-1 flex flex-row items-center justify-between gap-2 rounded-lg p-1"
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            label={title}
          >
            <Title as="h3" size="sm" className="text-text-primary font-semibold">
              {title}
            </Title>
            <Icon
              name="chevron-down"
              size={18}
              className={`text-text-secondary shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
              aria-hidden
            />
          </Pressable>
        ) : (
          <Title as="h3" size="sm" className="text-text-primary font-semibold">
            {title}
          </Title>
        )}

        <Box className="mt-3">
          {monthlyPayment !== null ? (
            <>
              <BodyText as="p" size="lg" className="text-brand-accent font-bold">
                ~${monthlyPayment.toLocaleString()}
                {paymentSuffix}
              </BodyText>
              <BodyText as="p" size="xs" className="text-text-secondary mt-1">
                {t("property_details.estimated_payment_hint", {
                  defaultValue: "Based on your saved preferences",
                })}
              </BodyText>
            </>
          ) : (
            <BodyText as="p" size="sm" className="text-text-secondary">
              {t("property_details.add_financials_hint", {
                defaultValue: "Add income and preferences in your profile to see an estimate",
              })}
            </BodyText>
          )}
        </Box>

        {expanded && monthlyPayment !== null ? (
          <Box className="border-border mt-3 border-t pt-3">
            <BodyText as="p" size="xs" className="text-text-secondary">
              {t("property_details.listing_price_display", {
                defaultValue: "List price: {{price}}",
                price: `$${price.toLocaleString()}`,
              })}
            </BodyText>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};
