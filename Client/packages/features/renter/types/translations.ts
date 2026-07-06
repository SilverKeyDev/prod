/** Renter product copy — includes messaging overlay strings for client persona. */
export const RENTER_TRANSLATIONS = {
  // existing keys stay...
  RENTER_SHELL_SETUP_TITLE: "Renter workspace setup",
  RENTER_SHELL_SETUP_SUBTITLE:
    "Placeholder step while the renter product shell is under construction.",
  RENTER_SHELL_TEST_INPUT_LABEL: "Renter shell test input",
  RENTER_MESSAGING_SIDEBAR_TITLE: "Your rental team",
  RENTER_MESSAGING_EMPTY_TITLE: "No conversations yet",
  RENTER_MESSAGING_EMPTY_MESSAGE:
    "Connect with an agent for your rental search. Your conversations will appear here.",
  RENTER_MESSAGING_HEADER_CHAT: "Chat with your agent",
  RENTER_MESSAGING_NO_SELECTION_TITLE: "No agent assigned",
  RENTER_MESSAGING_NO_SELECTION_MESSAGE: "Search for an agent to discuss your rental search",
  RENTER_MESSAGING_NO_MESSAGES_TITLE: "Start a conversation",
  RENTER_MESSAGING_NO_MESSAGES_MESSAGE: "Send a message about your rental search",
  RENTER_MESSAGING_NO_AGENT_TITLE: "No agent assigned",
  RENTER_MESSAGING_NO_AGENT_MESSAGE: "Search for an agent to discuss your rental search",
  RENTER_MESSAGING_NO_AGENT_ACTION: "Search for Agent",

  // SIL-226 onboarding steps
  RENTER_BUDGET_TITLE: "What's your monthly rent budget?",
  RENTER_BUDGET_SUBTITLE: "Set a range you're comfortable with — we'll find rentals that fit.",
  RENTER_BUDGET_MIN_LABEL: "Minimum rent ($/mo)",
  RENTER_BUDGET_MAX_LABEL: "Maximum rent ($/mo)",

  RENTER_LOCATION_TITLE: "Where are you looking to rent?",
  RENTER_LOCATION_SUBTITLE: "Add neighborhoods, cities, or addresses you'd like to live near.",

  RENTER_MOVE_TIMELINE_TITLE: "When do you need to move in?",
  RENTER_MOVE_TIMELINE_SUBTITLE: "This helps agents prioritize available listings for you.",
  RENTER_MOVE_TIMELINE_IMMEDIATELY: "As soon as possible",
  RENTER_MOVE_TIMELINE_ONE_MONTH: "Within 1 month",
  RENTER_MOVE_TIMELINE_THREE_MONTHS: "Within 3 months",
  RENTER_MOVE_TIMELINE_SIX_MONTHS: "Within 6 months",
  RENTER_MOVE_TIMELINE_FLEXIBLE: "Flexible / just browsing",

  RENTER_HOUSEHOLD_TITLE: "Tell us about your household",
  RENTER_HOUSEHOLD_SUBTITLE: "Helps match you with the right size unit.",
  RENTER_HOUSEHOLD_SIZE_LABEL: "Number of people",
  RENTER_HOUSEHOLD_PETS_LABEL: "Do you have pets?",
  RENTER_HOUSEHOLD_PET_TYPES_LABEL: "What kind of pets?",

  RENTER_AMENITIES_TITLE: "What amenities matter most?",
  RENTER_AMENITIES_SUBTITLE: "Select everything that's important to your rental search.",
} as const;
