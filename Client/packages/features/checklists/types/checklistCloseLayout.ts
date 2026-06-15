import type { Dispatch, ReactNode, SetStateAction } from "react";

import type { ChecklistType } from "packages/features/checklists/api/checklists";

export type ChecklistResourceLink = {
  label: string;
  href?: string;
};

/** Shape passed to shared ChecklistCheckbox for close-layout checklist rows */
export type ChecklistCloseLayoutCheckboxItem = {
  id: number;
  label: string;
  explanation: string;
  bullets?: string[];
  tip?: string;
  resource?: ChecklistResourceLink;
  optional?: boolean;
};

export type ClosePageHeaderData = {
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  loading: boolean;
};

export type CloseLayoutProps = {
  title: string;
  subtitle: string;
  sectionTitle: string;
  /** Checklist API `type` query value (transaction-scoped routes). */
  checklistType?: ChecklistType;
  /**
   * @deprecated Use `checklistType`. Parsed when `checklistType` is omitted (legacy Close subheaders).
   */
  apiEndpoint?: string;
  /** @deprecated Items are now fetched from useChecklistData; this prop is ignored. */
  items?: ChecklistCloseLayoutCheckboxItem[];
  children?: ReactNode;
  showLoadingScreen?: boolean;
  containerClassName?: string;
  showMinLoadingText?: boolean;
  setClosePageHeaderData?: Dispatch<SetStateAction<ClosePageHeaderData | null>>;
  /** Buyer user id or transaction id for rev-share placements (defaults to auth user). */
  transactionId?: string | null;
};

export type ChecklistLayoutDisclosureState = {
  futureOpen: boolean;
  completedOpen: boolean;
};
