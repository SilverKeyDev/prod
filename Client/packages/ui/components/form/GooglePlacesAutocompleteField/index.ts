export type { AddressData } from "../AddressInput/AddressInput";
export type { GooglePlacesAutocompleteFieldProps } from "./GooglePlacesAutocompleteField";
/**
 * Google Places combobox UX (keyboard, listbox roles, formatted address) — see
 * `GooglePlacesAutocompleteField.web.tsx`. For important-locations parity use
 * `features/profile/.../ImportantLocationsInput.web.tsx`; `packages/ui/.../ImportantLocationsInput.web`
 * is a lighter manual path and does not mirror that pattern.
 */
export { default as GooglePlacesAutocompleteField } from "./GooglePlacesAutocompleteField";
