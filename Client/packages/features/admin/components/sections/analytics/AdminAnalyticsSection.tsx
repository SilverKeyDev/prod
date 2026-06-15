import { useMemo } from "react";

import { useAdminValidationStats } from "packages/features/admin/hooks/data/useAdminValidationStats";
import { Box } from "packages/ui/components/structure/primitives";

import Card from "@/components/layout/Card.web";
import { BodyText, Button, Title } from "@/components/ui";

const DEFAULT_STATS_DAYS = 7;

export function AdminAnalyticsSection() {
  const { data, isLoading, error, refetch } = useAdminValidationStats(DEFAULT_STATS_DAYS);

  const body = useMemo(() => {
    if (isLoading) {
      return (
        <BodyText size="sm" muted>
          Loading validation statistics…
        </BodyText>
      );
    }
    if (error) {
      return (
        <BodyText size="sm" muted>
          {error instanceof Error ? error.message : "Failed to load validation statistics"}
        </BodyText>
      );
    }
    if (!data) {
      return (
        <BodyText size="sm" muted>
          No data returned.
        </BodyText>
      );
    }
    try {
      return (
        <pre className="bg-background-muted text-text-primary max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-md p-3 text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      );
    } catch {
      return (
        <BodyText size="sm" muted>
          Unable to render statistics payload.
        </BodyText>
      );
    }
  }, [data, error, isLoading]);

  return (
    <Card border="light" padding="lg" className="w-full">
      <Title size="lg" as="h1" className="mb-2">
        Analytics
      </Title>
      <BodyText size="sm" muted className="mb-6 max-w-2xl">
        OpenAPI validation stats snapshot (aggregated logging is placeholder until infra wiring;
        admins can reload after deploys).
      </BodyText>
      <Box className="border-border flex flex-wrap items-center gap-3 border-b pb-4">
        <BodyText size="xs" muted>
          Window: last {DEFAULT_STATS_DAYS} days
        </BodyText>
        <Button variant="ghost" size="xs" type="button" onClick={() => void refetch()}>
          Refresh
        </Button>
      </Box>
      <Box className="mt-4">{body}</Box>
    </Card>
  );
}
