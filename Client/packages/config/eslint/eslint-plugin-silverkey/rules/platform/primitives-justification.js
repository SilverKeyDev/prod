"use strict";

const fs = require("fs");
const path = require("path");

/**
 * ESLint rule to ensure platform-specific UI primitive files are documented in primitives.json
 * 
 * This rule specifically targets UI primitive components that have platform-specific implementations
 * (e.g., Button.web.tsx, Input.native.tsx) and ensures they are properly documented.
 */

let configCache = null;
let lastCacheCheck = 0;
const CACHE_TTL = 5000; // 5 seconds

function loadPrimitivesConfig() {
  const now = Date.now();
  
  if (configCache && (now - lastCacheCheck) < CACHE_TTL) {
    return configCache;
  }

  try {
    const platformDir = path.join(__dirname, "../../../platform");
    const primitivesPath = path.join(platformDir, "primitives.json");
    
    if (!fs.existsSync(primitivesPath)) {
      configCache = new Set();
      lastCacheCheck = now;
      return configCache;
    }

    const primitivesData = JSON.parse(fs.readFileSync(primitivesPath, "utf8"));
    const primitives = new Set();
    
    if (Array.isArray(primitivesData)) {
      for (const item of primitivesData) {
        if (item && typeof item.module === "string") {
          primitives.add(item.module);
        }
      }
    }
    
    configCache = primitives;
    lastCacheCheck = now;
    return configCache;
  } catch (error) {
    configCache = new Set();
    lastCacheCheck = now;
    return configCache;
  }
}

function isPrimitiveFile(filename) {
  const primitivePatterns = [
    /\/ui\/components\/primitives\//,
    /\/primitives\//,
    /\/(button|input|text|image|video|modal|dialog|scroll|box|view)\/.*\.(web|native)\.(ts|tsx)$/i,
    /\/(Button|Input|Text|Image|Video|Modal|Dialog|ScrollView|Box|View)\.(web|native)\.(ts|tsx)$/
  ];
  
  return primitivePatterns.some(pattern => pattern.test(filename));
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Platform-specific UI primitive files must be documented in primitives.json",
      category: "Platform Architecture",
      recommended: true,
    },
    schema: [],
    messages: {
      undocumentedPrimitive: "UI primitive '{{filename}}' should be documented in packages/config/platform/primitives.json. This appears to be a platform-specific UI component that needs justification. Use the 'resolve-primitives-violation' skill for guidance on proper documentation.",
    },
  },

  create(context) {
    const filename = context.getFilename();
    
    // Only check platform-specific files in packages directory
    if (!filename.includes("/packages/") || 
        !filename.match(/\.(web|native)\.(ts|tsx)$/)) {
      return {};
    }
    
    // Only check files that appear to be UI primitives
    if (!isPrimitiveFile(filename)) {
      return {};
    }

    const primitives = loadPrimitivesConfig();
    const isDocumented = Array.from(primitives).some(primitive => 
      filename.includes(primitive)
    );

    return {
      Program(node) {
        if (!isDocumented) {
          context.report({
            node,
            messageId: "undocumentedPrimitive",
            data: {
              filename: path.basename(filename)
            }
          });
        }
      }
    };
  }
};