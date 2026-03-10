/**
 * Email Templates barrel file - centralized exports for email templates and components
 */

// Email renderer
export { renderEmail } from "./render-email";

// Email components
export { default as EmailTemplate } from "./components/EmailTemplate";
export { default as ListingCard } from "./components/ListingCard";
export { default as ListingCardBody } from "./components/ListingCardBody";
export { default as ListingCardImageSection } from "./components/ListingCardImageSection";
export { default as Logo } from "./components/Logo";

// Email utilities and types
export * from "./components/colors";
export * from "./components/listingCardTypes";
export * from "./components/listingCardUtils";

// Email templates
export { default as ListingsEmail } from "./templates/ListingsEmail";
export { default as NewPropertiesEmail } from "./templates/NewPropertiesEmail";
