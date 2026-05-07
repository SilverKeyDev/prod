import type { Dispatch, ReactNode, SetStateAction } from "react";

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
  apiEndpoint: string;
  /** @deprecated Items are now fetched from useChecklistData; this prop is ignored. */
  items?: ChecklistCloseLayoutCheckboxItem[];
  children?: ReactNode;
  showLoadingScreen?: boolean;
  containerClassName?: string;
  showMinLoadingText?: boolean;
  setClosePageHeaderData?: Dispatch<SetStateAction<ClosePageHeaderData | null>>;
};

export type ChecklistLayoutDisclosureState = {
  futureOpen: boolean;
  completedOpen: boolean;
};
