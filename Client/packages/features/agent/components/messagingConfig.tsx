import { Bot, type LucideIcon, User as UserIcon } from "lucide-react";

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
      icon: LucideIcon;
      justify: "start" | "end";
    };
    agent: {
      bgColor: string;
      textColor: string;
      iconBg: string;
      icon: LucideIcon;
      justify: "start" | "end";
    };
  };
  // Typing indicator
  typingIndicator: {
    iconBg: string;
    icon: LucideIcon;
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
      bgColor: "bg-olive text-white",
      textColor: "text-white",
      iconBg: "bg-beige",
      icon: UserIcon,
      justify: "end",
    },
    agent: {
      bgColor: "bg-neutral-100 text-black",
      textColor: "text-black",
      iconBg: "bg-gold",
      icon: UserIcon,
      justify: "start",
    },
  },
  typingIndicator: {
    iconBg: "bg-gold",
    icon: Bot,
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
      bgColor: "bg-neutral-100 text-black",
      textColor: "text-black",
      iconBg: "bg-beige",
      icon: UserIcon,
      justify: "start",
    },
    agent: {
      bgColor: "bg-olive text-white",
      textColor: "text-white",
      iconBg: "bg-gold",
      icon: Bot,
      justify: "end",
    },
  },
  typingIndicator: {
    iconBg: "bg-gold",
    icon: Bot,
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
