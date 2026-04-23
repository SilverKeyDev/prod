export type AccountPrivacyDataSectionProps = {
  /** When set, the viewer is a professional viewing a client — hide self-service data actions. */
  agentSubject?: { userId: string; displayName: string } | null;
};
