import { CHECKLIST_SUBTITLES, CHECKLIST_TITLES } from "packages/schemas";

import CloseLayout from "@/features/close/CloseLayout";

type ClosePageHeaderData = {
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  loading: boolean;
};

type InspectionsDueDiligenceProps = {
  setClosePageHeaderData: React.Dispatch<
    React.SetStateAction<ClosePageHeaderData | null>
  >;
};

export default function InspectionsChecklist({
  setClosePageHeaderData,
}: InspectionsDueDiligenceProps) {
  return (
    <CloseLayout
      title={CHECKLIST_TITLES.inspections}
      subtitle={CHECKLIST_SUBTITLES.inspections}
      sectionTitle="To-Do Items"
      apiEndpoint="/api/v1/tasks?type=insurance"
      showLoadingScreen={true}
      setClosePageHeaderData={setClosePageHeaderData}
    />
  );
}
