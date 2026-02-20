import React from "react";

import { CHECKLIST_SUBTITLES, CHECKLIST_TITLES } from "packages/schemas";

import CloseLayout from "@/features/close/CloseLayout";
import HomeConcierge from "@/features/close/HomeConcierge";

type ClosePageHeaderData = {
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  loading: boolean;
};

type ClosingMovingInProps = {
  setClosePageHeaderData: React.Dispatch<
    React.SetStateAction<ClosePageHeaderData | null>
  >;
};

export default function ClosingMovingIn({
  setClosePageHeaderData,
}: ClosingMovingInProps) {
  return (
    <CloseLayout
      title={CHECKLIST_TITLES.closing}
      subtitle={CHECKLIST_SUBTITLES.closing}
      sectionTitle="To-Do Items"
      apiEndpoint="/api/v1/tasks?type=closing"
      showLoadingScreen={true}
      setClosePageHeaderData={setClosePageHeaderData}
    >
      <HomeConcierge />
    </CloseLayout>
  );
}
