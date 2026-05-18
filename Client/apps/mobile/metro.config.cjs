/* eslint-disable @typescript-eslint/no-require-imports -- Metro/Expo use CJS */
/* global require, module, __dirname, process, console */
const path = require("node:path");
const fs = require("node:fs");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");
require("dotenv").config({ path: path.join(monorepoRoot, ".env") });

// Expo inlines EXPO_PUBLIC_* from .env into the client bundle. Use the same EXPO_PUBLIC_* keys as web (see Client/.env.example).

const projectNodeModules = path.resolve(projectRoot, "node_modules");
const rootNodeModules = path.resolve(monorepoRoot, "node_modules");

// Suppress "Unknown at rule: @tailwind" from CSS parser when processing global.css (Tailwind directives are valid).
// Also suppress @babel/code-frame deprecation (lineNumber/colNumber -> codeFrameColumns).
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

// Shared path rewrites from tsconfig.base.json (same source as TypeScript/Vite; keeps web and mobile in sync)
const { getMetroPathRewrites } = require(
  path.join(monorepoRoot, "packages/config/resolve-paths.cjs")
);
const PACKAGES_PATH_REWRITES = getMetroPathRewrites(monorepoRoot);

/** Resolve module name to file path under monorepoRoot (packages/... or absolute). Tries .ts, .tsx, .js, /index. */
function resolvePackagesPath(moduleName, platform) {
  const root = path.normalize(monorepoRoot);
  let logicalPath;
  if (path.isAbsolute(moduleName)) {
    const normalized = path.normalize(moduleName);
    if (!normalized.startsWith(root)) return null;
    logicalPath = path.relative(root, normalized).split(path.sep).join("/");
  } else if (moduleName.startsWith("packages/") || moduleName.startsWith("@/")) {
    logicalPath = moduleName.startsWith("packages/")
      ? moduleName
      : "packages/" + moduleName.slice(2);
  } else {
    return null;
  }
  // If the request already has .js or .jsx, try that path first, then try without that extension (e.g. index.ts)
  const hasJsExt = /\.(js|jsx)$/.test(logicalPath);
  const baseWithoutExt = hasJsExt ? logicalPath.replace(/\.(js|jsx)$/, "") : logicalPath;
  const base = path.join(root, baseWithoutExt);
  const withExt = (ext) => base + ext;
  const withPlatform = (pfx, ext) => {
    const dir = path.dirname(base);
    const stem = path.basename(base);
    return path.join(dir, stem + pfx + ext);
  };
  if (
    hasJsExt &&
    fs.existsSync(path.join(root, logicalPath)) &&
    fs.statSync(path.join(root, logicalPath)).isFile()
  )
    return path.join(root, logicalPath);
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  const baseIsDirectory = fs.existsSync(base) && fs.statSync(base).isDirectory();
  // When `base` is a package directory (e.g. packages/features/search), do not resolve to a
  // sibling stem.native.ts (e.g. packages/features/search.native.ts); use <dir>/index(.native).ts.
  if (!baseIsDirectory) {
    // Prefer platform-specific variants before generic extensions so e.g. Loading.native.tsx is used on iOS/Android instead of Loading.tsx (web canvas/div).
    if (platform === "ios" || platform === "android") {
      if (fs.existsSync(withPlatform(".native", ".ts"))) return withPlatform(".native", ".ts");
      if (fs.existsSync(withPlatform(".native", ".tsx"))) return withPlatform(".native", ".tsx");
    }
    if (platform === "web") {
      if (fs.existsSync(withPlatform(".web", ".ts"))) return withPlatform(".web", ".ts");
      if (fs.existsSync(withPlatform(".web", ".tsx"))) return withPlatform(".web", ".tsx");
    }
    if (fs.existsSync(withExt(".ts"))) return withExt(".ts");
    if (fs.existsSync(withExt(".tsx"))) return withExt(".tsx");
    if (fs.existsSync(withExt(".js"))) return withExt(".js");
    if (fs.existsSync(withExt(".jsx"))) return withExt(".jsx");
    // Fallback: platform variants when no generic file exists (e.g. packages/config/env).
    if (platform === "web") {
      if (fs.existsSync(withPlatform(".web", ".ts"))) return withPlatform(".web", ".ts");
      if (fs.existsSync(withPlatform(".web", ".tsx"))) return withPlatform(".web", ".tsx");
    }
    if (platform === "ios" || platform === "android") {
      if (fs.existsSync(withPlatform(".native", ".ts"))) return withPlatform(".native", ".ts");
      if (fs.existsSync(withPlatform(".native", ".tsx"))) return withPlatform(".native", ".tsx");
    }
  }
  const indexBase = path.join(base, "index");
  // Prefer index.native for package barrels on iOS/Android so exports (e.g. ConnectedCardHeartSave) use RN-safe components.
  if (platform === "ios" || platform === "android") {
    if (fs.existsSync(indexBase + ".native.ts")) return indexBase + ".native.ts";
    if (fs.existsSync(indexBase + ".native.tsx")) return indexBase + ".native.tsx";
  }
  if (fs.existsSync(indexBase + ".ts")) return indexBase + ".ts";
  if (fs.existsSync(indexBase + ".tsx")) return indexBase + ".tsx";
  if (fs.existsSync(indexBase + ".js")) return indexBase + ".js";
  return null;
}

