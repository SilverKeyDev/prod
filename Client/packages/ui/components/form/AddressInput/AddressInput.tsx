import React from "react";

import Input from "@ui/form/Input";
import { Icon } from "@ui/icons";

import { Box } from "packages/ui/components/primitives";

export type AddressData = {
  address: string;
  place_id?: string;
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
};

export type AddressInputProps = {
  value: string;
  onChange: (value: string) => void;
  /** Called when user picks from autocomplete (web only). Not called for manual entry. */
  onSelect?: (address: AddressData) => void;
  /** When true (web only, Google Maps loaded), enables address autocomplete. Ignored on native. */
  scriptsReady?: boolean;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
};

/**
 * Shared manual-only implementation. On web, AddressInput.web.tsx
 * provides autocomplete when scriptsReady is true; otherwise uses this.
 */
export function AddressInput({
  value,
  onChange,
  placeholder = "e.g., 123 Main St, San Francisco, CA 94102",
  disabled = false,
  label,
}: AddressInputProps) {
  return (
    <Box className="w-full">
      <Input
        label={label}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        leftIcon={<Icon name="map-pin" className="h-4 w-4" />}
        autoComplete="off"
        size="md"
      />
    </Box>
  );
}

export default AddressInput;
