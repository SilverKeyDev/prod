import type { AgentConversation } from "packages/api";
import type { DocumentData } from "packages/features/documents";
import type { SearchResult } from "packages/features/search";
import type { SavedHome } from "packages/types";
import type { DocumentCardExternalActionHandlers } from "packages/ui/components/surfaces/cards/document/types";

import type {
  MessagingConfig,
  MessagingMode,
} from "@/features/agent/components/messaging/screen/messagingConfig";
import type { ChatMessage } from "@/features/messaging/hooks/data/messaging/types";
import type { EventRequestPayload } from "@/features/messaging/utils/eventRequestPayload";

export type UnifiedMessageThreadRowProps = {
  msg: ChatMessage;
  index: number;
  localMessages: ChatMessage[];
  mode: MessagingMode;
  config: MessagingConfig;
  activeConversation: AgentConversation | null | undefined;
  onAcceptEventRequest?: (messageId: string, payload: EventRequestPayload) => Promise<void>;
  onCancelEventRequest?: (messageId: string) => Promise<void>;
  acceptedEventRequestIds: Set<string>;
  acceptingEventRequestId: string | null;
  viewerUserId: string | null;
  onAgreementView: (agreementId: string, documentName: string) => void;
  onAgreementSignNow: (agreementId: string) => void;
  getSavedHome: (propertyId: string) => SavedHome | undefined;
  isHomeSaved: (propertyId: string, propertyAddress?: string) => boolean;
  saveHome: (property: unknown) => Promise<unknown>;
  removeSavedHome: (propertyId: string, propertyAddress?: string) => Promise<unknown>;
  documents: DocumentData[];
  documentsLoading: boolean;
  documentsError: string | null;
  formsLibraryLoading: boolean;
  formsLibraryError: Error | null;
  checklistFormIdsInLibrary: Set<string> | null;
  t: (key: string) => string;
  openSharedHomeDetails: (property: SearchResult) => void;
  onRetryMessage?: (messageId: string) => void;
  sharedDocumentActionHandlers?: DocumentCardExternalActionHandlers;
};
