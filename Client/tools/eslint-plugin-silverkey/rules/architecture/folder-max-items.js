const path = require("path");
const fs = require("fs");

const DEFAULT_EXCLUDED_NAMES = new Set([
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

const cache = new Map();

function countDirectChildren(dirPath, excludeDirs) {
  const cacheKey = `${dirPath}\n${(excludeDirs || []).join(",")}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  let count = 0;
  try {
    const names = fs.readdirSync(dirPath, { withFileTypes: false });
    const excluded = new Set([
      ...DEFAULT_EXCLUDED_NAMES,
      ...(excludeDirs || []),
    ]);
    for (const name of names) {
      if (!excluded.has(name)) {
        count += 1;
      }
    }
  } catch {
    count = 0;
  }
  cache.set(cacheKey, count);
  return count;
}

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Warn when a folder has 10+ direct children; error at 14+. Keeps folders navigable.",
    },
    schema: [
      {
        type: "object",
        properties: {
          warnAt: { type: "number" },
          errorAt: { type: "number" },
          excludeDirs: {
            type: "array",
            items: { type: "string" },
          },
          skipDirNames: {
            type: "array",
            items: { type: "string" },
            description:
              "Skip reporting when the folder's basename is in this list (e.g. monorepo root)",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      tooManyWarn:
        "Folder has {{count}} direct children (recommended max {{max}}).",
      tooManyError: "Folder has {{count}} direct children (max {{max}}).",
    },
  },

  create(context) {
    const opt = context.options[0] || {};
    const warnAt = opt.warnAt ?? 10;
    const errorAt = opt.errorAt ?? 14;
    const excludeDirs = opt.excludeDirs ?? [];

    const rawFilename = context.getFilename();
    if (!rawFilename || rawFilename === "<input>") return {};

    const dirPath = path.dirname(rawFilename);
    const skipDirNames = new Set(opt.skipDirNames || []);
    if (skipDirNames.has(path.basename(dirPath))) return {};

    const count = countDirectChildren(dirPath, excludeDirs);

    if (count < warnAt) return {};

    const isError = count >= errorAt;
    const max = isError ? errorAt - 1 : warnAt - 1;
    const messageId = isError ? "tooManyError" : "tooManyWarn";

    return {
      Program(node) {
        context.report({
          node,
          messageId,
          data: { count, max },
          severity: isError ? 2 : 1,
        });
      },
    };
  },
};
