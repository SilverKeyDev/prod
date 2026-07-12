/**
 * Pure overview / agent transforms for brokerage analytics (fixture-backed).
 */
import { color } from "packages/design-tokens";
import type {
  BrokerageAnalyticsAgent,
  BrokerageAnalyticsOverview,
} from "packages/features/brokerage/types/analytics";
import { periodScale, type TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import {
  BROKERAGE_AGENTS_FIXTURE,
  BROKERAGE_ANALYTICS_FIXTURE,
} from "packages/features/brokerage/utils/brokerageAnalyticsFixtures";

const FULL_YEAR_TREND = [
  { label: "Jan", value: 1884, displayValue: "1884" },
  { label: "Feb", value: 1755, displayValue: "1755" },
  { label: "Mar", value: 1921, displayValue: "1921" },
  { label: "Apr", value: 1880, displayValue: "1880" },
  { label: "May", value: 1928, displayValue: "1928" },
  { label: "Jun", value: 1898, displayValue: "1898" },
  { label: "Jul", value: 1935, displayValue: "1935" },
  { label: "Aug", value: 1873, displayValue: "1873" },
  { label: "Sep", value: 1890, displayValue: "1890" },
  { label: "Oct", value: 1913, displayValue: "1913" },
  { label: "Nov", value: 1845, displayValue: "1845" },
  { label: "Dec", value: 1854, displayValue: "1854" },
];

const PREV_YEAR_TREND = [
  { label: "Jan '24", value: 1720, displayValue: "1720" },
  { label: "Feb '24", value: 1640, displayValue: "1640" },
  { label: "Mar '24", value: 1810, displayValue: "1810" },
  { label: "Apr '24", value: 1755, displayValue: "1755" },
  { label: "May '24", value: 1830, displayValue: "1830" },
  { label: "Jun '24", value: 1790, displayValue: "1790" },
  { label: "Jul '24", value: 1870, displayValue: "1870" },
  { label: "Aug '24", value: 1800, displayValue: "1800" },
  { label: "Sep '24", value: 1820, displayValue: "1820" },
  { label: "Oct '24", value: 1855, displayValue: "1855" },
  { label: "Nov '24", value: 1780, displayValue: "1780" },
  { label: "Dec '24", value: 1795, displayValue: "1795" },
];

const FIVE_YEAR_TREND = [...PREV_YEAR_TREND, ...FULL_YEAR_TREND];

const SEVEN_DAY_TREND = [
  { label: "Mon", value: 58, displayValue: "58" },
  { label: "Tue", value: 71, displayValue: "71" },
  { label: "Wed", value: 63, displayValue: "63" },
  { label: "Thu", value: 82, displayValue: "82" },
  { label: "Fri", value: 74, displayValue: "74" },
  { label: "Sat", value: 29, displayValue: "29" },
  { label: "Sun", value: 18, displayValue: "18" },
];

const ONE_MONTH_TREND = Array.from({ length: 31 }, (_, i) => {
  const v = Math.round(55 + Math.sin(i * 0.4) * 12 + (i % 7 < 5 ? 10 : -15));
  return { label: `Dec ${i + 1}`, value: v, displayValue: String(v) };
});

const AGENT_STATUS_BASE_TOTAL = 100;

const OVERVIEW_MONTH = {
  closingsThisMonth: 1854,
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

function trendForPeriod(period: TimePeriod) {
  switch (period) {
    case "week":
      return SEVEN_DAY_TREND;
    case "month":
      return ONE_MONTH_TREND;
    case "year":
      return FULL_YEAR_TREND;
    case "5years":
    case "all":
    default:
      return FIVE_YEAR_TREND;
  }
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
    closingsTrend: trendForPeriod(period),
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
