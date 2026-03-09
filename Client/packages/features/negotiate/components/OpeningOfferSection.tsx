import React, { RefObject } from "react";

import { useLocalization } from "packages/contexts";

import { BodyText } from "@/components/ui";

type OpeningOfferSectionProps = {
  strategyData: unknown;
  priceElementRef: RefObject<HTMLDivElement>;
};

export function OpeningOfferSection({
  strategyData,
  priceElementRef,
}: OpeningOfferSectionProps): React.JSX.Element | null {
  const { t } = useLocalization();
  // Handle nested data structure - check if data is under a 'data' property
  const actualData =
    strategyData && typeof strategyData === "object" && !Array.isArray(strategyData)
      ? (strategyData as Record<string, unknown>).data &&
        typeof (strategyData as Record<string, unknown>).data === "object"
        ? ((strategyData as Record<string, unknown>).data as Record<string, unknown>)
        : (strategyData as Record<string, unknown>)
      : null;

  const priceSection = actualData?.price_section;

  if (!priceSection || typeof priceSection !== "object" || priceSection === null) {
    return null;
  }

  const openingOffer = (priceSection as Record<string, unknown>).opening_offer;

  // Handle different data types for opening offer
  let offerValue: number | null = null;
  if (typeof openingOffer === "number") {
    offerValue = openingOffer;
  } else if (typeof openingOffer === "string") {
    // Remove dollar sign, commas, and whitespace before parsing
    const cleaned = openingOffer.replace(/[$,\s]/g, "");
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      offerValue = parsed;
    }
  }

  if (offerValue === null || offerValue <= 0) {
    return null;
  }

  return (
    <div ref={priceElementRef} className="my-responsive-lg">
      <div className="bg-olive/10 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <BodyText
            as="span"
            className="bg-olive flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
          >
            $
          </BodyText>
          <div>
            <BodyText
              as="span"
              size="sm"
              className="text-olive font-medium uppercase tracking-wide"
            >
              {t("negotiate.opening_offer.recommended")}
            </BodyText>
            <BodyText
              as="span"
              size="lg"
              className="text-olive mt-1 text-3xl font-bold sm:text-4xl lg:text-5xl"
            >
              ${offerValue.toLocaleString()}
            </BodyText>
          </div>
        </div>
      </div>
    </div>
  );
}
