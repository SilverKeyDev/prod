/**
 * Shared loader + validation for Client/config/required-bundle-env.json
 * Used by verify-web-bundle-env.mjs, assert-bundle-secrets.mjs, and export-bundle-docker-build-args.mjs.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @typedef {{ key: string, required?: boolean, dockerBuildArg?: boolean, fallbackEnvVar?: string, githubSecret?: string, minLength?: number, forbidPrefix?: string, pattern?: string, description?: string }} BundleEnvVariable */

/** @typedef {{ version: number, variables: BundleEnvVariable[] }} BundleEnvManifest */

/**
 * @param {string} [clientRoot]
 * @returns {string}
 */
export function defaultManifestPath(clientRoot = path.resolve(__dirname, "../..")) {
  return path.join(clientRoot, "config", "required-bundle-env.json");
}

/**
 * @param {string} [manifestPath]
 * @returns {BundleEnvManifest}
 */
export function loadBundleEnvManifest(manifestPath = defaultManifestPath()) {
  const raw = fs.readFileSync(manifestPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed?.variables || !Array.isArray(parsed.variables)) {
    throw new Error(`Invalid manifest: ${manifestPath}`);
  }
  return /** @type {BundleEnvManifest} */ (parsed);
}

/**
 * @param {BundleEnvVariable[]} variables
 * @param {{ requiredOnly?: boolean }} [opts]
 */
export function filterManifestVariables(variables, opts = {}) {
  const { requiredOnly = false } = opts;
  return variables.filter((v) => {
    if (!v?.key) return false;
    if (requiredOnly && !v.required) return false;
    return true;
  });
}

/**
 * @param {string} clientRoot
 * @returns {Record<string, string> | null}
 */
export function readProcessShimEnv(clientRoot) {
  const shimPath = path.join(clientRoot, "node_modules", ".vite", "process-shim.cjs");
  if (!fs.existsSync(shimPath)) {
    return null;
  }
  const content = fs.readFileSync(shimPath, "utf8");
  const match = content.match(/const env = (\{[\s\S]*?\});/);
  if (!match) {
    return null;
  }
  try {
    const env = JSON.parse(match[1]);
    const out = /** @type {Record<string, string>} */ ({});
    for (const [k, v] of Object.entries(env)) {
      out[k] = String(v ?? "").trim();
    }
    return out;
  } catch {
    return null;
  }
}

/**
 * @param {string} clientRoot
 * @param {string} key
 * @returns {string | null}
 */
export function readDistValueHint(clientRoot, key) {
  const assetsDir = path.join(clientRoot, "dist", "assets");
  if (!fs.existsSync(assetsDir)) {
    return null;
  }
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}["']?\\s*:\\s*["']([^"']*)["']`);
  for (const name of fs.readdirSync(assetsDir)) {
    if (!name.endsWith(".js") || name.endsWith(".map")) continue;
    const content = fs.readFileSync(path.join(assetsDir, name), "utf8");
    const m = content.match(re);
    if (m) {
      const value = m[1].trim();
      if (value) return value;
    }
  }
  return null;
}

/**
 * @param {string} value
 * @param {BundleEnvVariable} spec
 * @returns {string | null} error message or null if ok
 */
export function validateBundleEnvValue(value, spec) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return "missing or empty";
  }
  if (spec.minLength != null && trimmed.length < spec.minLength) {
    return `length ${trimmed.length} < minLength ${spec.minLength}`;
  }
  if (spec.forbidPrefix && trimmed.startsWith(spec.forbidPrefix)) {
    return `value must not start with "${spec.forbidPrefix}" (wrong credential type?)`;
  }
  if (spec.pattern) {
    const re = new RegExp(spec.pattern);
    if (!re.test(trimmed)) {
      return `does not match pattern ${spec.pattern}`;
    }
  }
  return null;
}

/**
 * @param {string} clientRoot
 * @param {BundleEnvManifest} manifest
 * @param {{ requiredOnly?: boolean }} [opts]
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function verifyBundleEnvFromBuild(clientRoot, manifest, opts = {}) {
  const { requiredOnly = true } = opts;
  const specs = filterManifestVariables(manifest.variables, { requiredOnly });
  const shimEnv = readProcessShimEnv(clientRoot);
  const errors = [];
  const warnings = [];

  if (!shimEnv) {
    errors.push("process-shim.cjs missing or unparsable (run pnpm build:web first)");
    return { ok: false, errors, warnings };
  }

  for (const spec of specs) {
    let value = shimEnv[spec.key] ?? "";
    if (!value) {
      const distHint = readDistValueHint(clientRoot, spec.key);
      if (distHint) value = distHint;
    }
    const err = validateBundleEnvValue(value, spec);
    if (err) {
      const msg = `${spec.key}: ${err}`;
      if (spec.required) {
        errors.push(msg);
      } else {
        warnings.push(msg);
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * @param {NodeJS.ProcessEnv} env
 * @param {BundleEnvManifest} manifest
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function assertBundleSecretsPresent(env, manifest) {
  const specs = filterManifestVariables(manifest.variables, { requiredOnly: true });
  const errors = [];
  for (const spec of specs) {
    const value = String(env[spec.key] ?? "").trim();
    if (!value) {
      errors.push(`${spec.key} is empty (required for prod web bundle)`);
    }
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Presence + manifest validation (minLength, pattern, forbidPrefix) for required keys.
 * @param {NodeJS.ProcessEnv} env
 * @param {BundleEnvManifest} manifest
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function assertBundleSecretsPresentWithValidation(env, manifest) {
  const specs = filterManifestVariables(manifest.variables, { requiredOnly: true });
  const errors = [];
  for (const spec of specs) {
    const value = String(env[spec.key] ?? "").trim();
    const err = validateBundleEnvValue(value, spec);
    if (err) {
      errors.push(`${spec.key}: ${err}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

/** @deprecated Use assertBundleSecretsPresent — kept for transitional imports. */
export function assertGithubSecretsPresent(env, manifest) {
  return assertBundleSecretsPresent(env, manifest);
}

/**
 * @param {NodeJS.ProcessEnv} env
 * @param {BundleEnvManifest} manifest
 * @returns {string[]}
 */
/**
 * @param {string} envFilePath
 * @returns {Record<string, string>}
 */
export function parseDotenvFile(envFilePath) {
  const content = fs.readFileSync(envFilePath, "utf8");
  /** @type {Record<string, string>} */
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!key || key.startsWith("#")) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

/**
 * @param {string} value
 */
function escapeDockerBuildArgValue(value) {
  return String(value).replace(/'/g, `'\\''`);
}

/**
 * @param {Record<string, string>} env
 * @returns {string[]}
 */
export function formatEnvFileDockerBuildArgs(env) {
  const args = [];
  for (const [key, value] of Object.entries(env)) {
    if (!key) continue;
    const escaped = escapeDockerBuildArgValue(value);
    args.push(`--build-arg ${key}='${escaped}'`);
  }
  return args;
}

export function formatDockerBuildArgs(env, manifest) {
  const args = [];
  for (const spec of manifest.variables) {
    if (!spec.dockerBuildArg || !spec.key) continue;
    const value = String(env[spec.key] ?? "").trim();
    const escaped = escapeDockerBuildArgValue(value);
    args.push(`--build-arg ${spec.key}='${escaped}'`);
  }
  return args;
}

/**
 * @param {string | undefined} suffix
 */
export function maskValueSuffix(suffix) {
  const id = (suffix ?? "").trim();
  if (!id) return { length: 0, suffix: "" };
  return {
    length: id.length,
    suffix: id.length >= 4 ? id.slice(-4) : id,
  };
}
