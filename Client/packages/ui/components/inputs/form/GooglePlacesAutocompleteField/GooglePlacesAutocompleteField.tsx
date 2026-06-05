import {
  AddressInput,
  type AddressInputProps,
} from "packages/ui/components/inputs/form/AddressInput/AddressInput";

export type { AddressInputProps as GooglePlacesAutocompleteFieldProps } from "packages/ui/components/inputs/form/AddressInput/AddressInput";

/**
 * Manual address field when Places is unavailable (native / scripts not ready).
 * On web, `GooglePlacesAutocompleteField.web.tsx` provides the same autocomplete UX as important locations.
 */
export default function GooglePlacesAutocompleteField(props: AddressInputProps) {
  return <AddressInput {...props} />;
}
