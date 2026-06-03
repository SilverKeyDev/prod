import type { SavedHome } from "packages/types/domain/savedHome";
import type { DocumentData } from "packages/ui/components/cards/document/types";
import type { HomeDescription } from "packages/ui/components/cards/HomeCard";

import { parseSharedAttachmentSnapshot } from "./sharedAttachmentSnapshot.parse";
import type {
  SharedChecklistFormSnapshot,
  SharedDocumentSnapshot,
  SharedHomeSnapshot,
} from "./sharedAttachmentSnapshot.types";

function documentDataFromSnapshot(s: SharedDocumentSnapshot): DocumentData {
  return {
    id: s.id,
    filename: s.filename,
    file_path: s.file_path,
    status: s.status,
    created_at: s.created_at,
    updated_at: s.updated_at,
    user_id: s.user_id,
    document_type: s.document_type,
    address: s.address,
  };
}

export function mergeSharedHomeForDisplay(
  sharedHomeId: string,
  content: string,
  getSavedHome: (id: string) => SavedHome | undefined
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

/** Merges each home item in a bundle snapshot with saved-homes cache (snapshot wins). */
export function mergeBundleHomesForDisplay(
  content: string,
  getSavedHome: (id: string) => SavedHome | undefined
): HomeDescription[] {
  const snapshot = parseSharedAttachmentSnapshot(content);
  if (snapshot?.kind !== "bundle") return [];
  return snapshot.items
    .filter((i): i is { type: "home"; home: SharedHomeSnapshot } => i.type === "home")
    .map((item) => {
      const snapHome = item.home;
      const saved = getSavedHome(snapHome.home_id);
      if (!saved) {
        return {
          ...snapHome,
          home_id: snapHome.home_id,
        } as HomeDescription;
      }
      return {
        ...saved,
        ...snapHome,
        home_id: snapHome.home_id,
      };
    });
}

/** Merges each document item in a bundle with the live document list (live wins for mutable fields). */
export function mergeBundleDocumentsForDisplay(
  content: string,
  documents: DocumentData[]
): DocumentData[] {
  const snapshot = parseSharedAttachmentSnapshot(content);
  if (snapshot?.kind !== "bundle") return [];
  return snapshot.items
    .filter(
      (i): i is { type: "document"; document: SharedDocumentSnapshot } => i.type === "document"
    )
    .map((item) => {
      const snapDoc = item.document;
      const live = documents.find((d) => d.id === snapDoc.id);
      if (live) {
        return { ...documentDataFromSnapshot(snapDoc), ...live };
      }
      return documentDataFromSnapshot(snapDoc);
    });
}

export function mergeBundleChecklistFormsForDisplay(
  content: string
): SharedChecklistFormSnapshot[] {
  const snapshot = parseSharedAttachmentSnapshot(content);
  if (snapshot?.kind !== "bundle") return [];
  return snapshot.items
    .filter(
      (
        i
      ): i is {
        type: "checklist_form";
        checklistForm: SharedChecklistFormSnapshot;
      } => i.type === "checklist_form"
    )
    .map((i) => i.checklistForm);
}

export function mergeSharedDocumentForDisplay(
  content: string,
  sharedDocumentId: string,
  documents: DocumentData[]
): DocumentData | null {
  const snapshot = parseSharedAttachmentSnapshot(content);
  const snapDoc = snapshot?.kind === "document" ? snapshot.document : undefined;
  const live = documents.find((d) => d.id === sharedDocumentId);
  if (live) {
    return { ...(snapDoc ? documentDataFromSnapshot(snapDoc) : {}), ...live };
  }
  if (snapDoc) {
    return documentDataFromSnapshot(snapDoc);
  }
  return null;
}
