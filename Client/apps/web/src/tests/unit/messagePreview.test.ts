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

  it("returns typed preview for agreement event payloads", () => {
    const content = `__AGREEMENT_EVENT__${JSON.stringify({
      agreement_id: "agr-1",
      title: "Purchase agreement",
      status: "sent",
      event: "sent",
      dedupe_key: "__AGR__",
    })}`;

    expect(getMessagePreview({ content })).toBe(
      "Request for signature: Purchase agreement",
    );
  });

  it("uses short preview labels for other agreement events", () => {
    expect(
      getMessagePreview({
        content: `__AGREEMENT_EVENT__${JSON.stringify({
          agreement_id: "a",
          title: "Lease",
          status: "pending",
          event: "client_signed",
        })}`,
      }),
    ).toBe("Client signed: Lease");

    expect(
      getMessagePreview({
        content: `__AGREEMENT_EVENT__${JSON.stringify({
          agreement_id: "b",
          title: "Addendum",
          status: "pending",
          event: "agent_signed",
        })}`,
      }),
    ).toBe("Agent signed: Addendum");
  });

  it("prefers agreement preview over shared_document_id when body is agreement event", () => {
    const content = `__AGREEMENT_EVENT__${JSON.stringify({
      agreement_id: "agr-1",
      title: "Offer",
      status: "completed",
      event: "completed",
    })}`;

    expect(
      getMessagePreview({
        content,
        shared_document_id: "agr-1",
      }),
    ).toBe("Document completed: Offer");
  });
});
