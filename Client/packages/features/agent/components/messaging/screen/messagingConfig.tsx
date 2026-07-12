import { RENTER_TRANSLATIONS } from "packages/features/renter/types/translations";
import { SELLER_TRANSLATIONS } from "packages/features/seller/types/translations";
import type { IconName } from "packages/ui/types/icons";
import { ACTION_LABELS } from "packages/utils/product/domain/actionLabels";

export type MessagingMode = "client" | "agent" | "brokerage";
export type ClientPersona = "buyer" | "seller" | "renter";
export type MessageRole = "user" | "agent";
export type MessagingConfig = {
  mode: MessagingMode;
  // Message styling
  messageStyles: {
    user: {
      bgColor: string;
      textColor: string;
      iconBg: string;
      iconName: IconName;
      justify: "start" | "end";
    };
    agent: {
      bgColor: string;
      textColor: string;
      iconBg: string;
      iconName: IconName;
      justify: "start" | "end";
    };
  };
  // Typing indicator
  typingIndicator: {
    iconBg: string;
    iconName: IconName;
  };
  // Sidebar config
  sidebar: {
    title: string;
    emptyTitle: string;
    emptyMessage: string;
    emptySubMessage?: string;
  };
  // Header config
  header: {
    chatTitle: string;
    noSelectionTitle: string;
    noSelectionMessage: string;
  };
  // Input config
  input: {
    placeholder: string;
    buttonVariant: "primary" | "olive";
  };
  // Search modal (connection request)
  searchModal: {
    title: string;
    searchPlaceholder: string;
    noResultsMessage: string;
    sendButtonLabel: string;
    searchingMessage: string;
  };
  // Empty states
  emptyStates: {
    noSelection: {
      title: string;
      message: string;
    };
    noMessages: {
      title: string;
      message: string;
    };
    noAgent: {
      title: string;
      message: string;
      actionLabel: string;
    };
  };
};
export const CLIENT_MESSAGING_CONFIG: MessagingConfig = {
  mode: "client",
  messageStyles: {
    user: {
      bgColor: "bg-primary text-white",
      textColor: "!text-white",
      iconBg: "bg-accent-muted",
      iconName: "user",
      justify: "end",
    },
    agent: {
      bgColor: "bg-primary-muted text-text-primary",
      textColor: "text-black",
      iconBg: "bg-accent",
      iconName: "user",
      justify: "start",
    },
  },
  typingIndicator: {
    iconBg: "bg-accent",
    iconName: "bot",
  },
  sidebar: {
    title: "Agents",
    emptyTitle: "No conversations yet",
    emptyMessage: "Connect with an agent to start messaging. Your conversations will appear here.",
  },
  header: {
    chatTitle: "Chat with agent",
    noSelectionTitle: "No agent assigned",
    noSelectionMessage: "Search for an agent to start messaging",
  },
  input: {
    placeholder: "Type a message...",
    buttonVariant: "olive",
  },
  searchModal: {
    title: "Search for an Agent",
    searchPlaceholder: "Search by name...",
    noResultsMessage: "No agents found matching",
    sendButtonLabel: ACTION_LABELS.SEND_REQUEST,
    searchingMessage: "Searching agents...",
  },
  emptyStates: {
    noSelection: {
      title: "No agent assigned",
      message: "Search for an agent to start messaging",
    },
    noMessages: {
      title: "Start a conversation",
      message: "Send a message to your agent",
    },
    noAgent: {
      title: "No agent assigned",
      message: "Search for an agent to start messaging",
      actionLabel: "Search for Agent",
    },
  },
};
export const AGENT_MESSAGING_CONFIG: MessagingConfig = {
  mode: "agent",
  messageStyles: {
    user: {
      bgColor: "bg-primary-muted text-text-primary",
      textColor: "text-black",
      iconBg: "bg-accent-muted",
      iconName: "user",
      justify: "start",
    },
    agent: {
      bgColor: "bg-primary text-white",
      textColor: "!text-white",
      iconBg: "bg-accent",
      iconName: "bot",
      justify: "end",
    },
  },
  typingIndicator: {
    iconBg: "bg-accent",
    iconName: "bot",
  },
  sidebar: {
    title: "Clients",
    emptyTitle: "No clients yet",
    emptyMessage: "Clients will appear here once assigned.",
  },
  header: {
    chatTitle: "Chat with client",
    noSelectionTitle: "No client selected",
    noSelectionMessage: "Choose a client from the list to start messaging",
  },
  input: {
    placeholder: "Message client...",
    buttonVariant: "olive",
  },
  searchModal: {
    title: "Search for a Client",
    searchPlaceholder: "Search by name or email...",
    noResultsMessage: "No clients found matching",
    sendButtonLabel: ACTION_LABELS.SEND_REQUEST,
    searchingMessage: "Searching clients...",
  },
  emptyStates: {
    noSelection: {
      title: "No client selected",
      message: "Choose a client from the list to start messaging",
    },
    noMessages: {
      title: "Start a conversation",
      message: "Send a message to your client",
    },
    noAgent: {
      title: "No agent assigned",
      message: "Search for an agent to start messaging",
      actionLabel: "Search for Agent",
    },
  },
};
/** Brokerage uses client-style bubbles (own messages as "user") with workspace copy. */
export const BROKERAGE_MESSAGING_CONFIG: MessagingConfig = {
  mode: "brokerage",
  messageStyles: CLIENT_MESSAGING_CONFIG.messageStyles,
  typingIndicator: CLIENT_MESSAGING_CONFIG.typingIndicator,
  sidebar: {
    title: "Messages",
    emptyTitle: "No conversations yet",
    emptyMessage:
      "Message platform support or agents at your brokerage. Conversations appear here.",
  },
  header: {
    chatTitle: "Messages",
    noSelectionTitle: "Select a conversation",
    noSelectionMessage: "Choose a thread from the sidebar or start a new one.",
  },
  input: {
    placeholder: "Message…",
    buttonVariant: "olive",
  },
  searchModal: CLIENT_MESSAGING_CONFIG.searchModal,
  emptyStates: {
    noSelection: {
      title: "Select a conversation",
      message: "Choose a thread from the sidebar or start a new one.",
    },
    noMessages: {
      title: "Start a conversation",
      message: "Send a message to begin this thread.",
    },
    noAgent: {
      title: "Select a conversation",
      message: "Choose a thread from the sidebar or start a new one.",
      actionLabel: "",
    },
  },
};

