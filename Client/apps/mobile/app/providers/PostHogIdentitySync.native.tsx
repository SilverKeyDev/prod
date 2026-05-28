import { usePostHogIdentity } from "packages/hooks/store/usePostHogIdentity";

/** Syncs auth identity to PostHog on native (no UI). */
export function PostHogIdentitySyncNative() {
  usePostHogIdentity();
  return null;
}
