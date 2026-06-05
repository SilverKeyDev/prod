import { useMemo, useState } from "react";

import { useLocalization } from "packages/contexts";
import { color } from "packages/design-tokens";
import { useAdminPartnersList } from "packages/features/partners/hooks/useAdminPartners";
import { useRevShareAnalytics } from "packages/features/partners/hooks/useRevShareAnalytics";
import { DonutChart, VerticalBarChart } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";
import {
  formatCtrPercent,
  formatEstimatedRevenue,
} from "packages/utils/transaction/revShare/revShareRedirectUrl";

import Card from "@/components/layout/Card.web";
import { Dropdown, Label } from "@/components/ui";

const DEVICE_CHART_COLORS = [
  color("brand.accent"),
  color("accent"),
  color("neutral.500"),
  color("accent-muted"),
] as const;

export function AdminPartnersAnalyticsTab() {
  const { t } = useLocalization();
  const { data: partners = [] } = useAdminPartnersList();
  const defaultId = useMemo(() => partners[0]?.id, [partners]);
  const [partnerId, setPartnerId] = useState<string | undefined>(undefined);
  const selectedId = partnerId ?? defaultId;
  const { data: analytics, isLoading } = useRevShareAnalytics(selectedId);

  const partnerOptions = useMemo(
    () => partners.map((p) => ({ value: p.id, label: p.name })),
    [partners]
  );

  const timeSeries = useMemo(() => {
    const points = analytics?.clicks_over_time?.points ?? [];
    return points.map((p) => ({
      label: p.date?.slice(5) ?? "",
      value: p.count ?? 0,
      displayValue: String(p.count ?? 0),
    }));
  }, [analytics]);

  const topAgents = useMemo(() => {
    return (analytics?.top_agents ?? []).slice(0, 8).map((a) => ({
      label: (a.name ?? a.agent_id ?? "").slice(0, 12),
      value: a.clicks ?? 0,
      displayValue: String(a.clicks ?? 0),
    }));
  }, [analytics]);

  const deviceDonut = useMemo(() => {
    return (analytics?.device_breakdown ?? []).map((d, i) => ({
      label: d.device ?? "unknown",
      value: d.count ?? 0,
      color: DEVICE_CHART_COLORS[i % DEVICE_CHART_COLORS.length] ?? color("brand.accent"),
    }));
  }, [analytics]);

  return (
    <Box className="flex flex-col gap-4">
      <Title size="md" as="h2">
        {t("partners.admin.tab.analytics")}
      </Title>
      <Card border="light" padding="md">
        <Label size="sm">{t("partners.admin.analytics.partner")}</Label>
        <Dropdown
          className="mt-1 max-w-md"
          label={t("partners.admin.analytics.partner")}
          hideLabel
          size="sm"
          disabled={partnerOptions.length === 0}
          options={partnerOptions}
          value={selectedId ?? ""}
          onChange={(value) => setPartnerId(value)}
        />
      </Card>

      {isLoading || !analytics ? (
        <BodyText size="sm" muted>
          Loading analytics…
        </BodyText>
      ) : (
        <>
          <Box className="grid gap-3 md:grid-cols-4">
            <Card border="light" padding="md">
              <BodyText size="xs" muted>
                {t("partners.analytics.ctr")}
              </BodyText>
              <Title size="lg">{formatCtrPercent(analytics.click_through_rate)}</Title>
            </Card>
            <Card border="light" padding="md">
              <BodyText size="xs" muted>
                {t("partners.analytics.total_clicks")}
              </BodyText>
              <Title size="lg">{analytics.total_clicks ?? 0}</Title>
            </Card>
            <Card border="light" padding="md">
              <BodyText size="xs" muted>
                {t("partners.analytics.unique_buyers")}
              </BodyText>
              <Title size="lg">{analytics.unique_buyer_clicks ?? 0}</Title>
            </Card>
            <Card border="light" padding="md">
              <BodyText size="xs" muted>
                {t("partners.analytics.estimated_revenue")}
              </BodyText>
              <Title size="lg">{formatEstimatedRevenue(analytics.estimated_revenue ?? 0)}</Title>
              <BodyText size="xs" muted className="mt-1">
                {t("partners.analytics.estimated_disclaimer")}
              </BodyText>
            </Card>
          </Box>

          <Card border="light" padding="lg">
            <Title size="sm" as="h3" className="mb-3">
              {t("partners.analytics.clicks_over_time")}
            </Title>
            <VerticalBarChart data={timeSeries} />
          </Card>

          <Box className="grid gap-4 lg:grid-cols-2">
            <Card border="light" padding="lg">
              <Title size="sm" as="h3" className="mb-3">
                {t("partners.analytics.top_agents")}
              </Title>
              <VerticalBarChart data={topAgents} />
            </Card>
            <Card border="light" padding="lg">
              <Title size="sm" as="h3" className="mb-3">
                Devices
              </Title>
              <DonutChart data={deviceDonut} />
            </Card>
          </Box>

          <Card border="light" padding="lg" className="overflow-x-auto">
            <Title size="sm" as="h3" className="mb-3">
              {t("partners.analytics.recent_clicks")}
            </Title>
            <table className="min-w-xl w-full text-left text-sm">
              <thead>
                <tr className="border-border border-b">
                  <th className="py-2 pr-3">Time</th>
                  <th className="py-2 pr-3">Buyer</th>
                  <th className="py-2 pr-3">Agent</th>
                  <th className="py-2">Step</th>
                </tr>
              </thead>
              <tbody>
                {(analytics.recent_clicks ?? []).slice(0, 20).map((c) => (
                  <tr key={c.id} className="border-border/60 border-b">
                    <td className="py-2 pr-3 text-xs">{c.clicked_at}</td>
                    <td className="py-2 pr-3">{c.buyer_name ?? "—"}</td>
                    <td className="py-2 pr-3">{c.agent_name ?? "—"}</td>
                    <td className="py-2 font-mono text-xs">{c.step_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </Box>
  );
}
