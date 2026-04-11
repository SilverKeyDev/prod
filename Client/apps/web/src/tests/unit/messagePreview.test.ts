import { describe, expect, it } from "vitest";

import {
  buildSharedDocumentAttachmentMessage,
  buildSharedHomeAttachmentMessage,
  getMessagePreview,
} from "packages/features/messaging";
import type { SavedHome } from "packages/types/savedHome";
import type { DocumentData } from "packages/ui/components/cards/document/types";

describe("messagePreview", () => {
  it("returns typed preview for shared home messages", () => {
    const home: SavedHome = {
      home_id: "home-1",
      address: "10 Oak St",
      description: "",
      price: "500000",
      lot_size: "",
    };
    const content = buildSharedHomeAttachmentMessage(home);

    expect(getMessagePreview({ content })).toBe("Shared home: 10 Oak St");
  });

  it("returns typed preview for shared document messages", () => {
    const doc: DocumentData = {
      id: "doc-1",
      filename: "offer.pdf",
      file_path: "/files/offer.pdf",
      status: "ready",
      created_at: null,
      updated_at: null,
      user_id: "u-1",
      document_type: null,
      address: null,
    };
    const content = buildSharedDocumentAttachmentMessage(doc);

    expect(getMessagePreview({ content })).toBe("Shared document: offer.pdf");
  });

  it("returns typed preview for event request payloads", () => {
    const content =
      '__EVENT_REQUEST__{"title":"Tour request"}\n\nWhen are you available?';

    expect(getMessagePreview({ content })).toBe("Event request: Tour request");
  });
});
