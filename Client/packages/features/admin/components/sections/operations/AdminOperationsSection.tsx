import { usePostHogDashboardUrl } from "packages/hooks/ui/usePostHogDashboardUrl.web";
import { Box } from "packages/ui/components/primitives";
import { getWindow } from "packages/utils";

import Card from "@/components/layout/Card.web";
import { BodyText, Button, Title } from "@/components/ui";

export function AdminOperationsSection() {
  const posthogUrl = usePostHogDashboardUrl();

  return (
    <Box className="flex flex-col gap-6">
      <Card border="light" padding="lg" className="w-full">
        <Title size="lg" as="h1" className="mb-2">
          Operations
        </Title>
        <BodyText size="sm" muted className="max-w-2xl">
          Infrastructure status, integration diagnostics, and outage controls will surface here.
          Partner placement CTR and revenue estimates live under Admin → Partners.
        </BodyText>
        <Box className="border-border mt-6 rounded-md border border-dashed p-8">
          <BodyText size="sm" muted className="text-center">
            No automated health probes connected yet.
          </BodyText>
        </Box>
      </Card>

      <Card border="light" padding="lg" className="w-full">
        <Title size="md" as="h2" className="mb-2">
          Product analytics (PostHog)
        </Title>
        <BodyText size="sm" muted className="mb-4 max-w-2xl">
          Funnels, session replay, and error tracking run in PostHog. This is separate from
          brokerage partner placement metrics in the Partners tab.
        </BodyText>
        {posthogUrl ? (
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => {
              getWindow()?.open(posthogUrl, "_blank", "noopener,noreferrer");
            }}
          >
            Open PostHog dashboard
          </Button>
        ) : (
          <BodyText size="sm" muted>
            PostHog is not configured for this environment (set EXPO_PUBLIC_POSTHOG_KEY).
          </BodyText>
        )}
      </Card>
    </Box>
  );
}
