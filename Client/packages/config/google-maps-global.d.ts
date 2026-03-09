/**
 * Global 'google' from Google Maps API.
 * Satisfies silverkey/no-unimported-identifiers in packages when @types/google.maps
 * is not in scope (e.g. only in apps/web). For full types, use /// <reference types="google.maps" />.
 */
declare namespace google {
  // Marker namespace so `google` is a known global without
  // redeclaring the variable already provided by @types/google.maps.
}
