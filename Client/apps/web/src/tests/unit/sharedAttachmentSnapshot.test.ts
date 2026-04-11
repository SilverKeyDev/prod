import { describe, expect, it } from "vitest";

import {
  buildSharedDocumentAttachmentMessage,
  buildSharedHomeAttachmentMessage,
  mergeSharedDocumentForDisplay,
  mergeSharedHomeForDisplay,
  parseSharedAttachmentSnapshot,
  SHARED_ATTACHMENT_PREFIX,
} from "packages/features/messaging";
import type { SavedHome } from "packages/types/savedHome";
import type { DocumentData } from "packages/ui/components/cards/document/types";

describe("sharedAttachmentSnapshot", () => {
  it("round-trips home snapshot fields", () => {
    const home: SavedHome = {
      home_id: "z-1",
      address: "10 Oak St",
      description: "Nice place",
      price: "450000",
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1800,
      lot_size: "0.2",
      image_url: "https://example.com/p.jpg",
      lat: 40.1,
      lng: -74.2,
    };
    const msg = buildSharedHomeAttachmentMessage(home);
    expect(msg.startsWith(SHARED_ATTACHMENT_PREFIX)).toBe(true);
    const parsed = parseSharedAttachmentSnapshot(msg);
    expect(parsed?.kind).toBe("home");
    if (parsed?.kind !== "home") return;
    expect(parsed.home.address).toBe("10 Oak St");
    expect(parsed.home.sqft).toBe(1800);
    expect(parsed.home.image_url).toBe("https://example.com/p.jpg");
    expect(parsed.displayLine).toBe("10 Oak St");
  });

  it("mergeSharedHomeForDisplay prefers snapshot over stale saved cache", () => {
    const home: SavedHome = {
      home_id: "z-1",
      address: "10 Oak St",
      description: "",
      price: "100",
      lot_size: "",
    };
    const msg = buildSharedHomeAttachmentMessage(home);
    const merged = mergeSharedHomeForDisplay("z-1", msg, () => ({
      home_id: "z-1",
      address: "OLD",
      description: "",
      price: "1",
      lot_size: "",
    }));
    expect(merged.address).toBe("10 Oak St");
    expect(merged.price).toBe("100");
  });

  it("round-trips document snapshot and merge without live list", () => {
    const doc: DocumentData = {
      id: "doc-1",
      filename: "offer.pdf",
      file_path: "/files/offer.pdf",
      status: "ready",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: null,
      user_id: "u1",
      document_type: "PDF",
      address: "99 Elm",
    };
    const msg = buildSharedDocumentAttachmentMessage(doc);
    const merged = mergeSharedDocumentForDisplay(msg, "doc-1", []);
    expect(merged?.filename).toBe("offer.pdf");
    expect(merged?.address).toBe("99 Elm");
  });
});
