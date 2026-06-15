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

type SearchSectionProps = {
  setClosePageHeaderData?: React.Dispatch<React.SetStateAction<ClosePageHeaderData | null>>;
};

export default function SearchSection({ setClosePageHeaderData }: SearchSectionProps) {
  return (
    <CloseLayout
      title={CHECKLIST_TITLES.search}
      subtitle={CHECKLIST_SUBTITLES.search}
      sectionTitle="Search Tasks"
      checklistType="search"
      showLoadingScreen={true}
      setClosePageHeaderData={setClosePageHeaderData}
    />
  );
}
