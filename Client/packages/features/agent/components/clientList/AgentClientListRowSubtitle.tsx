import React from "react";

import { Icon } from "@ui/icons";

import type { AgentClient } from "packages/api";
import { useLocalization } from "packages/contexts";
import { Box } from "packages/ui/components/primitives";

import { BodyText } from "@/components/ui";
import { buildClientListSubtitle } from "@/features/agent/utils/clientList/buildClientListSubtitle";

type AgentClientListRowSubtitleProps = {
  client: Pick<AgentClient, "current_phase" | "pipeline_stage" | "current_step_label">;
  className?: string;
};

export default function AgentClientListRowSubtitle({
  client,
  className = "",
}: AgentClientListRowSubtitleProps) {
  const { t } = useLocalization();
  const { iconName, phaseLabel, stepLabel } = buildClientListSubtitle(client, t);
  const allCompleteLabel = t("agent.client_list_all_steps_complete");
  const fullLine = stepLabel
    ? `${phaseLabel} · ${stepLabel}`
    : `${phaseLabel} · ${allCompleteLabel}`;

  return (
    <Box className={`flex min-w-0 flex-row items-center gap-1.5 ${className}`} title={fullLine}>
      <Icon name={iconName} className="text-text-tertiary h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
      <BodyText as="p" size="xs" className="text-text-primary min-w-0 truncate font-medium">
        {phaseLabel}
        <BodyText as="span" size="xs" className="text-text-secondary">
          {" · "}
        </BodyText>
        <BodyText as="span" size="xs" className="font-normal">
          {stepLabel ?? allCompleteLabel}
        </BodyText>
      </BodyText>
    </Box>
  );
}
