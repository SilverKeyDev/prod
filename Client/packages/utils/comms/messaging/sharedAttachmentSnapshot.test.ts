import { describe, expect, it } from "vitest";

import type { SavedHome } from "packages/types/domain/savedHome";
import type { DocumentData } from "packages/ui/components/surfaces/cards/document/types";

import {
  buildSharedBundleAttachmentMessage,
  buildSharedChecklistFormAttachmentMessage,
  buildSharedDocumentAttachmentMessage,
  buildSharedDocumentsAttachmentMessage,
  buildSharedHomeAttachmentMessage,
  buildSharedHomesAttachmentMessage,
  mergeBundleDocumentsForDisplay,
  mergeBundleHomesForDisplay,
  mergeSharedDocumentForDisplay,
  mergeSharedHomeForDisplay,
  parseSharedAttachmentSnapshot,
  SHARED_ATTACHMENT_PREFIX,
} from "./sharedAttachmentSnapshot";

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

  it("round-trips bundle snapshot for two homes", () => {
    const a: SavedHome = {
      home_id: "a-1",
      address: "1 First St",
      description: "",
      price: "100",
      lot_size: "",
    };
    const b: SavedHome = {
      home_id: "b-2",
      address: "2 Second Ave",
      description: "",
      price: "200",
      lot_size: "",
    };
    const msg = buildSharedHomesAttachmentMessage([a, b]);
    expect(msg.startsWith(SHARED_ATTACHMENT_PREFIX)).toBe(true);
    const parsed = parseSharedAttachmentSnapshot(msg);
    expect(parsed?.kind).toBe("bundle");
    if (parsed?.kind !== "bundle") return;
    expect(parsed.items).toHaveLength(2);
    expect(parsed.items[0].type).toBe("home");
    if (parsed.items[0].type !== "home") return;
    expect(parsed.items[0].home.home_id).toBe("a-1");
    if (parsed.items[1].type !== "home") return;
    expect(parsed.items[1].home.address).toBe("2 Second Ave");
    expect(parsed.displayLine).toContain("2 homes");
  });

  it("parses legacy bundle JSON that only has homes array", () => {
    const legacy = `${SHARED_ATTACHMENT_PREFIX}${JSON.stringify({
      v: 1,
      kind: "bundle",
      displayLine: "2 homes · X",
      homes: [
        { home_id: "h1", address: "A St" },
        { home_id: "h2", address: "B St" },
      ],
    })}`;
    const parsed = parseSharedAttachmentSnapshot(legacy);
    expect(parsed?.kind).toBe("bundle");
    if (parsed?.kind !== "bundle") return;
    expect(parsed.items).toHaveLength(2);
    expect(parsed.items.every((i) => i.type === "home")).toBe(true);
  });

  it("round-trips document bundle", () => {
    const d1: DocumentData = {
      id: "d1",
      filename: "a.pdf",
      file_path: "/a",
      status: "ready",
      created_at: null,
      updated_at: null,
      user_id: "u",
      document_type: "PDF",
      address: null,
    };
    const d2: DocumentData = {
      id: "d2",
      filename: "b.pdf",
      file_path: "/b",
      status: "ready",
      created_at: null,
      updated_at: null,
      user_id: "u",
      document_type: "PDF",
      address: "1 Main",
    };
    const msg = buildSharedDocumentsAttachmentMessage([d1, d2]);
    const parsed = parseSharedAttachmentSnapshot(msg);
    expect(parsed?.kind).toBe("bundle");
    if (parsed?.kind !== "bundle") return;
    expect(parsed.items).toHaveLength(2);
    expect(parsed.items[0].type).toBe("document");
    const merged = mergeBundleDocumentsForDisplay(msg, []);
    expect(merged).toHaveLength(2);
    expect(merged[0].filename).toBe("a.pdf");
  });

  it("buildSharedBundleAttachmentMessage supports mixed items", () => {
    const msg = buildSharedBundleAttachmentMessage([
      {
        type: "home",
        home: {
          home_id: "z1",
          address: "100 Road",
        },
      },
      {
        type: "document",
        document: {
          id: "doc-x",
          filename: "x.pdf",
          file_path: "/x",
          status: "ready",
          created_at: null,
          updated_at: null,
          user_id: "u",
          document_type: null,
          address: null,
        },
      },
    ]);
    const parsed = parseSharedAttachmentSnapshot(msg);
    expect(parsed?.kind).toBe("bundle");
    if (parsed?.kind !== "bundle") return;
    expect(parsed.items.some((i) => i.type === "home")).toBe(true);
    expect(parsed.items.some((i) => i.type === "document")).toBe(true);
  });

  it("single home via buildSharedHomesAttachmentMessage uses kind home", () => {
    const home: SavedHome = {
      home_id: "z-1",
      address: "Solo St",
      description: "",
      price: "",
      lot_size: "",
    };
    const msg = buildSharedHomesAttachmentMessage([home]);
    const parsed = parseSharedAttachmentSnapshot(msg);
    expect(parsed?.kind).toBe("home");
  });

  it("mergeBundleHomesForDisplay merges each id with saved cache", () => {
    const a: SavedHome = {
      home_id: "a-1",
      address: "Snap A",
      description: "",
      price: "1",
      lot_size: "",
    };
    const b: SavedHome = {
      home_id: "b-2",
      address: "Snap B",
      description: "",
      price: "2",
      lot_size: "",
    };
    const msg = buildSharedHomesAttachmentMessage([a, b]);
    const merged = mergeBundleHomesForDisplay(msg, (id) =>
      id === "a-1"
        ? {
            home_id: "a-1",
            address: "OLD A",
            description: "",
            price: "999",
            lot_size: "",
          }
        : undefined
    );
    expect(merged).toHaveLength(2);
    expect(merged[0].address).toBe("Snap A");
    expect(merged[0].price).toBe("1");
    expect(merged[1].address).toBe("Snap B");
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

  it("round-trips checklist_form snapshot", () => {
    const msg = buildSharedChecklistFormAttachmentMessage({
      id: "form-uuid-1",
      form_key: "earnest_money",
      title: "Earnest Money Receipt",
      download_url: "https://example.com/presigned.pdf",
    });
    expect(msg.startsWith(SHARED_ATTACHMENT_PREFIX)).toBe(true);
    const parsed = parseSharedAttachmentSnapshot(msg);
    expect(parsed?.kind).toBe("checklist_form");
    if (parsed?.kind !== "checklist_form") return;
    expect(parsed.checklistForm.form_key).toBe("earnest_money");
    expect(parsed.checklistForm.download_url).toContain("presigned");
    expect(parsed.displayLine).toBe("Earnest Money Receipt");
  });

  it("parses checklist_form when optional note follows snapshot line", () => {
    const line0 = buildSharedChecklistFormAttachmentMessage({
      id: "f1",
      form_key: "aba",
      title: "ABA Disclosure",
      download_url: "https://x.test/a.pdf",
    });
    const parsed = parseSharedAttachmentSnapshot(`${line0}\n\nPlease sign`);
    expect(parsed?.kind).toBe("checklist_form");
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
