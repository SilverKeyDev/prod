import { DashboardFeature } from "packages/features/dashboard";

type DashboardPageProps = {
  setMobileHeaderActions?: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
};

export default function DashboardPage({ setMobileHeaderActions }: DashboardPageProps) {
  return <DashboardFeature setMobileHeaderActions={setMobileHeaderActions} />;
}
