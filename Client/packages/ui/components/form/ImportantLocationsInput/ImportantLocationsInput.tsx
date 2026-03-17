import type { ImportantLocation } from "packages/utils/profile";

import { ImportantLocationsInputManual } from "./ImportantLocationsInputManual";

export type ImportantLocationsInputProps = {
  locations: ImportantLocation[];
  onChange: (locations: ImportantLocation[]) => void;
  isEditMode?: boolean;
  /** When true (web only, Google Maps loaded), enables address autocomplete. Ignored on native. */
  scriptsReady?: boolean;
};

/**
 * Shared manual-only implementation. On web, ImportantLocationsInput.web.tsx
 * provides autocomplete when scriptsReady is true; otherwise uses this.
 */
export function ImportantLocationsInput({
  locations,
  onChange,
  isEditMode = true,
}: ImportantLocationsInputProps) {
  return (
    <ImportantLocationsInputManual
      locations={locations}
      onChange={onChange}
      isEditMode={isEditMode}
    />
  );
}
