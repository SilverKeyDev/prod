import React, { useState } from "react";

import { useWhyRender } from "packages/hooks/ui";
import { log } from "packages/logger";

import type { PropertyCardProps } from "./PropertyCard.types";
import { PropertyCardMainView } from "./PropertyCardMainView";
import { PropertyCardReasonView } from "./PropertyCardReasonView";

export type { PropertyCardProps } from "./PropertyCard.types";

function PropertyCardImpl(props: PropertyCardProps) {
  const {
    id,
    address,
    price,
    score,
    property,
    onSelectNotInterestedReason,
    onUndoNotInterested,
    cardType = "regular",
  } = props;
  const [showReasonCard, setShowReasonCard] = useState(false);

  useWhyRender({ id, address, price, score });

  const handleSelectReason = async (why: string) => {
    if (!onSelectNotInterestedReason) return;
    try {
      await onSelectNotInterestedReason(why);
      setShowReasonCard(false);
    } catch (error) {
      log.error("ERRORS", "Failed to update reason", error);
      throw error;
    }
  };

  const handleUndo = async () => {
    if (!onUndoNotInterested) return;
    try {
      await onUndoNotInterested();
      setShowReasonCard(false);
    } catch (error) {
      log.error("ERRORS", "Failed to undo", error);
      throw error;
    }
  };

  const showReasonView =
    showReasonCard && property && onSelectNotInterestedReason && onUndoNotInterested;

  if (showReasonView && property) {
    return (
      <PropertyCardReasonView
        property={property}
        cardType={cardType}
        onSelectReason={handleSelectReason}
        onUndo={handleUndo}
      />
    );
  }
  return <PropertyCardMainView props={props} setShowReasonCard={setShowReasonCard} />;
}

export const PropertyCard = PropertyCardImpl;
export default PropertyCard;