export const getMessagingConfig = (
  mode: MessagingMode,
  options?: { clientPersona?: ClientPersona }
): MessagingConfig => {
  if (mode === "agent") return AGENT_MESSAGING_CONFIG;
  if (mode === "brokerage") return BROKERAGE_MESSAGING_CONFIG;
  if (options?.clientPersona === "seller") {
    return {
      ...CLIENT_MESSAGING_CONFIG,
      sidebar: {
        ...CLIENT_MESSAGING_CONFIG.sidebar,
        title: SELLER_TRANSLATIONS.SELLER_MESSAGING_SIDEBAR_TITLE,
        emptyTitle: SELLER_TRANSLATIONS.SELLER_MESSAGING_EMPTY_TITLE,
        emptyMessage: SELLER_TRANSLATIONS.SELLER_MESSAGING_EMPTY_MESSAGE,
      },
      header: {
        ...CLIENT_MESSAGING_CONFIG.header,
        chatTitle: SELLER_TRANSLATIONS.SELLER_MESSAGING_HEADER_CHAT,
        noSelectionTitle: SELLER_TRANSLATIONS.SELLER_MESSAGING_NO_SELECTION_TITLE,
        noSelectionMessage: SELLER_TRANSLATIONS.SELLER_MESSAGING_NO_SELECTION_MESSAGE,
      },
      emptyStates: {
        ...CLIENT_MESSAGING_CONFIG.emptyStates,
        noSelection: {
          title: SELLER_TRANSLATIONS.SELLER_MESSAGING_NO_SELECTION_TITLE,
          message: SELLER_TRANSLATIONS.SELLER_MESSAGING_NO_SELECTION_MESSAGE,
        },
        noMessages: {
          title: SELLER_TRANSLATIONS.SELLER_MESSAGING_NO_MESSAGES_TITLE,
          message: SELLER_TRANSLATIONS.SELLER_MESSAGING_NO_MESSAGES_MESSAGE,
        },
        noAgent: {
          title: SELLER_TRANSLATIONS.SELLER_MESSAGING_NO_AGENT_TITLE,
          message: SELLER_TRANSLATIONS.SELLER_MESSAGING_NO_AGENT_MESSAGE,
          actionLabel: SELLER_TRANSLATIONS.SELLER_MESSAGING_NO_AGENT_ACTION,
        },
      },
    };
  }
  if (options?.clientPersona === "renter") {
    return {
      ...CLIENT_MESSAGING_CONFIG,
      sidebar: {
        ...CLIENT_MESSAGING_CONFIG.sidebar,
        title: RENTER_TRANSLATIONS.RENTER_MESSAGING_SIDEBAR_TITLE,
        emptyTitle: RENTER_TRANSLATIONS.RENTER_MESSAGING_EMPTY_TITLE,
        emptyMessage: RENTER_TRANSLATIONS.RENTER_MESSAGING_EMPTY_MESSAGE,
      },
      header: {
        ...CLIENT_MESSAGING_CONFIG.header,
        chatTitle: RENTER_TRANSLATIONS.RENTER_MESSAGING_HEADER_CHAT,
        noSelectionTitle: RENTER_TRANSLATIONS.RENTER_MESSAGING_NO_SELECTION_TITLE,
        noSelectionMessage: RENTER_TRANSLATIONS.RENTER_MESSAGING_NO_SELECTION_MESSAGE,
      },
      emptyStates: {
        ...CLIENT_MESSAGING_CONFIG.emptyStates,
        noSelection: {
          title: RENTER_TRANSLATIONS.RENTER_MESSAGING_NO_SELECTION_TITLE,
          message: RENTER_TRANSLATIONS.RENTER_MESSAGING_NO_SELECTION_MESSAGE,
        },
        noMessages: {
          title: RENTER_TRANSLATIONS.RENTER_MESSAGING_NO_MESSAGES_TITLE,
          message: RENTER_TRANSLATIONS.RENTER_MESSAGING_NO_MESSAGES_MESSAGE,
        },
        noAgent: {
          title: RENTER_TRANSLATIONS.RENTER_MESSAGING_NO_AGENT_TITLE,
          message: RENTER_TRANSLATIONS.RENTER_MESSAGING_NO_AGENT_MESSAGE,
          actionLabel: RENTER_TRANSLATIONS.RENTER_MESSAGING_NO_AGENT_ACTION,
        },
      },
    };
  }
  return CLIENT_MESSAGING_CONFIG;
};
