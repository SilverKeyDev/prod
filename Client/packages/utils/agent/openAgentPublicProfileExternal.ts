import { Linking } from "react-native";

import { getWindow } from "packages/utils/platform";

import { getAgentPublicProfileAbsoluteUrl } from "./publicUrl";

export type AgentPublicProfileLinkAgent = {
  id: string;
  name?: string | null;
  public_profile_slug?: string | null;
};

/** Opens the agent public profile in a new browser tab (web) or system browser (native). */
export function openAgentPublicProfileExternal(agent: AgentPublicProfileLinkAgent): void {
  const url = getAgentPublicProfileAbsoluteUrl(
    agent.id,
    agent.name?.trim() || "Agent",
    agent.public_profile_slug ?? undefined
  );
  const w = getWindow();
  if (w && typeof w.open === "function") {
    w.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  void Linking.openURL(url);
}
