import { create } from "zustand";

import { withDevtools } from "packages/store/middleware/devtools";

import { mergeDraft, removeDraftKey } from "./messagingComposerDraftModel";

export type MessagingComposerState = {
  /** Unsent composer text keyed by server conversation id */
  draftByConversationId: Record<string, string>;
  setDraft: (conversationId: string, text: string) => void;
  clearDraft: (conversationId: string) => void;
  /** Clears all drafts (e.g. logout) */
  reset: () => void;
};

const emptyDrafts = (): Record<string, string> => ({});

const baseCreator: import("zustand").StateCreator<MessagingComposerState> = (set) => ({
  draftByConversationId: emptyDrafts(),

  setDraft: (conversationId, text) =>
    set((state) => {
      const next = mergeDraft(state.draftByConversationId, conversationId, text);
      if (!next) return state;
      return { draftByConversationId: next };
    }),

  clearDraft: (conversationId) =>
    set((state) => {
      const next = removeDraftKey(state.draftByConversationId, conversationId);
      if (!next) return state;
      return { draftByConversationId: next };
    }),

  reset: () => set({ draftByConversationId: emptyDrafts() }),
});

const withDev = withDevtools<MessagingComposerState>("messagingComposer")(
  baseCreator
) as unknown as import("zustand").StateCreator<MessagingComposerState>;

export const useMessagingComposerStore = create<MessagingComposerState>()(withDev);
