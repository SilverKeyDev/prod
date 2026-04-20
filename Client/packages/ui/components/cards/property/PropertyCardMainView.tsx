import React from "react";

import BaseCard from "packages/ui/components/cards/BaseCard";

import { PERFECT_CRITERIA_MATCH_CARD_CLASSNAME } from "./perfectMatchCardGlowClasses";
import type { PropertyCardProps } from "./PropertyCard.types";
import { propertyCardShowsPerfectCriteriaMatch } from "./propertyCardHelpers";
import { PropertyCardMainContent } from "./PropertyCardMainContent";

type PropertyCardMainViewProps = {
  props: PropertyCardProps;
  setShowReasonCard: (v: boolean) => void;
};

export function PropertyCardMainView({ props, setShowReasonCard }: PropertyCardMainViewProps) {
  const { cardType = "regular", loading = false, onClick, className = "", width } = props;
  const perfectCriteria = propertyCardShowsPerfectCriteriaMatch(props);
  const cardClassName = [className, perfectCriteria ? PERFECT_CRITERIA_MATCH_CARD_CLASSNAME : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <BaseCard
      hover
      interactive
      loading={loading}
      padding="none"
      cardType={cardType}
      width={width}
      background="white"
      className={cardClassName}
      onClick={onClick}
    >
      <PropertyCardMainContent props={props} setShowReasonCard={setShowReasonCard} />
    </BaseCard>
  );
}
