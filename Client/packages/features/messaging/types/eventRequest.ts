/**
 * Event request payload embedded in message content.
 * Used when a user sends a calendar event request from messaging;
 * the first line of the message is __EVENT_REQUEST__ + JSON.
 */
export type EventRequestPayload = {
  title: string;
  start: string; // ISO 8601
  end: string; // ISO 8601
  description?: string;
  /** Persisted on the message so the card can show location after reload. */
  location?: string;
};
