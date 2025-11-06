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
import { render } from "@react-email/render";
import React from "react";

// Dynamically import email templates
const templateMap: Record<
  string,
  () => Promise<{ default: React.ComponentType<any> }>
> = {
  ListingsEmail: () => import("./templates/ListingsEmail.tsx"),
};

async function main() {
  const [templateName, propsJson] = process.argv.slice(2);

  if (!templateName) {
    console.error("Usage: tsx render-email.ts <TemplateName> '<jsonProps>'");
    console.error(
      "\nExample: tsx render-email.ts ListingsEmail '{\"recipientEmail\":\"user@example.com\",\"listings\":[]}'"
    );
    process.exit(1);
  }

  const templateLoader = templateMap[templateName];

  if (!templateLoader) {
    console.error(`Unknown template: ${templateName}`);
    console.error(`Available templates: ${Object.keys(templateMap).join(", ")}`);
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
    console.error("Error rendering email:", error);
    if (error instanceof Error) {
      console.error(error.message);
      if (error.stack) {
        console.error(error.stack);
      }
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
