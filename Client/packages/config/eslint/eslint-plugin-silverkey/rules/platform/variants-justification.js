"use strict";

const fs = require("fs");
const path = require("path");

/**
 * ESLint rule to ensure platform-specific technology variant files are documented in variants.json
 *
 * This rule targets files that use platform-specific dependencies (react-dom, react-native modules, etc.)
 * and ensures they are properly documented as legitimate technology swaps.
 */

let configCache = null;
let lastCacheCheck = 0;
const CACHE_TTL = 5000; // 5 seconds

const PLATFORM_DEPENDENCIES = {
  web: [
    "react-dom",
    "react-router",
    "react-router-dom",
    "@headlessui/react",
    "react-virtuoso",
    "framer-motion",
    "hls.js",
    "lucide-react",
    "embla-carousel-react",
    "react-phone-number-input",
    "react-responsive-carousel",
  ],
  native: [
    "react-native",
    "@react-native",
    "react-navigation",
    "@react-navigation",
    "react-native-reanimated",
    "expo-av",
    "react-native-video",
    "@expo/vector-icons",
    "lucide-react-native",
    "react-native-reanimated-carousel",
  ],
};

function loadVariantsConfig() {
  const now = Date.now();

  if (configCache && now - lastCacheCheck < CACHE_TTL) {
    return configCache;
  }

  try {
    const platformDir = path.join(__dirname, "../../../platform");
    const variantsPath = path.join(platformDir, "variants.json");

    if (!fs.existsSync(variantsPath)) {
      configCache = new Set();
      lastCacheCheck = now;
      return configCache;
    }

    const variantsData = JSON.parse(fs.readFileSync(variantsPath, "utf8"));
    const variants = new Set();

    if (Array.isArray(variantsData)) {
      for (const item of variantsData) {
        if (item && typeof item.webPath === "string") {
          variants.add(item.webPath);
        }
        if (item && typeof item.nativePath === "string") {
          variants.add(item.nativePath);
        }
      }
    }

    configCache = variants;
    lastCacheCheck = now;
    return configCache;
  } catch (error) {
    configCache = new Set();
    lastCacheCheck = now;
    return configCache;
  }
}

function hasPlatformDependencies(filename) {
  try {
    const content = fs.readFileSync(filename, "utf8");
    const allDeps = [...PLATFORM_DEPENDENCIES.web, ...PLATFORM_DEPENDENCIES.native];

    return allDeps.some((dep) => {
      const importRegex = new RegExp(
        `from\\s+['"]${dep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
        "g"
      );
      const requireRegex = new RegExp(
        `require\\(['"]${dep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
        "g"
      );
      return importRegex.test(content) || requireRegex.test(content);
    });
  } catch (error) {
    return false;
  }
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Platform-specific technology variant files must be documented in variants.json",
      category: "Platform Architecture",
      recommended: true,
    },
    schema: [],
    messages: {
      undocumentedVariant:
        "Technology variant '{{filename}}' should be documented in packages/config/platform/variants.json. This file appears to use platform-specific dependencies and needs justification for why it cannot be shared. Use the 'resolve-variants-violation' skill for guidance on proper documentation.",
    },
  },

  create(context) {
    const filename = context.getFilename();

    // Only check platform-specific files in packages directory
    if (!filename.includes("/packages/") || !filename.match(/\.(web|native)\.(ts|tsx)$/)) {
      return {};
    }

    // Only check files that have platform-specific dependencies
    if (!hasPlatformDependencies(filename)) {
      return {};
    }

    const variants = loadVariantsConfig();
    const isDocumented = Array.from(variants).some((variant) => filename.includes(variant));

    return {
      Program(node) {
        if (!isDocumented) {
          context.report({
            node,
            messageId: "undocumentedVariant",
            data: {
              filename: path.basename(filename),
            },
          });
        }
      },
    };
  },
};
