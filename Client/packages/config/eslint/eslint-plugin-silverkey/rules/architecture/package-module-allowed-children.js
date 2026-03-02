"use strict";

const path = require("path");
const fs = require("fs");

/** Allowed direct child directories of a package module (e.g. packages/features/agent). */
const DEFAULT_ALLOWED_DIRS = new Set(["api", "components", "hooks", "store", "types", "utils"]);

/** Allowed files at module root (barrel / public API, README). */
const DEFAULT_ALLOWED_ROOT_FILES = new Set(["index.ts", "index.tsx", "index.js", "README.md"]);

const cache = new Map();

/**
 * Get direct children (files and dirs) of dirPath, excluding common ignore names.
 * @param {string} dirPath - Absolute path to directory
 * @returns {{ dirs: string[], files: string[] }}
 */
function getDirectChildren(dirPath) {
  const cacheKey = dirPath;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  const dirs = [];
  const files = [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const ignore = new Set([
      "node_modules",
      "dist",
      "build",
      "coverage",
      ".git",
      "__pycache__",
      ".turbo",
      ".eslintcache",
      ".vite",
    ]);
    for (const entry of entries) {
      if (ignore.has(entry.name)) continue;
      if (entry.isDirectory()) {
        dirs.push(entry.name);
      } else {
        files.push(entry.name);
      }
    }
  } catch {
    // If we can't read, don't cache; caller may retry from another file
    return { dirs, files };
  }
  cache.set(cacheKey, { dirs, files });
  return { dirs, files };
}

/**
 * Find module root for a file under scopeDir.
 * e.g. scopeDir = "packages/features", filePath = ".../packages/features/agent/settings/Foo.tsx"
 * => module root = ".../packages/features/agent"
 * @param {string} filePath - Absolute path to the file being linted
 * @param {string} scopeDir - Path segment that identifies scope (e.g. "packages/features")
 * @param {string} cwd - Project root (for resolving)
 * @returns {string | null} Module root absolute path, or null if not under scope
 */
function getModuleRoot(filePath, scopeDir, cwd) {
  const normalized = path.resolve(cwd, filePath);
  const scopeIdx = normalized.indexOf(scopeDir);
  if (scopeIdx === -1) return null;
  const afterScope = normalized.slice(scopeIdx + scopeDir.length);
  const segments = path.normalize(afterScope).split(path.sep).filter(Boolean);
  if (segments.length < 2) return null; // need at least <moduleName>/<something>
  const moduleName = segments[0];
  const scopePath = path.resolve(cwd, scopeDir);
  return path.join(scopePath, moduleName);
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce package module structure: only api/, components/, hooks/, store/, types/, utils/, and index.ts at module root.",
    },
    schema: [
      {
        type: "object",
        properties: {
          scopeDir: {
            type: "string",
            description:
              "Path segment that defines scope (e.g. 'packages/features'). Only paths under this are checked.",
          },
          allowedDirs: {
            type: "array",
            items: { type: "string" },
            description:
              "Allowed direct child directory names (default: api, components, hooks, store, types, utils)",
          },
          allowedRootFiles: {
            type: "array",
            items: { type: "string" },
            description:
              "Allowed file names at module root (default: index.ts, index.tsx, index.js)",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      disallowedChild:
        "Package module may only contain: {{allowed}}. Found: '{{found}}'. Move it into an allowed folder or add an exception.",
    },
  },

  create(context) {
    const opt = context.options[0] || {};
    const scopeDir = opt.scopeDir || "packages/features";
    const allowedDirs = new Set(opt.allowedDirs || Array.from(DEFAULT_ALLOWED_DIRS));
    const allowedRootFiles = new Set(
      opt.allowedRootFiles || Array.from(DEFAULT_ALLOWED_ROOT_FILES)
    );

    const rawFilename = context.getFilename();
    if (!rawFilename || rawFilename === "<input>") return {};

    const cwd = context.getCwd ? context.getCwd() : process.cwd();
    const moduleRoot = getModuleRoot(rawFilename, scopeDir, cwd);
    if (!moduleRoot) return {};

    const relativePath = path.relative(moduleRoot, path.dirname(rawFilename));
    if (!relativePath || relativePath === ".") {
      // File is at module root
      const fileName = path.basename(rawFilename);
      if (allowedRootFiles.has(fileName)) return {};
      return {
        Program(node) {
          context.report({
            node,
            messageId: "disallowedChild",
            data: {
              allowed: [
                ...Array.from(allowedDirs).map((d) => d + "/"),
                ...Array.from(allowedRootFiles),
              ].join(", "),
              found: fileName,
            },
          });
        },
      };
    }

    const firstSegment = relativePath.split(path.sep)[0];
    if (allowedDirs.has(firstSegment)) return {};

    const { dirs, files } = getDirectChildren(moduleRoot);
    const disallowed = [
      ...dirs.filter((d) => !allowedDirs.has(d)),
      ...files.filter((f) => !allowedRootFiles.has(f)),
    ];
    const found = disallowed.length ? disallowed.join(", ") : firstSegment;

    return {
      Program(node) {
        context.report({
          node,
          messageId: "disallowedChild",
          data: {
            allowed: [
              ...Array.from(allowedDirs).map((d) => d + "/"),
              ...Array.from(allowedRootFiles),
            ].join(", "),
            found,
          },
        });
      },
    };
  },
};
