import { describe, expect, it } from "vitest";

import {
  buildSharedChecklistFormAttachmentMessage,
  buildSharedDocumentAttachmentMessage,
  buildSharedHomeAttachmentMessage,
  buildSharedHomesAttachmentMessage,
  getMessagePreview,
} from "packages/features/messaging";
import type { SavedHome } from "packages/types/domain/savedHome";
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

  it("returns preview for shared bundle messages from displayLine", () => {
    const homes: SavedHome[] = [
      {
        home_id: "a",
        address: "1 A St",
        description: "",
        price: "",
        lot_size: "",
      },
      {
        home_id: "b",
        address: "2 B St",
        description: "",
        price: "",
        lot_size: "",
      },
    ];
    const content = buildSharedHomesAttachmentMessage(homes);
    expect(getMessagePreview({ content })).toContain("2 homes");
    expect(getMessagePreview({ content })).toContain("1 A St");
  });

  it("returns typed preview for shared checklist form messages", () => {
    const content = buildSharedChecklistFormAttachmentMessage({
      id: "cf-1",
      form_key: "wire_instructions",
      title: "Wire instructions",
      download_url: "https://example.com/w.pdf",
    });
    expect(getMessagePreview({ content })).toBe("Shared form: Wire instructions");
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
    const content = '__EVENT_REQUEST__{"title":"Tour request"}\n\nWhen are you available?';

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

    expect(getMessagePreview({ content })).toBe("Request for signature: Purchase agreement");
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
      })
    ).toBe("Client signed: Lease");

    expect(
      getMessagePreview({
        content: `__AGREEMENT_EVENT__${JSON.stringify({
          agreement_id: "b",
          title: "Addendum",
          status: "pending",
          event: "agent_signed",
        })}`,
      })
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
      })
    ).toBe("Document completed: Offer");
  });

  it("parses agreement event when __AGREEMENT_EVENT__ is not at the start", () => {
    const inner = JSON.stringify({
      agreement_id: "02285221-253c-4feb-80e1-5d4df4bd591f",
      title: "Disclosure — NON-Representation",
      status: "completed",
      event: "completed",
      dedupe_key: "__AGREEMENT_EVENT__02285221-253c-4feb-80e1-5d4df4bd591f__completed",
    });
    const content = `are document __AGREEMENT_EVENT__${inner}`;
    expect(getMessagePreview({ content })).toBe(
      "Document completed: Disclosure — NON-Representation"
    );
  });
});
