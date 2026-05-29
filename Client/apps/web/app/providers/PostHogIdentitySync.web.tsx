import { usePostHogIdentity } from "packages/hooks/store/integrations/usePostHogIdentity.web";

export function PostHogIdentitySync() {
  usePostHogIdentity();
  return null;
}
