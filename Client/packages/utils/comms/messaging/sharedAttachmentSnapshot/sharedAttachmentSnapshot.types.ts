/**
 * Types and version prefix for shared attachment snapshots embedded in chat text.
 * See `index.ts` in this folder for build/parse/merge APIs.
 */

export const SHARED_ATTACHMENT_PREFIX = "__SK_SHARE__";

export type SharedHomeSnapshot = {
  home_id: string;
  /** Provider listing id (e.g. Zillow zpid) so recipients can open details without saved-home cache. */
  zpid?: string;
  mls_home_id?: string;
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

/** Checklist template form shared from agent checklist step (presigned PDF URL). */
export type SharedChecklistFormSnapshot = {
  id: string;
  form_key: string;
  title: string;
  download_url: string;
};

/** One entry inside a `kind: "bundle"` payload (homes, documents, or other attachables). */
export type SharedBundleItemV1 =
  | { type: "home"; home: SharedHomeSnapshot }
  | { type: "document"; document: SharedDocumentSnapshot }
  | { type: "checklist_form"; checklistForm: SharedChecklistFormSnapshot };

export type SharedAttachmentSnapshotV1 =
  | {
      v: 1;
      kind: "home";
      displayLine: string;
      home: SharedHomeSnapshot;
    }
  | {
      v: 1;
      kind: "bundle";
      displayLine: string;
      items: SharedBundleItemV1[];
    }
  | {
      v: 1;
      kind: "document";
      displayLine: string;
      document: SharedDocumentSnapshot;
    }
  | {
      v: 1;
      kind: "checklist_form";
      displayLine: string;
      checklistForm: SharedChecklistFormSnapshot;
    };
