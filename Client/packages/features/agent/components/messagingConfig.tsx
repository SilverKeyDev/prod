import type { IconName } from "packages/ui/types/icons";

export type MessagingMode = "client" | "agent";
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
    title: "Inbox",
    emptyTitle: "No agent assigned",
    emptyMessage: "Search for an agent to start messaging",
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
    sendButtonLabel: "Send Request",
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
    sendButtonLabel: "Send Request",
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
export const getMessagingConfig = (mode: MessagingMode): MessagingConfig => {
  return mode === "agent" ? AGENT_MESSAGING_CONFIG : CLIENT_MESSAGING_CONFIG;
};
