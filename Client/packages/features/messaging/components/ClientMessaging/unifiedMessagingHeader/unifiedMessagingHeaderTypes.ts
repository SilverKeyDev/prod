export type HeaderMode =
  | "inbox"
  | "connection-requests"
  | "chat"
  | "no-agent"
  /** Agent inbox: no client selected — same chrome as buyer empty state, but client-search actions. */
  | "no-client"
  | "clients"
  | "agents"
  /** Brokerage / workspace flat inbox sidebar title. */
  | "messages";
