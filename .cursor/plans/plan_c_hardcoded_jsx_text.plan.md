---
name: ""
overview: ""
todos: []
isProject: false
---

# Plan C: Hardcoded JSX Text — Execution

**Rule:** `silverkey/no-hardcoded-jsx-text`  
**Intent:** User-facing strings must use `t('key')` from `useLocalization()`.

## Audit summary

- **Source:** Full `pnpm lint` run (Client). Rule applies to `apps/web/features/`, `apps/web/pages/`, `apps/web/components/` (excludes `apps/web/components/ui/` and test files).
- **Approximate count:** ~700+ warnings (per parent plan).
- **String layer:** `packages/contexts/translations` — `useLocalization().t(key)`. Keys and English strings live in the translation files; no other languages are required.

## Batching order

1. **High-traffic / legal:** Login, signup, terms, privacy, contact (pages under HomeAuth or auth flows).
2. **Shared components:** Cards (CompCard, ReportCard, documents, base), feedback (ErrorToast, SuccessToast, ValidationWarning), layout.
3. **Modals:** CompareHomesModal, NotInterestedModal, PdfModal, PropertyDetailsModal, ShareHomeModal, NegotiationModal, DeleteModal, etc.
4. **Saved/Documents:** SavedHomesContent, DocumentUpload, SecureFileUpload, SavedPageTabsAndSearch.
5. **Remaining:** Property details sections, other modals, lower-priority screens.

## Per-file pattern

- Ensure `useLocalization` is imported from `packages/contexts` and `const { t } = useLocalization();` is used in the component.
- Replace JSX text nodes and string literals in JSX with `{t('namespace.key')}`.
- Add each new key to `packages/contexts/translations` (English only; no other languages required).
- Non-user-facing (e.g. placeholders for layout, test-only): use `t('...')` with a key anyway for consistency, or document an exception if the rule supports it.

## Exception pattern (if needed)

The rule has schema options: `exceptions.testFiles: true`, `exceptions.uiComponents: false`. No inline-disable pattern is documented; prefer adding keys and using `t()` for all user-visible strings.

## Progress log

### Batch 1 (completed)

- **CompCard.tsx:** Replaced `{" "}` with `{t("cards.space")}` (keys already exist). Lines 124, 138, 152.
- **ErrorToast.tsx:** Added `feedback.error_title`, `feedback.close_aria`; replaced "Error" and aria-label.
- **SuccessToast.tsx:** Added `feedback.success_title`, `feedback.close_aria`; replaced "Success" and aria-label.
- **ValidationWarning.tsx:** Added `validation.complete_required_title`, `validation.complete_required_description`, `validation.required_fields_label`, `validation.issues_to_fix_label`, `validation.review_information`; replaced all five hardcoded strings.
- **DocumentCardHeader.tsx:** Added `documents.uploaded` (with `{{date}}`); replaced "Uploaded {date}".
- **SharedAgreementCard.tsx:** Added `documents.loading_agreement`, `documents.agreement_not_available`; replaced both strings.
- **CardPropertyDetails.tsx** (display): Added `property_details.sq_ft_label`; use existing `cards.na` for "n/a"; replaced "Sq Ft" and "n/a".
- **PdfModalContent.tsx:** Added `pdf.viewer_title`, `pdf.mobile_message`, `pdf.open_in_new_tab`; replaced PDF Viewer title, mobile message, and button text; iframe `title` uses `t("pdf.viewer_title")`.

### Batch 2 (continued)

- **CompareHomesModal:** ComparisonTable ("Comparison"), ManageRowsModal (title, subtitle, Show All, Hide All, Auto-Hide Empty, showing fields, auto_hidden_no_data, manually_enabled), PropertyCardsGrid ("Property Details"), RemainingLikedHomes ("Add more properties to compare"), index (Compare Properties, aria-labels, selected count, no homes selected). All use `compare.`* keys.
- **NotInterestedModal:** Title, Skip, Confirm, help text (why_not.help_understand), reason labels (why_not.reason_* / why_not.other), "Please tell us more", placeholder. Added `why_not.help_understand`, `common.skip`.
- **NegotiationModal:** Header "Negotiate" → `negotiation.title`.
- **PropertyDetailsModal/PropertyAgent:** "Listing Agent" and alt text → `property_details.listing_agent`.
- **SavedPageTabsAndSearch:** "Homes" / "Documents" tab labels → `saved.tab_homes`, `saved.tab_documents`.
- **SavedHomesContent:** Loading documents/homes messages and empty states → `saved.loading_documents`, `saved.no_documents_yet`, `saved.loading_homes`, `saved.no_homes_yet`.

### Remaining (same pattern)

- **PropertyDetailsModal** (remaining sections): PropertyAnalysis, PropertyBasicInfo, PropertyCommute, PropertyFeatures, PropertyHeader, PropertyImageGallery, PropertySchools, sections/info/*, sections/location/*, sections/other/*. Add `property_details.`* keys; replace literals.
- **ShareHomeModal, DocumentUpload, SecureFileUpload:** Add keys per component; replace literals.
- **translations:** Add any new keys to `packages/contexts/translations` (English only) as each file is fixed.

## Success criteria

No (or minimal, explicitly exempted) `silverkey/no-hardcoded-jsx-text` warnings in `apps/web`.