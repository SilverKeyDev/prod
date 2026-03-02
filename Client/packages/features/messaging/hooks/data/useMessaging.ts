/**
 * Re-export messaging hook and types from messaging/ for backwards compatibility.
 * Import from here or from ./messaging.
 */

export {
  type ChatMessage,
  type EventRequestStatus,
  useMessaging,
  type UseMessagingConfig,
  type UseMessagingReturn,
} from "./messaging";
