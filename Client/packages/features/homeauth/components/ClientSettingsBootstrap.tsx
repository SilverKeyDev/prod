import { useClientSettings } from "packages/hooks/data/user/useClientSettings";

/** Subscribes to client settings query so settings load early after authentication. */
export function ClientSettingsBootstrap() {
  useClientSettings();
  return null;
}
