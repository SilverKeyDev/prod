#!/usr/bin/env node
/**
 * Email renderer script
 *
 * Renders React Email components to HTML at runtime.
 * Usage: tsx render-email.ts <TemplateName> '<jsonProps>'
 *
 * Example: tsx render-email.ts ListingsEmail '{"recipientEmail":"user@example.com","listings":[...]}'
 */

import React from "react";

import { render } from "@react-email/render";

import { log } from "packages/logger";

type EmailTemplateModule = {
  default: React.ComponentType<Record<string, unknown>>;
};

// Dynamically import email templates (props validated at render time from CLI JSON)
const templateMap: Record<string, () => Promise<EmailTemplateModule>> = {
  ListingsEmail: () => import("./templates/ListingsEmail.tsx") as Promise<EmailTemplateModule>,
  NewPropertiesEmail: () =>
    import("./templates/NewPropertiesEmail.tsx") as Promise<EmailTemplateModule>,
};

async function main() {
  const [templateName, propsJson] = process.argv.slice(2);

  if (!templateName) {
    log.error("API", "Usage: tsx render-email.ts <TemplateName> '<jsonProps>'");
    log.error(
      "API",
      '\nExample: tsx render-email.ts ListingsEmail \'{"recipientEmail":"user@example.com","listings":[]}\''
    );
    process.exit(1);
  }

  const templateLoader = templateMap[templateName];

  if (!templateLoader) {
    log.error("API", "Unknown template", { templateName });
    log.error("API", "Available templates", {
      templates: Object.keys(templateMap).join(", "),
    });
    process.exit(1);
  }

  try {
    // Load the template component
    const module = await templateLoader();
    const Component = module.default;

    // Parse props JSON
    const props = propsJson ? JSON.parse(propsJson) : {};

    // Render to HTML
    const html = await render(React.createElement(Component, props), {
      pretty: true,
    });

    // Output HTML to stdout
    process.stdout.write(html);
  } catch (error) {
    log.error(`API.${error}`, "Error rendering email");
    if (error instanceof Error) {
      log.error("ERRORS", error.message, { stack: error.stack });
    }
    process.exit(1);
  }
}

main().catch((error) => {
  log.error("ERRORS", "Fatal error", error);
  process.exit(1);
});
