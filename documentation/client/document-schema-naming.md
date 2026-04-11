# Document-related API and type names

The word “document” is overloaded in the product. OpenAPI and client types use **distinct schema names** so pipeline uploads, Saved/library rows, dashboard workflow docs, offer-generated files, and property reports are not confused.

## OpenAPI schema map

| Schema | Meaning | Typical API / usage |
|--------|---------|---------------------|
| **`UploadedDocumentRecord`** | Row in the `documents` table: stored file + pipeline status (`uploaded`, `processing`, `processed`, `error`, `generating`, …). | `GET /api/v1/report/documents`, report attachments, `DocumentsResponse.documents`. |
| **`DocumentLibraryListItem`** | Unified Saved / document library row (upload **or** DocuSign agreement); includes `library_item_id`, `library_kind`. | `GET /api/v1/report/document-library`. |
| **`WorkflowDocumentRecord`** | Buyer/agent **workflow** document on the dashboard: review, signing, expiry; status `pending` \| `approved` \| `rejected` \| `expired`. | Nested in `DashboardResponse.document` (PATCH/POST document flows). |
| **`OfferDocumentGenerationResponse`** | Result of **generating** an offer artifact (URL + ids), not a persisted workflow or upload row. | Offer endpoints (pre-approval letter, earnest money, cover letter). |
| **`ReportListItem`** | Property PDF report list entry (`generatedAt`, `pdfUrl`, …). | `GET /api/v1/report/list`. |
| **`LinkDocumentResponse`** | Checklist link operation envelope. | Checklist document linking. |

SQLAlchemy models keep table names (`Document`, `DocumentLibraryItem`); API payloads use the schema names above.

## Client TypeScript

- **`WorkflowDocumentRecord`** — OpenAPI shape (ISO date strings).
- **`WorkflowDocument`** — Same fields with `uploaded_at` / `expiry_date` as `Date` for store/UI (`packages/features/documents/types/documents.ts`).
- **`ReportDocument`** — Alias in `report.ts` for `UploadedDocumentRecord` where the list is report-scoped.
- Prefer **`DocumentLibraryListItem`** from `documentLibrary.ts` for the unified library.

## Migration notes (rename summary)

- **`DocumentReviewRecord`** → **`WorkflowDocumentRecord`** (file: `WorkflowDocumentRecord.yaml`).
- **`DocumentResponse`** (offer generation) → **`OfferDocumentGenerationResponse`** (file: `offers/OfferDocumentGenerationResponse.yaml`).
- Removed the hand-written `Document` type that duplicated the old review record; use **`WorkflowDocument`** / **`WorkflowDocumentRecord`**.
- **`components["schemas"]["Document"]`** in `dashboard.ts` was invalid (no such schema); it now points to **`WorkflowDocumentRecord`**.

After changing schemas, regenerate:

- Client: `pnpm generate:api-types` (from `Client/`).
- Server: `bash scripts/generate-pydantic-models.sh` (from `Server/`).
