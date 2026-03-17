/**
 * Auth card variant — single source of truth for auth form containers
 * (login, signup, reset password, verification). Web and native parity.
 *
 * Uses raw Tailwind strings; no hover/transition so NativeWind translates correctly.
 * Matches .card from css/components.css minus web-only hover/transition.
 */
export const AUTH_CARD_CLASSES =
  "border-border-card-subtle rounded-lg border bg-white p-3 shadow-sm sm:rounded-xl sm:p-4 md:rounded-2xl md:p-6 native:p-4 native:rounded-xl";
