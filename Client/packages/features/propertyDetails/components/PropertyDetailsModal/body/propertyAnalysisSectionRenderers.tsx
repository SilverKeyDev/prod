import React from "react";

import { LabeledBarRow } from "packages/features/propertyDetails/components/visualizations";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Title from "packages/ui/components/text/Title";
import { formatAnalysisLabel } from "packages/utils/propertyDetails";

function parseDisplayNumber(
  value: unknown,
): { num: number; display: string } | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return { num: value, display: value.toLocaleString() };
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    const hasPct = trimmed.includes("%");
    const n = parseFloat(trimmed.replace(/%/g, "").replace(/,/g, ""));
    if (!Number.isFinite(n)) return null;
    return { num: n, display: hasPct ? `${n}%` : trimmed };
  }
  return null;
}

/**
 * When every scalar looks like a share or percentage (0–100 or 0–1), render bars.
 * Skips mixed records (e.g. year + score) so we do not mis-chart non-comparable fields.
 */
function tryRenderPercentageBarGrid(
  data: Record<string, unknown>,
): React.ReactNode | null {
  const entries = Object.entries(data).filter(
    ([, v]) => v !== null && v !== undefined && v !== "",
  );
  if (entries.length < 2) return null;

  const parsed: { key: string; num: number; display: string }[] = [];
  for (const [key, value] of entries) {
    if (Array.isArray(value) || (typeof value === "object" && value !== null))
      return null;
    const p = parseDisplayNumber(value);
    if (!p) return null;
    parsed.push({ key, num: p.num, display: p.display });
  }

  const nums = parsed.map((p) => p.num);
  const allUnitInterval = nums.every((n) => n >= 0 && n <= 1);
  const allPercentScale = nums.every((n) => n >= 0 && n <= 100);
  if (!allUnitInterval && !allPercentScale) return null;

  const maxForBar = allUnitInterval
    ? Math.max(...nums.map((n) => n * 100), 1e-6)
    : Math.max(...nums, 1e-6);

  return (
    <Box className="space-y-3">
      {parsed.map(({ key, num, display }) => {
        const scaled = allUnitInterval ? num * 100 : num;
        const fillRatio = scaled / maxForBar;
        const valueText =
          allUnitInterval && !display.includes("%")
            ? `${Math.round(num * 100)}%`
            : display.includes("%")
              ? display
              : `${Math.round(num)}%`;
        return (
          <LabeledBarRow
            key={key}
            label={formatAnalysisLabel(key)}
            valueText={valueText}
            fillRatio={Number.isFinite(fillRatio) ? fillRatio : 0}
          />
        );
      })}
    </Box>
  );
}

/**
 * Exactly two large numeric scalars (e.g. money) — “affordability style” hero pair.
 * Avoids stealing true 0–100 pairs that should stay as percentage bars.
 */
function tryRenderHeroNumberPair(
  data: Record<string, unknown>,
): React.ReactNode | null {
  const entries = Object.entries(data).filter(
    ([, v]) => v !== null && v !== undefined && v !== "",
  );
  if (entries.length !== 2) return null;

  const parsed: { key: string; display: string }[] = [];
  for (const [key, value] of entries) {
    if (Array.isArray(value) || (typeof value === "object" && value !== null))
      return null;
    const p = parseDisplayNumber(value);
    if (!p) return null;
    const str = typeof value === "string" ? value : "";
    const heroEligible = str.includes("$") || p.num > 100;
    if (!heroEligible) return null;
    parsed.push({
      key,
      display: str.includes("$")
        ? str.trim()
        : p.num >= 1000
          ? p.num.toLocaleString()
          : String(p.display),
    });
  }

  return (
    <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {parsed.map(({ key, display }) => (
        <Box
          key={key}
          className="border-border-card bg-bg-card-subtle rounded-xl border px-4 py-4 text-center sm:text-left"
        >
          <BodyText
            as="p"
            size="xs"
            className="text-text-secondary mb-1 font-medium uppercase tracking-wide"
          >
            {formatAnalysisLabel(key)}
          </BodyText>
          <Title as="p" size="md" className="text-text-primary font-bold">
            {display}
          </Title>
        </Box>
      ))}
    </Box>
  );
}

