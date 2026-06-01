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

type EscrowLegalLogisticsProps = {
  setClosePageHeaderData: React.Dispatch<React.SetStateAction<ClosePageHeaderData | null>>;
};

export default function EscrowLegalLogistics({
  setClosePageHeaderData,
}: EscrowLegalLogisticsProps) {
  return (
    <CloseLayout
      title={CHECKLIST_TITLES.escrow}
      subtitle={CHECKLIST_SUBTITLES.escrow}
      sectionTitle="Legal & Title Tasks"
      apiEndpoint="/api/v1/tasks?type=escrow"
      setClosePageHeaderData={setClosePageHeaderData}
    />
  );
}
