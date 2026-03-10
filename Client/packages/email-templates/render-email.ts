#!/usr/bin/env node
/**
 * Email renderer script
 *
 * Renders React Email components to HTML at runtime.
 * Usage: tsx render-email.ts <TemplateName> '<jsonProps>'
 *
 * Example: tsx render-email.ts ListingsEmail '{"recipientEmail":"user@example.com","listings":[...]}'
 */

// @ts-expect-error - React Email packages will be installed at runtime
import React from "react";

import { render } from "@react-email/render";

import { log, LOG_CATEGORIES } from "packages/logger";

// Dynamically import email templates
const templateMap: Record<
  string,
  () => Promise<{ default: React.ComponentType<Record<string, unknown>> }>
> = {
  ListingsEmail: () => import("./templates/ListingsEmail.tsx"),
  NewPropertiesEmail: () => import("./templates/NewPropertiesEmail.tsx"),
};

async function main() {
  const [templateName, propsJson] = process.argv.slice(2);

  if (!templateName) {
    log.error(LOG_CATEGORIES.API, "Usage: tsx render-email.ts <TemplateName> '<jsonProps>'");
    log.error(
      LOG_CATEGORIES.API,
      '\nExample: tsx render-email.ts ListingsEmail \'{"recipientEmail":"user@example.com","listings":[]}\''
    );
    process.exit(1);
  }

  const templateLoader = templateMap[templateName];

  if (!templateLoader) {
    log.error(LOG_CATEGORIES.API, "Unknown template", { templateName });
    log.error(LOG_CATEGORIES.API, "Available templates", {
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
    log.error(LOG_CATEGORIES.API, "Error rendering email", error);
    if (error instanceof Error) {
      log.error(LOG_CATEGORIES.ERRORS, error.message, { stack: error.stack });
    }
    process.exit(1);
  }
}

main().catch((error) => {
  log.error(LOG_CATEGORIES.ERRORS, "Fatal error", error);
  process.exit(1);
});