export function renderGenericPropertyAnalysisContent(
  sectionData: unknown,
  noDataLabel: string,
): React.ReactNode {
  if (!sectionData || typeof sectionData !== "object") return null;
  if (Array.isArray(sectionData)) {
    return (
      <Box className="gap-2">
        {sectionData.map((item, i) => (
          <BodyText key={i} as="p" size="sm" className="text-text-secondary">
            {String(item)}
          </BodyText>
        ))}
      </Box>
    );
  }

  const data = sectionData as Record<string, unknown>;
  const entries = Object.entries(data).filter(
    ([, value]) => value !== null && value !== undefined && value !== "",
  );
  if (entries.length === 0) {
    return (
      <BodyText as="p" size="sm" className="text-text-secondary">
        {noDataLabel}
      </BodyText>
    );
  }

  return (
    <Box className="gap-4">
      {entries.map(([key, value]) => {
        const displayKey = formatAnalysisLabel(key);
        if (Array.isArray(value)) {
          return (
            <Box key={key}>
              <BodyText
                as="p"
                size="sm"
                className="text-text-secondary mb-2 font-medium"
              >
                {displayKey}
              </BodyText>
              <Box className="text-text-secondary ml-4 flex flex-col gap-1 text-sm">
                {value.map((item, i) => (
                  <BodyText
                    key={i}
                    as="span"
                    className="text-text-secondary text-sm"
                  >
                    • {String(item)}
                  </BodyText>
                ))}
              </Box>
            </Box>
          );
        }
        if (typeof value === "object" && value !== null) {
          return (
            <Box
              key={key}
              className="border-border bg-accent-muted rounded-lg border p-3"
            >
              <BodyText
                as="p"
                size="sm"
                className="text-text-secondary mb-2 font-medium"
              >
                {displayKey}
              </BodyText>
              <Box className="gap-2">
                {Object.entries(value as Record<string, unknown>).map(
                  ([subKey, subValue]) => (
                    <Box key={subKey}>
                      <BodyText
                        as="span"
                        className="text-text-secondary text-sm font-medium"
                      >
                        {formatAnalysisLabel(subKey)}
                      </BodyText>
                      <BodyText
                        as="span"
                        className="text-text-secondary text-sm"
                      >
                        {String(subValue)}
                      </BodyText>
                    </Box>
                  ),
                )}
              </Box>
            </Box>
          );
        }
        return (
          <Box key={key} className="gap-1">
            <BodyText
              as="span"
              className="text-text-secondary text-sm font-medium"
            >
              {displayKey}
            </BodyText>
            <BodyText as="span" className="text-text-secondary text-sm">
              {String(value)}
            </BodyText>
          </Box>
        );
      })}
    </Box>
  );
}

type SectionRenderer = (
  data: unknown,
  noDataLabel: string,
) => React.ReactNode | null;

/**
 * Explicit renderers keyed by **stable** `sectionKey` values from the property analysis payload.
 *
 * Policy: add at most one or two entries here when the backend guarantees a fixed key and a
 * consistent object shape (e.g. a known map of percentages). Otherwise rely on
 * `tryRenderPercentageBarGrid`, `tryRenderHeroNumberPair`, and `renderGenericPropertyAnalysisContent`
 * so we do not mis-render arbitrary records. Document each key’s expected shape in the entry comment.
 */
const SECTION_RENDERERS: Record<string, SectionRenderer> = {};

export function renderPropertyAnalysisSectionBody(
  sectionKey: string,
  sectionData: unknown,
  noDataLabel: string,
): React.ReactNode {
  const explicit = SECTION_RENDERERS[sectionKey];
  if (explicit) {
    const node = explicit(sectionData, noDataLabel);
    if (node !== null) return node;
  }

  if (
    sectionData &&
    typeof sectionData === "object" &&
    !Array.isArray(sectionData)
  ) {
    const record = sectionData as Record<string, unknown>;
    const bars = tryRenderPercentageBarGrid(record);
    if (bars) return bars;
    const hero = tryRenderHeroNumberPair(record);
    if (hero) return hero;
  }

  return renderGenericPropertyAnalysisContent(sectionData, noDataLabel);
}
