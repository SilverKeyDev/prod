"use strict";

const fs = require("fs");
const path = require("path");

/**
 * Cache for config file contents to avoid repeated file reads
 */
let configCache = null;
let lastCacheCheck = 0;
const CACHE_TTL = 5000; // 5 seconds

/**
 * Load and cache platform configuration files
 */
function loadPlatformConfigs() {
  const now = Date.now();
  
  // Return cached config if still valid
  if (configCache && (now - lastCacheCheck) < CACHE_TTL) {
    return configCache;
  }

  try {
    const platformDir = path.join(__dirname, "../../../../platform");
    const configs = {
      primitives: new Set(),
      variants: new Set(),
      layouts: new Set(),
    };

    // Load primitives.json
    try {
      const primitivesPath = path.join(platformDir, "primitives.json");
      const primitivesData = JSON.parse(fs.readFileSync(primitivesPath, "utf8"));
      if (Array.isArray(primitivesData)) {
        for (const item of primitivesData) {
          if (item && typeof item.module === "string") {
            configs.primitives.add(item.module);
          }
        }
      }
    } catch {
      // Primitives file missing or invalid, continue
    }

    // Load variants.json
    try {
      const variantsPath = path.join(platformDir, "variants.json");
      const variantsData = JSON.parse(fs.readFileSync(variantsPath, "utf8"));
      if (Array.isArray(variantsData)) {
        for (const variant of variantsData) {
          if (variant && typeof variant.webPath === "string" && variant.webPath.length > 0) {
            configs.variants.add(variant.webPath);
          }
          if (variant && typeof variant.nativePath === "string" && variant.nativePath.length > 0) {
            configs.variants.add(variant.nativePath);
          }
        }
      }
    } catch {
      // Variants file missing or invalid, continue
    }

    // Load layouts.json (if it exists)
    try {
      const layoutsPath = path.join(platformDir, "layouts.json");
      const layoutsData = JSON.parse(fs.readFileSync(layoutsPath, "utf8"));
      if (Array.isArray(layoutsData)) {
        for (const layout of layoutsData) {
          if (layout && typeof layout.webPath === "string" && layout.webPath.length > 0) {
            configs.layouts.add(layout.webPath);
          }
          if (layout && typeof layout.nativePath === "string" && layout.nativePath.length > 0) {
            configs.layouts.add(layout.nativePath);
          }
        }
      }
    } catch {
      // Layouts file missing or invalid, continue (it might not exist yet)
    }

    configCache = configs;
    lastCacheCheck = now;
    return configs;
  } catch (error) {
    // If we can't load any configs, return empty sets to effectively disable the rule
    const emptyConfigs = {
      primitives: new Set(),
      variants: new Set(),
      layouts: new Set(),
    };
    configCache = emptyConfigs;
    lastCacheCheck = now;
    return emptyConfigs;
  }
}

/**
 * Check if a file path is documented in any of the platform config files
 */
function isDocumentedPlatformFile(filePath, configs) {
  // Normalize the file path (remove leading ./ and convert to forward slashes)
  const normalizedPath = filePath.replace(/^\.\//, "").replace(/\\/g, "/");
  
  // Check if the file is documented in any config
  return configs.primitives.has(normalizedPath) || 
         configs.variants.has(normalizedPath) || 
         configs.layouts.has(normalizedPath);
}

/**
 * Extract relative path from filename for comparison with config paths
 */
function getRelativePathFromPackages(filename) {
  // Find the packages/ directory in the path
  const packagesIndex = filename.indexOf("/packages/");
  if (packagesIndex === -1) {
    return null;
  }
  
  // Return the path from packages/ onwards
  return filename.substring(packagesIndex + 1); // +1 to remove the leading slash
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce that platform-specific files (.web/.native) in packages/ directory are documented in platform configuration files.",
    },
    schema: [
      {
        type: "object",
        properties: {
          requireDocumentation: {
            type: "boolean",
            default: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      undocumentedPlatformFile:
        "Platform-specific file '{{filename}}' is not documented in any platform configuration file (primitives.json, variants.json, layouts.json). Either consolidate to a shared implementation or document the platform-specific need in packages/config/platform/variants.json.",
      undocumentedWebFile:
        "Web-specific file '{{filename}}' should either be made cross-platform or documented in packages/config/platform/variants.json with justification for why it cannot be shared.",
      undocumentedNativeFile:
        "Native-specific file '{{filename}}' should either be made cross-platform or documented in packages/config/platform/variants.json with justification for why it cannot be shared.",
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const requireDocumentation = options.requireDocumentation !== false;

    // Only check if documentation is required
    if (!requireDocumentation) {
      return {};
    }

    return {
      Program(node) {
        const filename = context.filename || context.getFilename();
        
        // Only check files in packages/ directory
        if (!filename.includes("/packages/")) {
          return;
        }

        // Check if file has platform-specific extension
        const isPlatformFile = filename.includes(".web.") || filename.includes(".native.");
        if (!isPlatformFile) {
          return;
        }

        // Get the relative path from packages/
        const relativePath = getRelativePathFromPackages(filename);
        if (!relativePath) {
          return;
        }

        // Load platform configs
        const configs = loadPlatformConfigs();

        // Check if the file is documented
        if (!isDocumentedPlatformFile(relativePath, configs)) {
          let messageId = "undocumentedPlatformFile";
          
          // Provide more specific messages based on file type
          if (filename.includes(".web.")) {
            messageId = "undocumentedWebFile";
          } else if (filename.includes(".native.")) {
            messageId = "undocumentedNativeFile";
          }

          context.report({
            node,
            messageId,
            data: { 
              filename: path.basename(filename),
              relativePath 
            },
          });
        }
      },
    };
  },
};