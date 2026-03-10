/**
 * Core provider order for app composition (web and native).
 * Defines the intended nesting order; each app composes actual provider components.
 * No platform APIs; only constants for documentation and consistency.
 */

export const CORE_PROVIDER_ORDER = [
  "Error",
  "Theme",
  "Auth",
  "Query",
  "NavLink",
  "Localization",
] as const;

export type CoreProviderName = (typeof CORE_PROVIDER_ORDER)[number];
