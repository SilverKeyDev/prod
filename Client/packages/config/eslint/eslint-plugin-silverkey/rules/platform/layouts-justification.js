"use strict";

const fs = require("fs");
const path = require("path");

/**
 * ESLint rule to ensure platform-specific layout files are documented in layouts.json
 *
 * This rule targets files that implement different layout patterns between platforms
 * (e.g., sidebar vs tab navigation, desktop vs mobile layouts) and ensures they are documented.
 */

let configCache = null;
let lastCacheCheck = 0;
const CACHE_TTL = 5000; // 5 seconds

function loadLayoutsConfig() {
  const now = Date.now();

  if (configCache && now - lastCacheCheck < CACHE_TTL) {
    return configCache;
  }

  try {
    const platformDir = path.join(__dirname, "../../../../platform");
    const layoutsPath = path.join(platformDir, "layouts.json");

    if (!fs.existsSync(layoutsPath)) {
      configCache = new Set();
      lastCacheCheck = now;
      return configCache;
    }

    const layoutsData = JSON.parse(fs.readFileSync(layoutsPath, "utf8"));
    const layouts = new Set();

    if (Array.isArray(layoutsData)) {
      for (const item of layoutsData) {
        if (item && typeof item.webPath === "string") {
          layouts.add(item.webPath);
        }
        if (item && typeof item.nativePath === "string") {
          layouts.add(item.nativePath);
        }
      }
    }

    configCache = layouts;
    lastCacheCheck = now;
    return configCache;
  } catch {
    configCache = new Set();
    lastCacheCheck = now;
    return configCache;
  }
}

function isLayoutFile(filename) {
  const layoutPatterns = [
    /\/(layout|layouts)\//,
    /\/(screen|screens)\//,
    /\/(page|pages)\//,
    /\/(shell|shells)\//,
    /\/(navigation|nav)\//,
    /\/(container|containers)\//,
    /\/(wrapper|wrappers)\//,
    /(Layout|Screen|Page|Shell|Navigation|Container|Wrapper)\.(web|native)\.(ts|tsx)$/,
    /AppRoot\.(web|native)\.(ts|tsx)$/,
    /Root\.(web|native)\.(ts|tsx)$/,
  ];

  return layoutPatterns.some((pattern) => pattern.test(filename));
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Platform-specific layout files must be documented in layouts.json",
      category: "Platform Architecture",
      recommended: true,
    },
    schema: [],
    messages: {
      undocumentedLayout:
        "Layout file '{{filename}}' should be documented in packages/config/platform/layouts.json. This appears to implement different layout patterns between platforms and needs justification. Use the 'resolve-layouts-violation' skill for guidance on proper documentation.",
    },
  },

  create(context) {
    const filename = context.getFilename();

    // Only check platform-specific files in packages directory
    if (!filename.includes("/packages/") || !filename.match(/\.(web|native)\.(ts|tsx)$/)) {
      return {};
    }

    // Only check files that appear to be layouts
    if (!isLayoutFile(filename)) {
      return {};
    }

    const layouts = loadLayoutsConfig();
    const isDocumented = Array.from(layouts).some((layout) => filename.includes(layout));

    return {
      Program(node) {
        if (!isDocumented) {
          context.report({
            node,
            messageId: "undocumentedLayout",
            data: {
              filename: path.basename(filename),
            },
          });
        }
      },
    };
  },
};
