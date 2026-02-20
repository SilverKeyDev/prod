/**
 * Core Utilities Index
 * Centralized exports for all utility functions
 */

// Error Handling
export * from "./core/errorHandling";

// Array utilities
export * from "./core/array";

// Format (compactCount, currency, scoreColors)
export * from "./core/format";

// Storage and hash
export * from "./core/storage";

// Date (cross-platform parse/format; use instead of new Date() / Date.parse())
export * from "./core/date";

// Platform adapter (window/document/navigator/Blob/File)
export * from "./core/platform";

// Auth, routing, typeGuards
export * from "./core/routing";
export * from "./core/typeGuards";
export * from "./domain/auth";

// Verification code input (pure helpers)
export * from "./core/verification";

// Calendar (date, eventParsing, eventFiltering; scheduling via ./calendar/scheduling)
export * from "./domain/calendar";

// PDF utilities
export * from "./domain/documents/pdf";

// Property utilities
export * from "./domain/search/property";
export type { AddressObject } from "./domain/search/propertyDetailsFormatters";
export {
  formatAddress,
  formatPropertyType,
  getPropertyImages,
} from "./domain/search/propertyDetailsFormatters";

// Compare homes (comparison fields, CSV export helpers)
export * from "./domain/compareHomes";

// Feed (analytics, telemetry, preload, media state)
export * from "./domain/feed";

// Messaging (message preview for sidebars)
export * from "./domain/messaging";

// Profile / onboarding (constants, types, validation, home price, submit)
export * from "./domain/profile";
