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

type OfferSectionProps = {
  setClosePageHeaderData?: React.Dispatch<React.SetStateAction<ClosePageHeaderData | null>>;
};

export default function OfferSection({ setClosePageHeaderData }: OfferSectionProps) {
  return (
    <CloseLayout
      title={CHECKLIST_TITLES.offer}
      subtitle={CHECKLIST_SUBTITLES.offer}
      sectionTitle="Offer Tasks"
      checklistType="offer"
      showLoadingScreen={true}
      setClosePageHeaderData={setClosePageHeaderData}
    />
  );
}
