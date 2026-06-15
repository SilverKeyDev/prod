import type React from "react";

import { PersonalizationSettingsScreen } from "packages/features/profile/components/settings/PersonalizationSettingsScreen.web";

export { default as SettingsModal } from "packages/features/agent/components/modals/settings/SettingsModal";

type PersonalizationPageProps = {
  setMobileHeaderActions: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
};

export default function PersonalizationPage({ setMobileHeaderActions }: PersonalizationPageProps) {
  return <PersonalizationSettingsScreen setMobileHeaderActions={setMobileHeaderActions} />;
}
