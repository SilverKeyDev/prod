import React from "react";

import { render } from "@react-email/render";

import CampaignAgentEmail, { type CampaignAgentEmailProps } from "./templates/CampaignAgentEmail";

/**
 * Renders the brokerage campaign agent email to an HTML string for iframe previews.
 */
export async function renderCampaignAgentEmailHtml(
  props: CampaignAgentEmailProps
): Promise<string> {
  return render(React.createElement(CampaignAgentEmail, props), {
    pretty: false,
  });
}
