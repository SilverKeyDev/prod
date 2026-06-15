import React from "react";

import {
  CHECKLIST_SUBTITLES,
  CHECKLIST_TITLES,
} from "packages/features/checklists/types/checklists";

import CloseLayout from "@/features/checklists/components/layout/CloseLayout";

type ClosePageHeaderData = {
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  loading: boolean;
};

type ClosingMovingInProps = {
  setClosePageHeaderData: React.Dispatch<React.SetStateAction<ClosePageHeaderData | null>>;
};

export default function ClosingMovingIn({ setClosePageHeaderData }: ClosingMovingInProps) {
  return (
    <CloseLayout
      title={CHECKLIST_TITLES.closing}
      subtitle={CHECKLIST_SUBTITLES.closing}
      sectionTitle="To-Do Items"
      checklistType="closing"
      showLoadingScreen={true}
      setClosePageHeaderData={setClosePageHeaderData}
    />
  );
}
