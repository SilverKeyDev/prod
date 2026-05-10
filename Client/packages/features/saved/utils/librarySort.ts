import type { DocumentData, SavedPageViewType } from "packages/features/documents";
import type { LibraryPersistSection } from "packages/features/saved/hooks/ui/useLibraryViewMode";
import type { SavedHome } from "packages/types";
import { dateParseISO } from "packages/utils/date";

export const LIBRARY_HOMES_SORT_DEFAULT = "date_desc";
export const LIBRARY_DOCUMENTS_SORT_DEFAULT = "date_desc";
export const LIBRARY_DOCUSIGN_SORT_DEFAULT = "date_desc";

const HOMES_SORT_IDS = new Set(["date_desc", "date_asc", "price_asc", "price_desc", "address_asc"]);

const DOCUMENTS_SORT_IDS = new Set(["date_desc", "date_asc", "name_asc"]);

const DOCUSIGN_SORT_IDS = new Set([
  "date_desc",
  "date_asc",
  "stage:draft",
  "stage:sent",
  "stage:delivered",
  "stage:signed",
  "stage:completed",
  "stage:voided",
  "stage:declined",
]);

export function normalizeLibrarySortValue(
  section: LibraryPersistSection,
  raw: string | null | undefined
): string {
  const v = typeof raw === "string" ? raw : "";
  if (section === "homes" && HOMES_SORT_IDS.has(v)) return v;
  if (section === "documents" && DOCUMENTS_SORT_IDS.has(v)) return v;
  if (section === "docusign" && DOCUSIGN_SORT_IDS.has(v)) return v;
  if (section === "homes") return LIBRARY_HOMES_SORT_DEFAULT;
  if (section === "documents") return LIBRARY_DOCUMENTS_SORT_DEFAULT;
  return LIBRARY_DOCUSIGN_SORT_DEFAULT;
}

function docTimestampMs(doc: DocumentData): number {
  const v = doc.created_at ?? doc.updated_at;
  if (v == null || v === "") return 0;
  return typeof v === "number" ? v : dateParseISO(v).valueOf();
}

function homeTimestampMs(home: SavedHome): number {
  const v = home.created_at ?? home.updated_at;
  if (v == null || v === "") return 0;
  return dateParseISO(v).valueOf();
}

function numericPriceFromSavedHome(home: SavedHome): number {
  const p = typeof home.price === "string" ? home.price : "";
  const digits = p.replace(/[^\d.]/g, "");
  const n = Number.parseFloat(digits);
  return Number.isFinite(n) ? n : -1;
}

export function sortSavedHomesForLibrary(homes: SavedHome[], sortId: string): SavedHome[] {
  const key = HOMES_SORT_IDS.has(sortId) ? sortId : LIBRARY_HOMES_SORT_DEFAULT;
  const copy = [...homes];
  copy.sort((a, b) => {
    if (key === "price_asc" || key === "price_desc") {
      const pa = numericPriceFromSavedHome(a);
      const pb = numericPriceFromSavedHome(b);
      const cmp = pa - pb;
      return key === "price_asc" ? cmp : -cmp;
    }
    if (key === "address_asc") {
      const aa = (a.address || a.description || "").toLowerCase();
      const ab = (b.address || b.description || "").toLowerCase();
      return aa.localeCompare(ab);
    }
    const ta = homeTimestampMs(a);
    const tb = homeTimestampMs(b);
    return key === "date_asc" ? ta - tb : tb - ta;
  });
  return copy;
}

export function sortDocumentsForLibrary(documents: DocumentData[], sortId: string): DocumentData[] {
  const key = DOCUMENTS_SORT_IDS.has(sortId) ? sortId : LIBRARY_DOCUMENTS_SORT_DEFAULT;
  const copy = [...documents];
  copy.sort((a, b) => {
    if (key === "name_asc") {
      return (a.filename || "").toLowerCase().localeCompare((b.filename || "").toLowerCase());
    }
    const ta = docTimestampMs(a);
    const tb = docTimestampMs(b);
    return key === "date_asc" ? ta - tb : tb - ta;
  });
  return copy;
}

function agreementStatusNorm(doc: DocumentData): string {
  return (doc.status ?? "").trim().toLowerCase();
}

export function sortAndFilterAgreementsForLibrary(
  agreements: DocumentData[],
  sortId: string
): DocumentData[] {
  const key = DOCUSIGN_SORT_IDS.has(sortId) ? sortId : LIBRARY_DOCUSIGN_SORT_DEFAULT;
  let list = [...agreements];
  if (key.startsWith("stage:")) {
    const stage = key.slice("stage:".length).toLowerCase();
    list = list.filter((d) => agreementStatusNorm(d) === stage);
  }
  const dateKey = key.startsWith("stage:") ? "date_desc" : key;
  list.sort((a, b) => {
    const ta = docTimestampMs(a);
    const tb = docTimestampMs(b);
    return dateKey === "date_asc" ? ta - tb : tb - ta;
  });
  return list;
}

export type LibrarySortOption = { value: string; labelKey: string };

export function librarySortOptionsForView(viewType: SavedPageViewType): LibrarySortOption[] {
  if (viewType === "forms-library") return [];
  if (viewType === "homes") {
    return [
      { value: "date_desc", labelKey: "saved.library_sort_homes_newest" },
      { value: "date_asc", labelKey: "saved.library_sort_homes_oldest" },
      { value: "price_asc", labelKey: "saved.library_sort_homes_price_low" },
      { value: "price_desc", labelKey: "saved.library_sort_homes_price_high" },
      { value: "address_asc", labelKey: "saved.library_sort_homes_address" },
    ];
  }
  if (viewType === "documents") {
    return [
      { value: "date_desc", labelKey: "saved.library_sort_docs_newest" },
      { value: "date_asc", labelKey: "saved.library_sort_docs_oldest" },
      { value: "name_asc", labelKey: "saved.library_sort_docs_name" },
    ];
  }
  return [
    { value: "date_desc", labelKey: "saved.library_sort_docusign_newest" },
    { value: "date_asc", labelKey: "saved.library_sort_docusign_oldest" },
    { value: "stage:draft", labelKey: "saved.library_sort_docusign_stage_draft" },
    { value: "stage:sent", labelKey: "saved.library_sort_docusign_stage_sent" },
    { value: "stage:delivered", labelKey: "saved.library_sort_docusign_stage_delivered" },
    { value: "stage:signed", labelKey: "saved.library_sort_docusign_stage_signed" },
    { value: "stage:completed", labelKey: "saved.library_sort_docusign_stage_completed" },
    { value: "stage:voided", labelKey: "saved.library_sort_docusign_stage_voided" },
    { value: "stage:declined", labelKey: "saved.library_sort_docusign_stage_declined" },
  ];
}
