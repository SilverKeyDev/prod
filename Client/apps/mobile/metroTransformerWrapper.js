/**
 * Wraps the real Metro/Babel transformer and logs full error details (message, stack, cause)
 * when transformation fails, so bundling errors show the exact underlying fault.
 * Used by metro.config.cjs via transformer.babelTransformerPath.
 */
/* eslint-disable @typescript-eslint/no-require-imports -- Metro runs in Node CJS */
/* eslint-env node */

/* eslint-disable silverkey/no-process-env-outside-config -- Metro transformer is a build-time file */

const path = require("node:path");
const fs = require("node:fs");

function getMonorepoRoot(projectRoot) {
  if (!projectRoot) return "";
  return path.normalize(path.resolve(projectRoot, "..", ".."));
}

// Suppress "Unknown at rule: @tailwind" and @babel/code-frame deprecation in transformer workers too.
const originalWarn = console.warn;
console.warn = function (...args) {
  const msg = args
    .map((a) =>
      typeof a === "string"
        ? a
        : a && typeof a === "object" && "message" in a
          ? a.message
          : String(a)
    )
    .join(" ");
  if (msg.includes("Unknown at rule") && (msg.includes("@tailwind") || msg.includes("global.css")))
    return;
  if (
    msg.includes("DeprecationWarning") &&
    msg.includes("@babel/code-frame") &&
    msg.includes("codeFrameColumns")
  )
    return;
  originalWarn.apply(console, args);
};
const originalEmitWarning = process.emitWarning;
process.emitWarning = function (warning, ...rest) {
  const msg =
    typeof warning === "string" ? warning : (warning && warning.message) || String(warning);
  if (msg.includes("Unknown at rule") && (msg.includes("@tailwind") || msg.includes("global.css")))
    return;
  if (msg.includes("codeFrameColumns") && msg.includes("lineNumber") && msg.includes("colNumber"))
    return;
  return originalEmitWarning.apply(process, [warning, ...rest]);
};

const innerTransformerPath =
  process.env.METRO_INNER_BABEL_TRANSFORMER ||
  require.resolve("expo/metro-react-native-babel-transformer");

// Log which inner transformer Metro will delegate to so we can confirm
// NativeWind is wired in correctly during bundling.

console.info("[Metro transform] Using inner transformer:", innerTransformerPath);

const inner = require(innerTransformerPath);

function formatTransformError(filename, err) {
  const lines = [
    "",
    "[Metro transform] ERROR (full details):",
    "  file: " + (filename || "unknown"),
    "  message: " + (err && err.message),
  ];
  if (err && err.stack) {
    lines.push(
      "  stack:\n" +
        err.stack
          .split("\n")
          .map((l) => "    " + l)
          .join("\n")
    );
  }
  if (err && err.cause) {
    const c = err.cause;
    lines.push("  cause: " + (c && c.message));
    if (c && c.stack) {
      lines.push(
        "  cause stack:\n" +
          c.stack
            .split("\n")
            .map((l) => "    " + l)
            .join("\n")
      );
    }
  }
  return lines.join("\n");
}

let transformLogCount = 0;
const TRANSFORM_LOG_LIMIT = 50;

module.exports = {
  transform: async function (config) {
    const filename = config.filename ?? config.src ?? "unknown";
    const fileForLog =
      typeof filename === "string" ? filename : path.join(config.projectRoot || "", "unknown");
    const platform = config.options?.platform ?? config.platform ?? "ios";

    if (transformLogCount < TRANSFORM_LOG_LIMIT) {
      transformLogCount += 1;
      console.info("[Metro transform] file", {
        filename: fileForLog,
        platform,
        count: transformLogCount,
      });
    }

    // Web bundle must not contain import.meta (Metro runs as non-ESM). Fail fast with exact file path.
    if (platform === "web" && typeof filename === "string") {
      const absPath = path.isAbsolute(filename)
        ? filename
        : path.resolve(config.projectRoot || "", filename);
      let source = "";
      try {
        source = fs.readFileSync(absPath, "utf8");
      } catch {
        // File may be virtual or already read by Metro; skip check if unreadable
      }
      if (source.includes("import.meta")) {
        const monorepoRoot = getMonorepoRoot(config.projectRoot);
        const shortPath = monorepoRoot
          ? path.relative(monorepoRoot, absPath).replace(/\\/g, "/") || absPath
          : absPath;
        const msg = [
          "",
          "═══════════════════════════════════════════════════════════════════════════════",
          "  Metro web bundle: 'import.meta' is not allowed (Metro is not ESM).",
          "  Use process.env or getEnv() from packages/config instead.",
          "═══════════════════════════════════════════════════════════════════════════════",
          "  FILE: " + absPath,
          "  RELATIVE: " + shortPath,
          "═══════════════════════════════════════════════════════════════════════════════",
          "",
        ].join("\n");
        console.error(msg);
        const err = new Error("import.meta not allowed in Metro web bundle. FILE: " + absPath);
        err.filePath = absPath;
        throw err;
      }
    }

    try {
      return await inner.transform(config);
    } catch (err) {
      console.error(formatTransformError(fileForLog, err));
      throw err;
    }
  },
};

if (typeof inner.getCacheKey === "function") {
  module.exports.getCacheKey = inner.getCacheKey;
}
