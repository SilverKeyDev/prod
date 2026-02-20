/**
 * Standardized hover effects for card components
 * Provides consistent slight shadow and jump animation across all cards
 */

export type CardHoverConfig = {
  shadow: string;
  transform: string;
  transition: string;
};

const CARD_HOVER_EFFECTS: CardHoverConfig = {
  shadow: "hover:shadow-lg",
  transform: "hover:-translate-y-1",
  transition: "transition-all duration-200 ease-out",
};

/**
 * Get standardized card hover classes
 */
export function getCardHoverClasses(): string {
  return `${CARD_HOVER_EFFECTS.transition} ${CARD_HOVER_EFFECTS.shadow} ${CARD_HOVER_EFFECTS.transform}`;
}

/**
 * Get card hover styles for interactive cards
 */
export function getInteractiveCardClasses(): string {
  return `cursor-pointer hover:cursor-pointer ${getCardHoverClasses()}`;
}

export default {
  getCardHoverClasses,
  getInteractiveCardClasses,
};