const config = getDefaultConfig(projectRoot);
console.info("[Metro] default config loaded", {
  transformer: config.transformer,
  resolverPlatforms: config.resolver?.platforms,
});

// Capture default resolver so we can delegate with a full context (avoids hasMagic errors
// when NativeWind or other wrappers replace the resolver with a partial object).
const defaultResolveRequest = config.resolver.resolveRequest;

function wrapDefaultResolveRequest(original) {
  if (!original) return original;
  return function wrappedResolve(context, moduleName, platform) {
    if (moduleName === "../../App" || moduleName === "../App") {
      const appTsx = path.join(projectRoot, "App.tsx");
      const appTs = path.join(projectRoot, "App.ts");
      const appJsx = path.join(projectRoot, "App.jsx");
      const appJs = path.join(projectRoot, "App.js");
      if (fs.existsSync(appTsx)) return { type: "sourceFile", filePath: appTsx };
      if (fs.existsSync(appTs)) return { type: "sourceFile", filePath: appTs };
      if (fs.existsSync(appJsx)) return { type: "sourceFile", filePath: appJsx };
      if (fs.existsSync(appJs)) return { type: "sourceFile", filePath: appJs };
    }
    return original(context, moduleName, platform);
  };
}

config.watchFolders = [
  projectRoot,
  monorepoRoot,
  path.resolve(monorepoRoot, "packages"),
  rootNodeModules,
];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;

config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

config.resolver.extraNodeModules = new Proxy(
  { packages: path.resolve(monorepoRoot, "packages") },
  {
    get(target, name) {
      if (Object.prototype.hasOwnProperty.call(target, name)) return target[name];
      const nameStr = String(name);
      const inProject = path.join(projectNodeModules, nameStr);
      const inRoot = path.join(rootNodeModules, nameStr);
      try {
        const fs = require("node:fs");
        if (
          fs.existsSync(path.join(inProject, "package.json")) ||
          fs.existsSync(path.join(inProject, "index.js"))
        )
          return inProject;
        if (
          fs.existsSync(path.join(inRoot, "package.json")) ||
          fs.existsSync(path.join(inRoot, "index.js"))
        )
          return inRoot;
      } catch {
        // Ignore filesystem resolution errors and fall back to project node_modules.
      }
      return path.join(projectNodeModules, nameStr);
    },
  }
);

/**
 * Log full error details (message, stack, cause) to stderr so bundling failures
 * show the exact underlying error instead of a generic "hasMagic" or similar.
 */
function logResolutionError(phase, moduleName, platform, err) {
  const lines = [
    "",
    "[Metro resolver] ERROR during " + phase + ":",
    "  moduleName: " + moduleName,
    "  platform: " + platform,
    "  message: " + (err && err.message),
  ];
  if (err && err.stack)
    lines.push(
      "  stack:\n" +
        err.stack
          .split("\n")
          .map((l) => "    " + l)
          .join("\n")
    );
  if (err && err.cause) {
    const c = err.cause;
    lines.push("  cause: " + (c && c.message));
    if (c && c.stack)
      lines.push(
        "  cause stack:\n" +
          c.stack
            .split("\n")
            .map((l) => "    " + l)
            .join("\n")
      );
  }

  console.error(lines.join("\n"));
}

