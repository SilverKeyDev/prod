import { color } from "packages/design-tokens";
import type { BrokerageAnalyticsAgent } from "packages/features/brokerage/types/analytics";
import { useNavigation } from "packages/navigation";
import { Button } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

interface Props {
  agent: BrokerageAnalyticsAgent;
}

export function AgentDetailHeader({ agent }: Props) {
  const { navigateToPath } = useNavigation();

  const dangerColor = color("state.danger.DEFAULT");
  const successColor = color("state.success.DEFAULT");
  const chartColor1 = color("chart.1");

  return (
    <>
      <Box>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onPress={() => navigateToPath("/dashboard")}
        >
          ← Brokerage Analytics
        </Button>
      </Box>

      <Box>
        <Title size="md" as="h1">
          {agent.name}
        </Title>
        <BodyText size="sm" muted className="mt-1">
          {agent.office} · {agent.team} ·{" "}
          <BodyText
            as="span"
            style={{
              color:
                agent.status === "top"
                  ? successColor
                  : agent.status === "at_risk"
                    ? dangerColor
                    : chartColor1,
              fontWeight: 500,
            }}
          >
            {agent.status === "top"
              ? "Top Performer"
              : agent.status === "at_risk"
                ? "At Risk"
                : "Healthy"}
          </BodyText>
        </BodyText>
      </Box>
    </>
  );
}
