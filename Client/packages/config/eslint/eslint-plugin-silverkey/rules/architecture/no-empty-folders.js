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

// Files that are considered "placeholders" and don't count as folder content
// Note: index.ts, index.tsx, etc. are actual code files and DO count as content
const DEFAULT_ALLOWED_FILES = new Set([".gitkeep"]);

const cache = new Map();

function isFolderEmpty(dirPath, excludeDirs, allowedFiles) {
  const cacheKey = `${dirPath}\n${(excludeDirs || []).join(",")}\n${Array.from(allowedFiles).join(",")}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const excluded = new Set([...DEFAULT_EXCLUDED_NAMES, ...(excludeDirs || [])]);

    // Check if directory has any non-excluded, non-allowed files
    for (const entry of entries) {
      // Skip excluded directories/files
      if (excluded.has(entry.name)) {
        continue;
      }

      // If it's a file (not a directory), check if it's an allowed file
      if (entry.isFile()) {
        // If file is not in allowed list, folder is not empty
        if (!allowedFiles.has(entry.name)) {
          cache.set(cacheKey, false);
          return false;
        }
      } else if (entry.isDirectory()) {
        // If it's a directory (and not excluded), folder is not empty
        cache.set(cacheKey, false);
        return false;
      }
    }

    // Folder is empty (only contains excluded directories or placeholder files like .gitkeep)
    cache.set(cacheKey, true);
    return true;
  } catch {
    // If we can't read the directory, assume it's not empty to avoid false positives
    cache.set(cacheKey, false);
    return false;
  }
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow empty folders. Empty folders should be removed or contain at least one non-ignored file.",
    },
    schema: [
      {
        type: "object",
        properties: {
          excludeDirs: {
            type: "array",
            items: { type: "string" },
            description: "Additional directory names to exclude from empty folder checks",
          },
          allowedFiles: {
            type: "array",
            items: { type: "string" },
            description:
              "Additional placeholder file names that don't count as folder content (e.g., .gitkeep). Note: index.ts, index.tsx, etc. are actual code files and will make a folder non-empty.",
          },
          skipDirNames: {
            type: "array",
            items: { type: "string" },
            description: "Skip checking when the folder's basename is in this list",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      emptyFolder:
        "Empty folder detected: '{{folderPath}}'. Remove the folder or add at least one file.",
    },
  },

  create(context) {
    const opt = context.options[0] || {};
    const excludeDirs = opt.excludeDirs || [];
    const allowedFiles = new Set([...DEFAULT_ALLOWED_FILES, ...(opt.allowedFiles || [])]);
    const skipDirNames = new Set(opt.skipDirNames || []);

    const rawFilename = context.getFilename();
    if (!rawFilename || rawFilename === "<input>") return {};

    const dirPath = path.dirname(rawFilename);
    const dirName = path.basename(dirPath);

    // Skip if folder name is in skip list
    if (skipDirNames.has(dirName)) return {};

    // Check if folder is empty
    const isEmpty = isFolderEmpty(dirPath, excludeDirs, allowedFiles);

    if (!isEmpty) return {};

    return {
      Program(node) {
        context.report({
          node,
          messageId: "emptyFolder",
          data: {
            folderPath: dirPath,
          },
        });
      },
    };
  },
};
