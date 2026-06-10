import type { SavedHome } from "packages/types/domain/savedHome";
import type { DocumentData } from "packages/ui/components/surfaces/cards/document/types";

import {
  SHARED_ATTACHMENT_PREFIX,
  type SharedAttachmentSnapshotV1,
  type SharedBundleItemV1,
  type SharedChecklistFormSnapshot,
  type SharedDocumentSnapshot,
  type SharedHomeSnapshot,
} from "./sharedAttachmentSnapshot.types";

function sharedHomeSnapshotFromSavedHome(home: SavedHome, homeId: string): SharedHomeSnapshot {
  const zpid = home.zpid?.trim();
  const mls = home.mls_home_id?.trim();
  return {
    home_id: homeId,
    ...(zpid !== undefined && zpid !== "" ? { zpid } : {}),
    ...(mls !== undefined && mls !== "" ? { mls_home_id: mls } : {}),
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

function sharedDocumentSnapshotFromDocumentData(doc: DocumentData): SharedDocumentSnapshot {
  return {
    id: doc.id,
    filename: doc.filename,
    file_path: doc.file_path,
    status: doc.status,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
    user_id: doc.user_id,
    document_type: doc.document_type,
    address: doc.address,
  };
}

function bundleItemDedupeKey(item: SharedBundleItemV1): string {
  if (item.type === "home") return `home:${item.home.home_id.trim()}`;
  if (item.type === "document") return `document:${item.document.id.trim()}`;
  return `checklist_form:${item.checklistForm.id.trim()}`;
}

function dedupeBundleItems(items: SharedBundleItemV1[]): SharedBundleItemV1[] {
  const seen = new Set<string>();
  const out: SharedBundleItemV1[] = [];
  for (const item of items) {
    const key = bundleItemDedupeKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** Default summary line when the sender did not pass an explicit `displayLine`. */
export function defaultBundleDisplayLine(items: SharedBundleItemV1[]): string {
  const homeN = items.filter((i) => i.type === "home").length;
  const docN = items.filter((i) => i.type === "document").length;
  const formN = items.filter((i) => i.type === "checklist_form").length;
  const labelParts: string[] = [];
  if (homeN > 0) labelParts.push(`${homeN} ${homeN === 1 ? "home" : "homes"}`);
  if (docN > 0) labelParts.push(`${docN} ${docN === 1 ? "document" : "documents"}`);
  if (formN > 0) labelParts.push(`${formN} ${formN === 1 ? "form" : "forms"}`);
  const summary = labelParts.join(", ");
  const first = items[0];
  let suffix = "";
  if (first.type === "home") {
    suffix = first.home.address?.trim() || first.home.description?.trim() || first.home.home_id;
  } else if (first.type === "document") {
    suffix = first.document.filename?.trim() || first.document.address?.trim() || first.document.id;
  } else {
    suffix =
      first.checklistForm.title?.trim() || first.checklistForm.form_key || first.checklistForm.id;
  }
  return `${summary} · ${suffix}`;
}

/**
 * Builds a multi-item shared attachment. Requires at least two items after deduplication.
 */
export function buildSharedBundleAttachmentMessage(
  items: SharedBundleItemV1[],
  displayLine?: string
): string {
  const normalized = dedupeBundleItems(items);
  if (normalized.length < 2) {
    throw new Error("buildSharedBundleAttachmentMessage requires at least two items");
  }
  const line = (displayLine?.trim() || defaultBundleDisplayLine(normalized)).trim();
  const payload: SharedAttachmentSnapshotV1 = {
    v: 1,
    kind: "bundle",
    displayLine: line,
    items: normalized,
  };
  return `${SHARED_ATTACHMENT_PREFIX}${JSON.stringify(payload)}`;
}

/**
 * Full message body stored in ChatHistory.message (first line is prefix + JSON).
 */
export function buildSharedHomeAttachmentMessage(home: SavedHome): string {
  const homeId = (home.home_id || home.address || "").trim();
  const displayLine = home.address?.trim() || home.description?.trim() || homeId || "Shared home";
  const payload: SharedAttachmentSnapshotV1 = {
    v: 1,
    kind: "home",
    displayLine,
    home: sharedHomeSnapshotFromSavedHome(home, homeId),
  };
  return `${SHARED_ATTACHMENT_PREFIX}${JSON.stringify(payload)}`;
}

/**
 * Builds a shared attachment for one or more saved homes. Single home keeps
 * `kind: "home"`; two or more use `kind: "bundle"`. API `shared_home_id` should
 * be the first home's id.
 */
export function buildSharedHomesAttachmentMessage(homes: SavedHome[]): string {
  const seen = new Set<string>();
  const normalized = homes.filter((h) => {
    const id = (h.home_id || h.address || "").trim();
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  if (normalized.length === 0) {
    throw new Error("buildSharedHomesAttachmentMessage requires at least one home");
  }
  if (normalized.length === 1) {
    return buildSharedHomeAttachmentMessage(normalized[0]);
  }
  const items: SharedBundleItemV1[] = normalized.map((h) => {
    const id = (h.home_id || h.address || "").trim();
    return { type: "home", home: sharedHomeSnapshotFromSavedHome(h, id) };
  });
  const firstAddr =
    items[0].type === "home"
      ? items[0].home.address?.trim() || items[0].home.description?.trim() || items[0].home.home_id
      : "";
  const displayLine = `${items.length} homes · ${firstAddr}`;
  return buildSharedBundleAttachmentMessage(items, displayLine);
}

/**
 * One document uses `kind: "document"`; two or more use `kind: "bundle"` with
 * document items. API `shared_document_id` should be the first document's id.
 */
export function buildSharedDocumentsAttachmentMessage(docs: DocumentData[]): string {
  const seen = new Set<string>();
  const normalized = docs.filter((d) => {
    const id = (d.id || "").trim();
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  if (normalized.length === 0) {
    throw new Error("buildSharedDocumentsAttachmentMessage requires at least one document");
  }
  if (normalized.length === 1) {
    return buildSharedDocumentAttachmentMessage(normalized[0]);
  }
  const items: SharedBundleItemV1[] = normalized.map((d) => ({
    type: "document",
    document: sharedDocumentSnapshotFromDocumentData(d),
  }));
  const firstName =
    items[0].type === "document"
      ? items[0].document.filename?.trim() ||
        items[0].document.address?.trim() ||
        items[0].document.id
      : "";
  const displayLine = `${items.length} documents · ${firstName}`;
  return buildSharedBundleAttachmentMessage(items, displayLine);
}

export function buildSharedDocumentAttachmentMessage(doc: DocumentData): string {
  const displayLine = doc.filename?.trim() || doc.address?.trim() || doc.id || "Shared document";
  const payload: SharedAttachmentSnapshotV1 = {
    v: 1,
    kind: "document",
    displayLine,
    document: sharedDocumentSnapshotFromDocumentData(doc),
  };
  return `${SHARED_ATTACHMENT_PREFIX}${JSON.stringify(payload)}`;
}

export function buildSharedChecklistFormAttachmentMessage(
  checklistForm: SharedChecklistFormSnapshot
): string {
  const displayLine =
    checklistForm.title?.trim() ||
    checklistForm.form_key?.trim() ||
    checklistForm.id ||
    "Shared form";
  const payload: SharedAttachmentSnapshotV1 = {
    v: 1,
    kind: "checklist_form",
    displayLine,
    checklistForm: {
      id: checklistForm.id,
      form_key: checklistForm.form_key,
      title: checklistForm.title,
      download_url: checklistForm.download_url,
    },
  };
  return `${SHARED_ATTACHMENT_PREFIX}${JSON.stringify(payload)}`;
}
