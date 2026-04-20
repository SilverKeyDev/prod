import type { UserProfile } from "packages/types";

/**
 * Configuration for a data route
 */
export interface RouteConfig {
  /** Unique identifier for the route */
  key: string;
  /** Function that returns the React Query key for this route */
  queryKey: () => readonly unknown[];
  /** Function that fetches the data for this route */
  queryFn: (user: UserProfile | null) => Promise<unknown>;
  /** Whether this route should be polled in the background */
  shouldPoll: boolean;
  /** Polling interval in milliseconds (background) */
  pollingInterval?: number;
  /** Polling interval in milliseconds when user is on the active page (optional) */
  pollingIntervalActive?: number;
  /** Stale time in milliseconds for React Query */
  staleTime: number;
  /** User type restriction: 'all' or 'agent' */
  userType: "all" | "agent";
  /** Whether to load this route on initial prefetch */
  initialLoad: boolean;
}
