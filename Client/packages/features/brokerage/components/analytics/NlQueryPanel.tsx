import { useMemo, useState } from "react";

import { AnalyticsBarChart } from "packages/features/brokerage/components/charts";
import { useBrokerageNlQuery } from "packages/features/brokerage/hooks/useBrokerageNlQuery";
import {
  buildNlTableColumns,
  type NlQueryRow,
  selectNlBarSeries,
} from "packages/features/brokerage/utils/analytics/nlQueryTransforms";
import { Button, Input } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

import { AnalyticsDataTable } from "./AnalyticsDataTable";
import { SectionCard } from "./AnalyticsShellShared";

const EXAMPLE = "closed transactions by agent last quarter";

export function NlQueryPanel() {
  const [question, setQuestion] = useState(EXAMPLE);
  const mutation = useBrokerageNlQuery();

  const result = mutation.data;
  const bars = useMemo(() => (result ? selectNlBarSeries(result) : null), [result]);
  const columns = useMemo(() => (result ? buildNlTableColumns(result.columns) : []), [result]);

  const errorMessage =
    mutation.error instanceof Error
      ? mutation.error.message
      : mutation.isError
        ? "Unable to answer this question"
        : null;

  return (
    <Box className="flex flex-col gap-4" data-testid="analytics-ask-panel">
      <SectionCard>
        <Title size="sm" as="h2">
          Ask your brokerage data
        </Title>
        <BodyText size="sm" muted className="mt-1">
          Plain English, read-only. Example: &ldquo;{EXAMPLE}&rdquo;
        </BodyText>
        <Box className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Box className="min-w-0 flex-1">
            <Input
              label="Question"
              value={question}
              onValueChange={setQuestion}
              placeholder={EXAMPLE}
            />
          </Box>
          <Button
            variant="primary"
            size="md"
            disabled={!question.trim() || mutation.isPending}
            onPress={() => mutation.mutate(question.trim())}
          >
            {mutation.isPending ? "Running…" : "Ask"}
          </Button>
        </Box>
        {errorMessage ? (
          <BodyText size="sm" className="text-state-danger mt-3" role="alert">
            {errorMessage}
          </BodyText>
        ) : null}
      </SectionCard>

      {result ? (
        <SectionCard>
          <Title size="sm" as="h3">
            Results
          </Title>
          <BodyText size="xs" muted className="mt-1 font-mono">
            {result.sql}
          </BodyText>

          {bars ? (
            <Box className="mt-4">
              <AnalyticsBarChart data={bars} height={280} />
            </Box>
          ) : null}

          <Box className="mt-4">
            <AnalyticsDataTable<NlQueryRow>
              columns={columns}
              rows={result.rows as NlQueryRow[]}
              rowKey={(row) =>
                result.columns.map((c) => String(row[c] ?? "")).join("|") || JSON.stringify(row)
              }
              emptyMessage="No rows returned."
            />
          </Box>
        </SectionCard>
      ) : null}
    </Box>
  );
}
