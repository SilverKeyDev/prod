import { useLocalization } from "packages/contexts";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

/**
 * Brokerage workspace home at `/dashboard/*` when `activeWorkspace === "brokerage"`.
 * Product-specific RESP A / roster modules can replace this placeholder incrementally.
 */
export default function BrokerageDashboardPage() {
  const { t } = useLocalization();
  return (
    <Box className="flex max-w-2xl flex-col gap-4 px-4 py-8">
      <BodyText size="lg" className="font-semibold text-text-primary" as="h1">
        {t("brokerage.dashboard_title")}
      </BodyText>
      <BodyText size="sm" className="text-text-secondary" as="p">
        {t("brokerage.dashboard_subtitle")}
      </BodyText>
    </Box>
  );
}
