import { useEffect } from "react";

import { DashboardFeature } from "packages/features/dashboard";
import { useNavigation } from "packages/navigation";
import { shellRoutePageMounted } from "packages/utils/core/perf/shellRouteLoadTiming";

type DashboardPageProps = {
  setMobileHeaderActions?: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
};

export default function DashboardPage({ setMobileHeaderActions }: DashboardPageProps) {
  const { getCurrentRoute } = useNavigation();
  const pathname = getCurrentRoute().pathname;

  useEffect(() => {
    shellRoutePageMounted("dashboard", pathname);
  }, [pathname]);

  return <DashboardFeature setMobileHeaderActions={setMobileHeaderActions} />;
}
