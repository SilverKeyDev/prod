import { defaultBundleDisplayLine } from "./sharedAttachmentSnapshot.build";
import {
  SHARED_ATTACHMENT_PREFIX,
  type SharedAttachmentSnapshotV1,
  type SharedBundleItemV1,
  type SharedChecklistFormSnapshot,
  type SharedDocumentSnapshot,
  type SharedHomeSnapshot,
} from "./sharedAttachmentSnapshot.types";

function parseSharedHomeSnapshotRecord(home: Record<string, unknown>): SharedHomeSnapshot | null {
  const homeId = typeof home.home_id === "string" ? home.home_id : "";
  if (!homeId) return null;
  const zpidRaw = typeof home.zpid === "string" ? home.zpid.trim() : "";
  const mlsRaw = typeof home.mls_home_id === "string" ? home.mls_home_id.trim() : "";
  return {
    home_id: homeId,
    ...(zpidRaw !== "" ? { zpid: zpidRaw } : {}),
    ...(mlsRaw !== "" ? { mls_home_id: mlsRaw } : {}),
    address: typeof home.address === "string" ? home.address : undefined,
    description: typeof home.description === "string" ? home.description : undefined,
    price:
      typeof home.price === "string" || typeof home.price === "number"
        ? (home.price as string | number)
        : undefined,
    bedrooms: typeof home.bedrooms === "number" ? home.bedrooms : undefined,
    bathrooms: typeof home.bathrooms === "number" ? home.bathrooms : undefined,
    sqft: typeof home.sqft === "number" ? home.sqft : undefined,
    lot_size:
      typeof home.lot_size === "string" || typeof home.lot_size === "number"
        ? (home.lot_size as string | number)
        : undefined,
    image_url: typeof home.image_url === "string" ? home.image_url : undefined,
    lat: typeof home.lat === "number" ? home.lat : undefined,
    lng: typeof home.lng === "number" ? home.lng : undefined,
  };
}

function parseSharedDocumentSnapshotRecord(
  d: Record<string, unknown>
): SharedDocumentSnapshot | null {
  const id = typeof d.id === "string" ? d.id : "";
  if (!id) return null;
  return {
    id,
    filename: typeof d.filename === "string" ? d.filename : "",
    file_path: typeof d.file_path === "string" ? d.file_path : "",
    status: typeof d.status === "string" ? d.status : "",
    created_at:
      d.created_at === null ? null : typeof d.created_at === "string" ? d.created_at : null,
    updated_at:
      d.updated_at === null ? null : typeof d.updated_at === "string" ? d.updated_at : null,
    user_id: typeof d.user_id === "string" ? d.user_id : "",
    document_type:
      d.document_type === null
        ? null
        : typeof d.document_type === "string"
          ? d.document_type
          : null,
    address: d.address === null ? null : typeof d.address === "string" ? d.address : null,
  };
}

function parseSharedChecklistFormSnapshotRecord(
  cf: Record<string, unknown>
): SharedChecklistFormSnapshot | null {
  const id = typeof cf.id === "string" ? cf.id : "";
  const formKey = typeof cf.form_key === "string" ? cf.form_key : "";
  const title = typeof cf.title === "string" ? cf.title : "";
  const downloadUrl = typeof cf.download_url === "string" ? cf.download_url : "";
  if (!id || !downloadUrl) return null;
  return {
    id,
    form_key: formKey,
    title,
    download_url: downloadUrl,
  };
}

function parseSharedBundleItemRecord(raw: Record<string, unknown>): SharedBundleItemV1 | null {
  const t = raw.type;
  if (t === "home" && raw.home && typeof raw.home === "object") {
    const home = parseSharedHomeSnapshotRecord(raw.home as Record<string, unknown>);
    if (!home) return null;
    return { type: "home", home };
  }
  if (t === "document" && raw.document && typeof raw.document === "object") {
    const document = parseSharedDocumentSnapshotRecord(raw.document as Record<string, unknown>);
    if (!document) return null;
    return { type: "document", document };
  }
  if (t === "checklist_form" && raw.checklistForm && typeof raw.checklistForm === "object") {
    const checklistForm = parseSharedChecklistFormSnapshotRecord(
      raw.checklistForm as Record<string, unknown>
    );
    if (!checklistForm) return null;
    return { type: "checklist_form", checklistForm };
  }
  return null;
}

function parseBundleItemsFromPayload(rec: Record<string, unknown>): SharedBundleItemV1[] | null {
  if (Array.isArray(rec.items)) {
    const items: SharedBundleItemV1[] = [];
    for (const raw of rec.items) {
      if (!raw || typeof raw !== "object") return null;
      const item = parseSharedBundleItemRecord(raw as Record<string, unknown>);
      if (!item) return null;
      items.push(item);
    }
    return items.length >= 2 ? items : null;
  }
  if (Array.isArray(rec.homes)) {
    const items: SharedBundleItemV1[] = [];
    for (const raw of rec.homes) {
      if (!raw || typeof raw !== "object") return null;
      const h = parseSharedHomeSnapshotRecord(raw as Record<string, unknown>);
      if (!h) return null;
      items.push({ type: "home", home: h });
    }
    return items.length >= 2 ? items : null;
  }
  return null;
}

export function parseSharedAttachmentSnapshot(
  content: string | null | undefined
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
      const home = parseSharedHomeSnapshotRecord(rec.home as Record<string, unknown>);
      if (!home) return null;
      return {
        v: 1,
        kind: "home",
        displayLine: typeof rec.displayLine === "string" ? rec.displayLine : home.home_id,
        home,
      };
    }
    if (rec.kind === "bundle") {
      const items = parseBundleItemsFromPayload(rec);
      if (!items) return null;
      return {
        v: 1,
        kind: "bundle",
        displayLine:
          typeof rec.displayLine === "string" ? rec.displayLine : defaultBundleDisplayLine(items),
        items,
      };
    }
    if (rec.kind === "document" && rec.document && typeof rec.document === "object") {
      const d = rec.document as Record<string, unknown>;
      const document = parseSharedDocumentSnapshotRecord(d);
      if (!document) return null;
      return {
        v: 1,
        kind: "document",
        displayLine: typeof rec.displayLine === "string" ? rec.displayLine : document.id,
        document,
      };
    }
    if (
      rec.kind === "checklist_form" &&
      rec.checklistForm &&
      typeof rec.checklistForm === "object"
    ) {
      const checklistForm = parseSharedChecklistFormSnapshotRecord(
        rec.checklistForm as Record<string, unknown>
      );
      if (!checklistForm) return null;
      return {
        v: 1,
        kind: "checklist_form",
        displayLine:
          typeof rec.displayLine === "string"
            ? rec.displayLine
            : checklistForm.title || checklistForm.form_key,
        checklistForm,
      };
    }
  } catch {
    return null;
  }
  return null;
}
