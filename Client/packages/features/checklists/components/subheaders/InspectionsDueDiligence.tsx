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

type InspectionsDueDiligenceProps = {
  setClosePageHeaderData: React.Dispatch<React.SetStateAction<ClosePageHeaderData | null>>;
};

export default function InspectionsChecklist({
  setClosePageHeaderData,
}: InspectionsDueDiligenceProps) {
  return (
    <CloseLayout
      title={CHECKLIST_TITLES.inspections}
      subtitle={CHECKLIST_SUBTITLES.inspections}
      sectionTitle="To-Do Items"
      checklistType="insurance"
      showLoadingScreen={true}
      setClosePageHeaderData={setClosePageHeaderData}
    />
  );
}
