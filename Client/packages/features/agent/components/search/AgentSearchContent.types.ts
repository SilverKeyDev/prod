import type { RefObject } from "react";
import type { TextInput } from "react-native";

import type { AgentSearchResult } from "@/features/agent/api/agent";

export type AgentSearchContentHandle = {
  /** Sends a connection request for the currently selected agent. Returns true if sent successfully. */
  submitSelectedRequest: () => Promise<boolean>;
};

export type AgentSearchPrimaryAction = "connectionRequest" | "openProfile";

export type AgentSearchContentProps = {
  /** Called after a connection request is sent successfully (e.g. close modal). */
  onSuccess?: () => void;
  /** When false, search is not run (e.g. modal closed). Default true. */
  isActive?: boolean;
  /** Optional ref for the search input (e.g. for modal focus). */
  inputRef?: RefObject<HTMLInputElement | TextInput | null>;
  className?: string;
  /**
   * `openProfile`: "View profile" and "Connect" buttons; connect expands the request form.
   * Default: expand inline to send a connection request.
   */
  primaryAction?: AgentSearchPrimaryAction;
  /** Required when `primaryAction` is `openProfile` (or pass a no-op). */
  onOpenAgentProfile?: (agent: AgentSearchResult) => void;
  /** Label for the connect control when `primaryAction` is `openProfile`. */
  connectButtonLabel?: string;
  /** Label for the profile control when `primaryAction` is `openProfile`. */
  profileButtonLabel?: string;
};
