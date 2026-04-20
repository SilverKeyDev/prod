import type React from "react";

export type ProfileAgentSubject = {
  userId: string;
  displayName: string;
};

export type ProfileFeatureProps = {
  setMobileHeaderActions?: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
  /** When set, loads that user's preferences read-only (e.g. agent client hub). */
  agentSubject?: ProfileAgentSubject | null;
};
