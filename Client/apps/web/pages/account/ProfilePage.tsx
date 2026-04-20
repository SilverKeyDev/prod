import React from "react";

import ProfileFeature from "@/features/profile/components/settings/inputs/ProfileFeature";

// Export SettingsModal for use in other components
export { default as SettingsModal } from "packages/features/agent/components/modals/settings/SettingsModal";

type ProfilePageProps = {
  setMobileHeaderActions: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
};

export default function ProfilePage({ setMobileHeaderActions }: ProfilePageProps) {
  return <ProfileFeature setMobileHeaderActions={setMobileHeaderActions} />;
}
