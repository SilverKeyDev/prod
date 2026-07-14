/**
 * Pure overview / agent transforms for brokerage analytics (fixture-backed).
 */
import { color } from "packages/design-tokens";
import type {
  BrokerageAnalyticsAgent,
  BrokerageAnalyticsOverview,
} from "packages/features/brokerage/types/analytics";
import {
  closingsTrendForPeriod,
  MONTH_CLOSING_TOTAL,
} from "packages/features/brokerage/utils/analytics/closingsTrend";
import { periodScale, type TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import {
  BROKERAGE_AGENTS_FIXTURE,
  BROKERAGE_ANALYTICS_FIXTURE,
} from "packages/features/brokerage/utils/brokerageAnalyticsFixtures";

/** Prior-period ratio vs current (demo MoM / prior-window lift from closings). */
const PRIOR_PERIOD_RATIO = 1845 / 1854;

const AGENT_STATUS_BASE_TOTAL = 100;

const OVERVIEW_MONTH = {
  closingsThisMonth: MONTH_CLOSING_TOTAL,
  closingsLastMonth: 1845,
  openTransactions: 2455,
  atRiskCount: 44,
  activeAgents: 500,
  activeClientsThisMonth: 2655,
  activeClientsLastMonth: 2535,
};

function agentStatusForPeriod(period: TimePeriod) {
  const total = Math.max(1, Math.round(AGENT_STATUS_BASE_TOTAL * periodScale(period)));
  const top = Math.round(total * 0.2);
  const atRisk = Math.round(total * 0.09);
  const healthy = total - top - atRisk;
  return [
    { label: "Top Performer", value: top, color: color("state.success.DEFAULT") },
    { label: "Healthy", value: healthy, color: color("chart.1") },
    { label: "At Risk", value: atRisk, color: color("state.danger.DEFAULT") },
  ];
}

function overviewForPeriod(period: TimePeriod) {
  const base = BROKERAGE_ANALYTICS_FIXTURE.overview;
  const scale = periodScale(period);
  return {
    ...base,
    closingsThisMonth: Math.round(OVERVIEW_MONTH.closingsThisMonth * scale),
    closingsLastMonth: Math.round(OVERVIEW_MONTH.closingsLastMonth * scale),
    openTransactions: OVERVIEW_MONTH.openTransactions,
    atRiskCount: OVERVIEW_MONTH.atRiskCount,
    activeAgents: OVERVIEW_MONTH.activeAgents,
    activeClientsThisMonth: Math.round(OVERVIEW_MONTH.activeClientsThisMonth * scale),
    activeClientsLastMonth: Math.round(OVERVIEW_MONTH.activeClientsLastMonth * scale),
  };
}

function funnelForPeriod(period: TimePeriod) {
  const scale = periodScale(period);
  return BROKERAGE_ANALYTICS_FIXTURE.transactionFunnel.map((stage) => ({
    ...stage,
    count: Math.round(stage.count * scale),
    weightedForecast: Math.round(stage.weightedForecast * scale),
  }));
}

function productionForPeriod(period: TimePeriod) {
  const scale = periodScale(period);
  const base = BROKERAGE_ANALYTICS_FIXTURE.production;
  return {
    volumeByStatus: base.volumeByStatus.map((row) => ({
      ...row,
      volumeDollars: Math.round(row.volumeDollars * scale),
      count: Math.round(row.count * scale),
    })),
    gci: {
      closed: Math.round(base.gci.closed * scale),
      pending: Math.round(base.gci.pending * scale),
      projected: Math.round(base.gci.projected * scale),
      avgCommissionPerSide: base.gci.avgCommissionPerSide,
    },
    pricing: base.pricing,
    goals: {
      volumeTarget: Math.round(base.goals.volumeTarget * scale),
      volumeActual: Math.round(base.goals.volumeActual * scale),
      gciTarget: Math.round(base.goals.gciTarget * scale),
      gciActual: Math.round(base.goals.gciActual * scale),
      attachTargetPercent: base.goals.attachTargetPercent,
      attachActualPercent: base.goals.attachActualPercent,
    },
    officeRollups: base.officeRollups.map((office) => ({
      ...office,
      volumeClosed: Math.round(office.volumeClosed * scale),
      volumePending: Math.round(office.volumePending * scale),
      volumeActive: Math.round(office.volumeActive * scale),
      gciClosed: Math.round(office.gciClosed * scale),
      gciPending: Math.round(office.gciPending * scale),
      closings: Math.round(office.closings * scale),
    })),
  };
}

function scaleBreakdown(
  items: { label: string; value: number }[],
  period: TimePeriod
): { label: string; value: number }[] {
  const scale = periodScale(period);
  return items.map((item) => ({ ...item, value: Math.round(item.value * scale) }));
}

/** Pure builder exported for period-matrix unit tests. */
export function buildBrokerageAnalyticsData(period: TimePeriod): BrokerageAnalyticsOverview {
  return {
    ...BROKERAGE_ANALYTICS_FIXTURE,
    overview: overviewForPeriod(period),
    closingsTrend: closingsTrendForPeriod(period),
    transactionFunnel: funnelForPeriod(period),
    production: productionForPeriod(period),
    agentStatusBreakdown: agentStatusForPeriod(period),
    propertyClassBreakdown: scaleBreakdown(
      BROKERAGE_ANALYTICS_FIXTURE.propertyClassBreakdown,
      period
    ),
    transactionSideBreakdown: scaleBreakdown(
      BROKERAGE_ANALYTICS_FIXTURE.transactionSideBreakdown,
      period
    ),
  };
}

export function buildBrokerageAgents(period: TimePeriod): BrokerageAnalyticsAgent[] {
  const scale = periodScale(period);
  return BROKERAGE_AGENTS_FIXTURE.map((agent) => ({
    ...agent,
    closings: Math.max(1, Math.round(agent.closings * scale)),
    volumeDollars: Math.round(agent.volumeDollars * scale),
    gci: Math.round(agent.gci * scale),
  }));
}

export type OverviewKpiExtras = {
  closedVolumePrior: number;
  pendingVolumePrior: number;
  activeVolumePrior: number;
  gciClosedPrior: number;
  closingsSparkline: number[];
  volumeSparkline: number[];
  clientsSparkline: number[];
};

/**
 * Prior-period production levels + sparkline series for Overview KPI cards.
 * Prior uses the same closings MoM ratio as the snapshot (1845/1854).
 */
export function buildOverviewKpiExtras(
  data: BrokerageAnalyticsOverview,
  period: TimePeriod
): OverviewKpiExtras {
  const closed =
    data.production.volumeByStatus.find((v) => v.status === "closed")?.volumeDollars ?? 0;
  const pending =
    data.production.volumeByStatus.find((v) => v.status === "pending")?.volumeDollars ?? 0;
  const active =
    data.production.volumeByStatus.find((v) => v.status === "active")?.volumeDollars ?? 0;
  const avgSale = data.production.pricing.avgSalePrice;
  const trend = closingsTrendForPeriod(period);
  const closingsSparkline = trend.map((p) => p.value);
  const volumeSparkline = trend.map((p) => Math.round(p.value * avgSale));
  const clientsBase = data.overview.activeClientsThisMonth;
  const clientsSparkline = closingsSparkline.map((c, i) => {
    const ratio = closingsSparkline[closingsSparkline.length - 1] || 1;
    return Math.max(1, Math.round((clientsBase * c) / ratio + (i % 3) * 2));
  });

  return {
    closedVolumePrior: Math.round(closed * PRIOR_PERIOD_RATIO),
    pendingVolumePrior: Math.round(pending * PRIOR_PERIOD_RATIO),
    activeVolumePrior: Math.round(active * PRIOR_PERIOD_RATIO),
    gciClosedPrior: Math.round(data.production.gci.closed * PRIOR_PERIOD_RATIO),
    closingsSparkline,
    volumeSparkline,
    clientsSparkline,
  };
}

/** Filter office rollups for demo office filter (null / "" = all). */
export function filterOfficeRollups<T extends { office: string }>(
  offices: T[],
  officeId: string | null
): T[] {
  if (!officeId) return offices;
  return offices.filter((o) => o.office === officeId);
}

export type OfficeRollupRow = {
  office: string;
  team?: string | null;
  volumeClosed: number;
  volumePending: number;
  volumeActive: number;
  gciClosed: number;
  gciPending: number;
  closings: number;
};

/** Closings share of selected office vs all rollups (1 when unfiltered). */
export function officeClosingsShare(
  offices: readonly OfficeRollupRow[],
  officeId: string | null
): number {
  if (!officeId) return 1;
  const selected = offices.find((o) => o.office === officeId);
  if (!selected) return 0;
  const total = offices.reduce((sum, o) => sum + o.closings, 0);
  if (total <= 0) return 0;
  return selected.closings / total;
}

function scaleInt(value: number, share: number): number {
  return Math.round(value * share);
}

/**
 * Scope overview fixture data to one office for demo filtering.
 * Uses office rollup dollars/closings for production KPIs; scales other series by closings share.
 */
export function applyOfficeFilterToOverview(
  data: BrokerageAnalyticsOverview,
  officeId: string | null
): BrokerageAnalyticsOverview {
  if (!officeId) return data;

  const offices = data.production.officeRollups;
  const selected = offices.find((o) => o.office === officeId);
  if (!selected) {
    return {
      ...data,
      production: { ...data.production, officeRollups: [] },
    };
  }

  const share = officeClosingsShare(offices, officeId);
  const pendingCount =
    data.production.volumeByStatus.find((v) => v.status === "pending")?.count ?? 0;
  const activeCount = data.production.volumeByStatus.find((v) => v.status === "active")?.count ?? 0;

  return {
    ...data,
    overview: {
      ...data.overview,
      activeAgents: Math.max(1, scaleInt(data.overview.activeAgents, share)),
      openTransactions: Math.max(1, scaleInt(data.overview.openTransactions, share)),
      atRiskCount: Math.max(0, scaleInt(data.overview.atRiskCount, share)),
      closingsThisMonth: selected.closings,
      closingsLastMonth: Math.max(0, scaleInt(data.overview.closingsLastMonth, share)),
      activeClientsThisMonth: Math.max(1, scaleInt(data.overview.activeClientsThisMonth, share)),
      activeClientsLastMonth: Math.max(1, scaleInt(data.overview.activeClientsLastMonth, share)),
    },
    transactionFunnel: data.transactionFunnel.map((stage) => ({
      ...stage,
      count: Math.max(0, scaleInt(stage.count, share)),
      weightedForecast: Math.max(0, scaleInt(stage.weightedForecast, share)),
    })),
    production: {
      ...data.production,
      volumeByStatus: [
        {
          status: "closed" as const,
          volumeDollars: selected.volumeClosed,
          count: selected.closings,
        },
        {
          status: "pending" as const,
          volumeDollars: selected.volumePending,
          count: Math.max(0, scaleInt(pendingCount, share)),
        },
        {
          status: "active" as const,
          volumeDollars: selected.volumeActive,
          count: Math.max(0, scaleInt(activeCount, share)),
        },
      ],
      gci: {
        ...data.production.gci,
        closed: selected.gciClosed,
        pending: selected.gciPending,
        projected: Math.max(0, scaleInt(data.production.gci.projected, share)),
      },
      goals: {
        ...data.production.goals,
        volumeTarget: Math.max(0, scaleInt(data.production.goals.volumeTarget, share)),
        volumeActual: selected.volumeClosed,
        gciTarget: Math.max(0, scaleInt(data.production.goals.gciTarget, share)),
        gciActual: selected.gciClosed,
      },
      officeRollups: [selected],
    },
    closingsTrend: data.closingsTrend.map((point) => {
      const value = Math.max(0, scaleInt(point.value, share));
      return { ...point, value, displayValue: String(value) };
    }),
    agentStatusBreakdown: data.agentStatusBreakdown.map((row) => ({
      ...row,
      value: Math.max(0, scaleInt(row.value, share)),
    })),
    propertyClassBreakdown: data.propertyClassBreakdown.map((row) => ({
      ...row,
      value: Math.max(0, scaleInt(row.value, share)),
    })),
    transactionSideBreakdown: data.transactionSideBreakdown.map((row) => ({
      ...row,
      value: Math.max(0, scaleInt(row.value, share)),
    })),
  };
}

/** Scale ancillary dollars/counts by the same office closings share used on Overview. */
export function applyOfficeShareToAncillary<
  T extends {
    total_transactions: number;
    summary: {
      total_leakage_dollars: number;
      opportunity_vs_avg_dollars: number;
      opportunity_vs_high_dollars: number;
      avg_attach_rate_percent: number;
    };
    by_service: Array<
      {
        in_house_count: number;
        outside_count: number;
        leakage_dollars: number;
        opportunity_vs_avg_dollars: number;
        opportunity_vs_high_dollars: number;
      } & Record<string, unknown>
    >;
    by_agent: Array<
      {
        transactions: number;
        total_leakage_dollars: number;
      } & Record<string, unknown>
    >;
  },
>(data: T, share: number): T {
  if (share >= 0.999) return data;
  const s = Math.max(0, Math.min(1, share));
  return {
    ...data,
    total_transactions: Math.max(1, scaleInt(data.total_transactions, s)),
    summary: {
      ...data.summary,
      total_leakage_dollars: scaleInt(data.summary.total_leakage_dollars, s),
      opportunity_vs_avg_dollars: scaleInt(data.summary.opportunity_vs_avg_dollars, s),
      opportunity_vs_high_dollars: scaleInt(data.summary.opportunity_vs_high_dollars, s),
    },
    by_service: data.by_service.map((row) => ({
      ...row,
      in_house_count: Math.max(0, scaleInt(row.in_house_count, s)),
      outside_count: Math.max(0, scaleInt(row.outside_count, s)),
      leakage_dollars: scaleInt(row.leakage_dollars, s),
      opportunity_vs_avg_dollars: scaleInt(row.opportunity_vs_avg_dollars, s),
      opportunity_vs_high_dollars: scaleInt(row.opportunity_vs_high_dollars, s),
    })),
    by_agent: data.by_agent.map((agent) => ({
      ...agent,
      transactions: Math.max(1, scaleInt(agent.transactions, s)),
      total_leakage_dollars: scaleInt(agent.total_leakage_dollars, s),
    })),
  };
}

/** Side-rate check: GCI closed / closed volume (expected ~1.5–1.6%). */
export function closedSideRatePercent(closedVolume: number, gciClosed: number): number {
  if (closedVolume <= 0) return 0;
  return (gciClosed / closedVolume) * 100;
}
