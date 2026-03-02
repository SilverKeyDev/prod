import {
  CHECKLIST_SUBTITLES,
  CHECKLIST_TITLES,
} from "packages/features/checklists/types/checklists";

import CloseLayout from "@/features/checklists/components/CloseLayout";

type ClosePageHeaderData = {
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  loading: boolean;
};

type FinancingInsuranceProps = {
  setClosePageHeaderData: React.Dispatch<React.SetStateAction<ClosePageHeaderData | null>>;
};

export default function FinancingInsurance({ setClosePageHeaderData }: FinancingInsuranceProps) {
  return (
    <CloseLayout
      title={CHECKLIST_TITLES.financing}
      subtitle={CHECKLIST_SUBTITLES.financing}
      sectionTitle="Loan & Insurance Tasks"
      apiEndpoint="/api/v1/tasks?type=financing"
      showMinLoadingText={true}
      setClosePageHeaderData={setClosePageHeaderData}
    />
  );
}
