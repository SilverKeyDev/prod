/** Same schema as user preferences important_locations (web source of truth). */
export type SearchImportantLocation = {
  address: string;
  commute_tolerance?: number;
};

export type SearchHeaderLocationsProps = {
  /** Called after locations are saved (e.g. refresh isochrone) */
  onPreferencesChanged?: () => void | Promise<void>;
  /** When true, trigger does not use flex-1 (for use as right side of criteria bar). */
  compact?: boolean;
};