function customResolveRequest(context, moduleName, platform) {
  try {
    return customResolveRequestImpl(context, moduleName, platform);
  } catch (err) {
    logResolutionError("resolve", moduleName, platform, err);
    throw err;
  }
}

function customResolveRequestImpl(context, moduleName, platform) {
  const origin = context.originModulePath || "";

  // 0) Unconditionally resolve ../../App or ../App to the app's App.tsx (Expo AppEntry.js uses ../../App; in monorepo/pnpm this otherwise fails).
  if (moduleName === "../../App" || moduleName === "../App") {
    const appTsx = path.join(projectRoot, "App.tsx");
    const appTs = path.join(projectRoot, "App.ts");
    const appJsx = path.join(projectRoot, "App.jsx");
    const appJs = path.join(projectRoot, "App.js");
    if (fs.existsSync(appTsx)) return { type: "sourceFile", filePath: appTsx };
    if (fs.existsSync(appTs)) return { type: "sourceFile", filePath: appTs };
    if (fs.existsSync(appJsx)) return { type: "sourceFile", filePath: appJsx };
    if (fs.existsSync(appJs)) return { type: "sourceFile", filePath: appJs };
  }

  // 0a) expo/AppEntry.js requires ../../App; (kept for explicit origin detection; 0 above is the main fix).
  const normalizedOrigin = path.normalize(origin).replace(/\\/g, "/");
  const isFromExpoAppEntry =
    normalizedOrigin.includes("expo/AppEntry") ||
    (path.basename(origin) === "AppEntry.js" &&
      (normalizedOrigin.includes("node_modules/expo") ||
        normalizedOrigin.includes("node_modules\\expo")));
  const isAppRequest = moduleName === "../../App" || moduleName === "../App";
  if (isAppRequest && (isFromExpoAppEntry || normalizedOrigin.includes("AppEntry"))) {
    const appTsx = path.join(projectRoot, "App.tsx");
    const appTs = path.join(projectRoot, "App.ts");
    const appJsx = path.join(projectRoot, "App.jsx");
    const appJs = path.join(projectRoot, "App.js");
    if (fs.existsSync(appTsx)) return { type: "sourceFile", filePath: appTsx };
    if (fs.existsSync(appTs)) return { type: "sourceFile", filePath: appTs };
    if (fs.existsSync(appJsx)) return { type: "sourceFile", filePath: appJsx };
    if (fs.existsSync(appJs)) return { type: "sourceFile", filePath: appJs };
  }
  // 0b) ../../App from anywhere under node_modules → resolve to app's App (robust fallback for web).
  if (isAppRequest && normalizedOrigin.includes("node_modules")) {
    const appTsx = path.join(projectRoot, "App.tsx");
    const appTs = path.join(projectRoot, "App.ts");
    const appJsx = path.join(projectRoot, "App.jsx");
    const appJs = path.join(projectRoot, "App.js");
    if (fs.existsSync(appTsx)) return { type: "sourceFile", filePath: appTsx };
    if (fs.existsSync(appTs)) return { type: "sourceFile", filePath: appTs };
    if (fs.existsSync(appJsx)) return { type: "sourceFile", filePath: appJsx };
    if (fs.existsSync(appJs)) return { type: "sourceFile", filePath: appJs };
  }

  // 0c) For web, force zustand to CJS build (zustand/esm/*.mjs uses import.meta which Metro does not support).
  if (platform === "web" && (moduleName === "zustand" || moduleName.startsWith("zustand/"))) {
    const zustandDir = fs.existsSync(path.join(projectNodeModules, "zustand", "package.json"))
      ? projectNodeModules
      : rootNodeModules;
    const zustandRoot = path.join(zustandDir, "zustand");
    if (moduleName === "zustand") {
      const idx = path.join(zustandRoot, "index.js");
      if (fs.existsSync(idx)) return { type: "sourceFile", filePath: idx };
    } else {
      // zustand/esm/middleware -> zustand/middleware.js (CJS)
      const subpath = moduleName.slice("zustand/".length).replace(/^esm\//, "");
      const cjsPath = path.join(zustandRoot, subpath.replace(/\.mjs$/, "") + ".js");
      if (fs.existsSync(cjsPath)) return { type: "sourceFile", filePath: cjsPath };
    }
  }

  // 0d) When bundling with Metro, force packages/navigation to use .native implementations so we never
  //    load .web (react-router). React-router uses dynamic import() that Metro does not support.
  //    Applies to ios, android, and web (Expo web) so react-router is never pulled in.
  const isFromNavigation = path
    .normalize(origin)
    .replace(/\\/g, "/")
    .includes("packages/navigation");
  const isMetroPlatform = platform === "ios" || platform === "android" || platform === "web";
  if (
    isMetroPlatform &&
    isFromNavigation &&
    typeof moduleName === "string" &&
    moduleName.startsWith("./")
  ) {
    const navDir = path.resolve(monorepoRoot, "packages/navigation");
    const base = moduleName.replace(/^\.\//, "").replace(/\.(web|native)(\.[^.]+)?$/, "");
    const baseName = path.basename(base, path.extname(base)) || base;
    const candidates = [
      path.join(navDir, baseName + ".native.ts"),
      path.join(navDir, baseName + ".native.tsx"),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return { type: "sourceFile", filePath: p };
    }
  }

  // 0e) On native, force HeartSave and IconButton to .native so we never load web implementations
  //     that use <button> or <div> (RN has no View config for those).
  if ((platform === "ios" || platform === "android") && typeof moduleName === "string") {
    const uiButtonDir = path.join(monorepoRoot, "packages/ui/components/button");
    let stem = null;
    if (
      moduleName === "@ui/button/HeartSave" ||
      moduleName.startsWith("@ui/button/HeartSave/") ||
      moduleName === "@ui/button/propertyActions/HeartSave" ||
      moduleName.startsWith("@ui/button/propertyActions/HeartSave/") ||
      moduleName === "packages/ui/components/button/HeartSave" ||
      moduleName === "packages/ui/components/button/propertyActions/HeartSave" ||
      moduleName === "./HeartSave" ||
      moduleName === "../button/HeartSave"
    ) {
      stem = "HeartSave";
    } else if (
      moduleName === "@ui/button/IconButton" ||
      moduleName.startsWith("@ui/button/IconButton/") ||
      moduleName === "packages/ui/components/button/IconButton" ||
      moduleName === "./IconButton" ||
      moduleName === "../button/IconButton"
    ) {
      stem = "IconButton";
    }
    if (stem) {
      const nativeCandidates =
        stem === "IconButton"
          ? [
              path.join(uiButtonDir, "core", stem + ".native.tsx"),
              path.join(uiButtonDir, stem + ".native.tsx"),
            ]
          : [
              path.join(uiButtonDir, "propertyActions", stem + ".native.tsx"),
              path.join(uiButtonDir, stem + ".native.tsx"),
            ];
      for (const nativeTsx of nativeCandidates) {
        if (fs.existsSync(nativeTsx)) return { type: "sourceFile", filePath: nativeTsx };
      }
    }
  }

  // 0f) Relative requires to public/ (e.g. ../../../../public/signin-assets/... from packages/ui).
  //     Resolve from origin so Metro can bundle assets under Client/public even when projectRoot is apps/mobile.
  if (
    typeof moduleName === "string" &&
    (moduleName.startsWith("./") || moduleName.startsWith("../")) &&
    moduleName.includes("public/")
  ) {
    const originDir = origin
      ? path.dirname(origin)
      : path.resolve(monorepoRoot, "packages/ui/components/asset");
    let absolutePath = path.resolve(originDir, moduleName);
    const rootNorm = path.normalize(monorepoRoot);
    let pathNorm = path.normalize(absolutePath);
    if (!pathNorm.startsWith(rootNorm) || !fs.existsSync(absolutePath)) {
      const publicIndex = moduleName.indexOf("public/");
      if (publicIndex !== -1) {
        const suffix = moduleName.slice(publicIndex + "public/".length);
        absolutePath = path.join(monorepoRoot, "public", suffix);
        pathNorm = path.normalize(absolutePath);
      }
    }
    if (pathNorm.startsWith(rootNorm) && fs.existsSync(absolutePath)) {
      return { type: "sourceFile", filePath: absolutePath };
    }
  }

  // 1) Absolute paths under monorepo (e.g. from IDE or Babel). Convert to logical path, apply rewrites, then resolve.
  // Use "packages/..." in source; avoid hardcoded /Users/... paths so Metro can resolve without machine-specific paths.
  if (path.isAbsolute(moduleName)) {
    const root = path.normalize(monorepoRoot);
    const normalized = path.normalize(moduleName);
    if (normalized.startsWith(root)) {
      const logicalPath = path.relative(root, normalized).split(path.sep).join("/");
      let nameToResolve = logicalPath;
      for (const [from, to] of PACKAGES_PATH_REWRITES) {
        if (logicalPath === from || logicalPath.startsWith(from)) {
          nameToResolve =
            to + (logicalPath.length > from.length ? logicalPath.slice(from.length) : "");
          break;
        }
      }
      const resolved = resolvePackagesPath(nameToResolve, platform);
      if (resolved) {
        return { type: "sourceFile", filePath: resolved };
      }
    }
  }

  // 1) Tsconfig-style path rewrites (e.g. packages/hooks/data/auth/* -> packages/features/homeauth/hooks/data/*)
  let nameToResolve = moduleName;
  for (const [from, to] of PACKAGES_PATH_REWRITES) {
    if (moduleName === from || moduleName.startsWith(from)) {
      nameToResolve = to + (moduleName.length > from.length ? moduleName.slice(from.length) : "");
      break;
    }
  }

  // 2) packages/ (or @/) specifiers -> resolve to file under monorepo
  const resolved = resolvePackagesPath(nameToResolve, platform);
  if (resolved) return { type: "sourceFile", filePath: resolved };

  // 3) Direct fallback for packages/hooks/data/auth/* (rewrite to homeauth)
  if (
    moduleName.startsWith("packages/hooks/data/auth/") ||
    moduleName === "packages/hooks/data/auth"
  ) {
    const suffix =
      moduleName === "packages/hooks/data/auth"
        ? "index"
        : moduleName.slice("packages/hooks/data/auth/".length);
    const dir = path.resolve(monorepoRoot, "packages/features/homeauth/hooks/data");
    const withTs = path.join(dir, suffix + ".ts");
    const withTsx = path.join(dir, suffix + ".tsx");
    if (fs.existsSync(withTs)) return { type: "sourceFile", filePath: withTs };
    if (fs.existsSync(withTsx)) return { type: "sourceFile", filePath: withTsx };
    const indexTs = path.join(dir, suffix, "index.ts");
    const indexTsx = path.join(dir, suffix, "index.tsx");
    if (fs.existsSync(indexTs)) return { type: "sourceFile", filePath: indexTs };
    if (fs.existsSync(indexTsx)) return { type: "sourceFile", filePath: indexTsx };
  }

  if (moduleName.startsWith("packages/utils/core/")) {
    const rest = moduleName.replace("packages/utils/core/", "packages/utils/");
    const safeContext =
      context && typeof context.resolveRequest === "function"
        ? { ...config.resolver, ...context, resolveRequest: context.resolveRequest }
        : { ...config.resolver, resolveRequest: wrapDefaultResolveRequest(defaultResolveRequest) };
    try {
      return safeContext.resolveRequest(safeContext, rest, platform);
    } catch (err) {
      logResolutionError("delegate (packages/utils/core)", rest, platform, err);
      throw err;
    }
  }
  if (moduleName === "@babel/runtime" || moduleName.startsWith("@babel/runtime/")) {
    const subpath = moduleName.replace("@babel/runtime", "").replace(/^\//, "");
    const base = subpath || "index.js";
    const withJs = base.endsWith(".js") ? base : `${base}.js`;
    const projectFile = path.join(projectNodeModules, "@babel/runtime", withJs);
    const rootFile = path.join(rootNodeModules, "@babel/runtime", withJs);
    if (fs.existsSync(projectFile)) return { type: "sourceFile", filePath: projectFile };
    if (fs.existsSync(rootFile)) return { type: "sourceFile", filePath: rootFile };
    const projectPkg = path.join(projectNodeModules, "@babel/runtime", "package.json");
    const rootPkg = path.join(rootNodeModules, "@babel/runtime", "package.json");
    if (fs.existsSync(projectPkg))
      return {
        type: "sourceFile",
        filePath: path.join(projectNodeModules, "@babel/runtime", subpath || "index.js"),
      };
    if (fs.existsSync(rootPkg))
      return {
        type: "sourceFile",
        filePath: path.join(rootNodeModules, "@babel/runtime", subpath || "index.js"),
      };
  }
  if (moduleName === "expo" || moduleName.startsWith("expo/")) {
    const subpath = moduleName === "expo" ? "" : moduleName.slice(5);
    const projectDir = path.join(projectNodeModules, "expo");
    const rootDir = path.join(rootNodeModules, "expo");
    const projectPkg = path.join(projectDir, "package.json");
    const rootPkg = path.join(rootDir, "package.json");
    const resolveIn = (dir) => {
      if (!subpath) {
        try {
          const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
          const main = pkg.main || "index.js";
          return path.join(dir, main);
        } catch {
          return path.join(dir, "index.js");
        }
      }
      const target = path.join(dir, subpath);
      if (fs.existsSync(target) && fs.statSync(target).isFile()) return target;
      const withJs = path.join(dir, subpath + ".js");
      if (fs.existsSync(withJs)) return withJs;
      return path.join(dir, subpath);
    };
    if (fs.existsSync(projectPkg)) return { type: "sourceFile", filePath: resolveIn(projectDir) };
    if (fs.existsSync(rootPkg)) return { type: "sourceFile", filePath: resolveIn(rootDir) };
  }

  // 0g) react-native-maps package.json "main" points to src/index.ts; Metro's default resolver
  //     can fail to resolve it. Explicitly resolve to the source entry so the package loads.
  if (moduleName === "react-native-maps") {
    const mapsRoot = fs.existsSync(path.join(rootNodeModules, "react-native-maps", "package.json"))
      ? path.join(rootNodeModules, "react-native-maps")
      : path.join(projectNodeModules, "react-native-maps");
    const entry = path.join(mapsRoot, "src", "index.ts");
    if (fs.existsSync(entry)) return { type: "sourceFile", filePath: entry };
  }

  // Delegate to Metro's default resolver with a full context so internal code never
  // sees undefined (e.g. glob-related "Cannot read properties of undefined (reading 'hasMagic')").
  const safeContext =
    context && typeof context.resolveRequest === "function"
      ? { ...config.resolver, ...context, resolveRequest: context.resolveRequest }
      : { ...config.resolver, resolveRequest: wrapDefaultResolveRequest(defaultResolveRequest) };
  try {
    return safeContext.resolveRequest(safeContext, moduleName, platform);
  } catch (err) {
    logResolutionError("delegate (default)", moduleName, platform, err);
    throw err;
  }
}

config.resolver.resolveRequest = customResolveRequest;

const finalConfig = withNativeWind(config, {
  input: "./tailwind-input.css",
  configPath: "./tailwind.config.js",
});
console.info("[Metro] withNativeWind applied", {
  transformer: finalConfig.transformer,
  resolverAssetExts: finalConfig.resolver?.assetExts,
  resolverSourceExts: finalConfig.resolver?.sourceExts,
});

// Wrap the default/NativeWind transformer so transform errors log full stack + cause.
const innerTransformer =
  finalConfig.transformer?.babelTransformerPath ||
  require.resolve("expo/metro-react-native-babel-transformer");
process.env.METRO_INNER_BABEL_TRANSFORMER = innerTransformer;
finalConfig.transformer = {
  ...finalConfig.transformer,
  babelTransformerPath: path.resolve(projectRoot, "metroTransformerWrapper.js"),
};

console.info("[Metro] final config ready", {
  transformer: finalConfig.transformer,
  resolverPlatforms: finalConfig.resolver?.platforms,
});

module.exports = finalConfig;
