/**
 * Embeds a JSON snapshot of shared homes/documents in chat `message` text so
 * recipients see price, sqft, image, etc. without relying on local saved-homes
 * or documents lists. Prefix keeps backward compatibility with empty messages.
 */

import type { SavedHome } from "packages/types/savedHome";
import type { DocumentData } from "packages/ui/components/cards/document/types";
import type { HomeDescription } from "packages/ui/components/cards/HomeCard";

export const SHARED_ATTACHMENT_PREFIX = "__SK_SHARE__";

export type SharedHomeSnapshot = {
  home_id: string;
  address?: string;
  description?: string;
  price?: string | number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lot_size?: string | number;
  image_url?: string;
  lat?: number;
  lng?: number;
};

export type SharedDocumentSnapshot = {
  id: string;
  filename: string;
  file_path: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  user_id: string;
  document_type: string | null;
  address: string | null;
};

export type SharedAttachmentSnapshotV1 =
  | {
      v: 1;
      kind: "home";
      displayLine: string;
      home: SharedHomeSnapshot;
    }
  | {
      v: 1;
      kind: "document";
      displayLine: string;
      document: SharedDocumentSnapshot;
    };

function sharedHomeSnapshotFromSavedHome(
  home: SavedHome,
  homeId: string,
): SharedHomeSnapshot {
  return {
    home_id: homeId,
    address: home.address?.trim() || undefined,
    description: home.description?.trim() || undefined,
    price: home.price,
    bedrooms: home.bedrooms,
    bathrooms: home.bathrooms,
    sqft: home.sqft,
    lot_size: home.lot_size,
    image_url: home.image_url,
    lat: home.lat,
    lng: home.lng,
  };
}

/**
 * Full message body stored in ChatHistory.message (first line is prefix + JSON).
 */
export function buildSharedHomeAttachmentMessage(home: SavedHome): string {
  const homeId = (home.home_id || home.address || "").trim();
  const displayLine =
    home.address?.trim() || home.description?.trim() || homeId || "Shared home";
  const payload: SharedAttachmentSnapshotV1 = {
    v: 1,
    kind: "home",
    displayLine,
    home: sharedHomeSnapshotFromSavedHome(home, homeId),
  };
  return `${SHARED_ATTACHMENT_PREFIX}${JSON.stringify(payload)}`;
}

export function buildSharedDocumentAttachmentMessage(
  doc: DocumentData,
): string {
  const displayLine =
    doc.filename?.trim() || doc.address?.trim() || doc.id || "Shared document";
  const payload: SharedAttachmentSnapshotV1 = {
    v: 1,
    kind: "document",
    displayLine,
    document: {
      id: doc.id,
      filename: doc.filename,
      file_path: doc.file_path,
      status: doc.status,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      user_id: doc.user_id,
      document_type: doc.document_type,
      address: doc.address,
    },
  };
  return `${SHARED_ATTACHMENT_PREFIX}${JSON.stringify(payload)}`;
}

export function parseSharedAttachmentSnapshot(
  content: string | null | undefined,
): SharedAttachmentSnapshotV1 | null {
  const trimmed = content?.trim();
  if (!trimmed?.startsWith(SHARED_ATTACHMENT_PREFIX)) {
    return null;
  }
  const firstLine = trimmed.split("\n")[0];
  const jsonStr = firstLine.slice(SHARED_ATTACHMENT_PREFIX.length).trim();
  try {
    const parsed = JSON.parse(jsonStr) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const rec = parsed as Record<string, unknown>;
    if (rec.v !== 1) return null;
    if (rec.kind === "home" && rec.home && typeof rec.home === "object") {
      const home = rec.home as Record<string, unknown>;
      const homeId = typeof home.home_id === "string" ? home.home_id : "";
      if (!homeId) return null;
      return {
        v: 1,
        kind: "home",
        displayLine:
          typeof rec.displayLine === "string" ? rec.displayLine : homeId,
        home: {
          home_id: homeId,
          address: typeof home.address === "string" ? home.address : undefined,
          description:
            typeof home.description === "string" ? home.description : undefined,
          price:
            typeof home.price === "string" || typeof home.price === "number"
              ? (home.price as string | number)
              : undefined,
          bedrooms:
            typeof home.bedrooms === "number" ? home.bedrooms : undefined,
          bathrooms:
            typeof home.bathrooms === "number" ? home.bathrooms : undefined,
          sqft: typeof home.sqft === "number" ? home.sqft : undefined,
          lot_size:
            typeof home.lot_size === "string" ||
            typeof home.lot_size === "number"
              ? (home.lot_size as string | number)
              : undefined,
          image_url:
            typeof home.image_url === "string" ? home.image_url : undefined,
          lat: typeof home.lat === "number" ? home.lat : undefined,
          lng: typeof home.lng === "number" ? home.lng : undefined,
        },
      };
    }
    if (
      rec.kind === "document" &&
      rec.document &&
      typeof rec.document === "object"
    ) {
      const d = rec.document as Record<string, unknown>;
      const id = typeof d.id === "string" ? d.id : "";
      if (!id) return null;
      return {
        v: 1,
        kind: "document",
        displayLine: typeof rec.displayLine === "string" ? rec.displayLine : id,
        document: {
          id,
          filename: typeof d.filename === "string" ? d.filename : "",
          file_path: typeof d.file_path === "string" ? d.file_path : "",
          status: typeof d.status === "string" ? d.status : "",
          created_at:
            d.created_at === null
              ? null
              : typeof d.created_at === "string"
                ? d.created_at
                : null,
          updated_at:
            d.updated_at === null
              ? null
              : typeof d.updated_at === "string"
                ? d.updated_at
                : null,
          user_id: typeof d.user_id === "string" ? d.user_id : "",
          document_type:
            d.document_type === null
              ? null
              : typeof d.document_type === "string"
                ? d.document_type
                : null,
          address:
            d.address === null
              ? null
              : typeof d.address === "string"
                ? d.address
                : null,
        },
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function mergeSharedHomeForDisplay(
  sharedHomeId: string,
  content: string,
  getSavedHome: (id: string) => SavedHome | undefined,
): HomeDescription {
  const snapshot = parseSharedAttachmentSnapshot(content);
  const saved = getSavedHome(sharedHomeId);
  const snapHome = snapshot?.kind === "home" ? snapshot.home : undefined;
  if (!snapHome && !saved) {
    return {
      home_id: sharedHomeId,
      address: content?.trim() || undefined,
    };
  }
  return {
    ...(saved ?? {}),
    ...(snapHome ?? {}),
    home_id: sharedHomeId,
  };
}

export function mergeSharedDocumentForDisplay(
  content: string,
  sharedDocumentId: string,
  documents: DocumentData[],
): DocumentData | null {
  const snapshot = parseSharedAttachmentSnapshot(content);
  const snapDoc = snapshot?.kind === "document" ? snapshot.document : undefined;
  const live = documents.find((d) => d.id === sharedDocumentId);
  if (live) {
    return { ...(snapDoc ?? live), ...live };
  }
  if (snapDoc) {
    return {
      id: snapDoc.id,
      filename: snapDoc.filename,
      file_path: snapDoc.file_path,
      status: snapDoc.status,
      created_at: snapDoc.created_at,
      updated_at: snapDoc.updated_at,
      user_id: snapDoc.user_id,
      document_type: snapDoc.document_type,
      address: snapDoc.address,
    };
  }
  return null;
}
