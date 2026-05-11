/**
 * Web-only barrel for card base components.
 * Imports from source modules (not ./index) to avoid cycle with cards/index → HomeCard → base/index.
 */
export { CardViewDetailsButton } from "./buttons";
export { default as CardCarousel } from "./CardCarousel.web";
export { CardCompareCheckbox } from "./checkbox";
export { CardAddressDisplay, CardMatchScore, CardPropertyDetails } from "./display";
export { CardImageContainer, StyledImage } from "./image";
export { getCardHoverClasses, getInteractiveCardClasses, TrianglePointer } from "./styles";
export {
  default as CardHeartSave,
  CardHeartSaveWithProps,
} from "@ui/button/propertyActions/HeartSave";
