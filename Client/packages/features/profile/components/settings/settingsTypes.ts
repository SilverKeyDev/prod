import type React from "react";

export type SettingsProps = {
  setMobileHeaderActions?: React.Dispatch<
    React.SetStateAction<React.ReactNode | null>
  >;
};
