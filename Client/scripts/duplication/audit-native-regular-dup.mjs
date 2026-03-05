import fs from "node:fs";
import path from "node:path";

const CLIENT_ROOT = path.resolve(import.meta.dirname, "../..");
const FEATURES_ROOT = path.join(CLIENT_ROOT, "packages", "features");
const MOBILE_ROOT = path.join(CLIENT_ROOT, "apps", "mobile");
const WEB_ROOT = path.join(CLIENT_ROOT, "apps", "web");

/**
 * Matching rules between native and regular component files.
 *
 * - Primary pairs in feature packages:
 *   - Foo.native.tsx  <->  Foo.tsx      (same directory)
 *   - Foo.native.tsx  <->  Foo.web.tsx  (same directory)
 *
 * - App-level pairs (mobile vs shared/web):
 *   - Any *.native.tsx in apps/mobile matched by basename (without `.native`)
 *     against:
 *       - *.tsx in packages/features/** (same basename)
 *       - *.web.tsx in packages/features/** (same basename)
 *       - *.tsx in apps/web/** (same basename)
 *       - *.web.tsx in apps/web/** (same basename)
 */

const DEFAULT_MIN_LINES = 40;

/**
 * Refactor patterns for high-duplication or near-duplicate native vs regular pairs:
 * - Extract shared pure helpers (no React) for data transforms into feature-specific
 *   modules under packages/features/** or into shared utilities under packages/utils/**.
 * - Extract shared hooks (no JSX) for repeated stateful logic, and keep platform
 *   components focused on view/layout differences only.
 * - Prefer view-only divergence: keep RN vs web components thin wrappers around
 *   shared hooks/helpers so that business logic and data flow stay unified.
 */

function parseArgs(argv) {
  const args = {
    minLines: DEFAULT_MIN_LINES,
    json: false,
    failOnDuplication: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--min-lines" && i + 1 < argv.length) {
      const value = Number.parseInt(argv[i + 1], 10);
      if (!Number.isNaN(value) && value > 0) {
        args.minLines = value;
      }
      i += 1;
    } else if (arg === "--json") {
      args.json = true;
    } else if (arg === "--fail-on-duplication") {
      args.failOnDuplication = true;
    }
  }

  return args;
}

function walkFiles(root, predicate) {
  const results = [];
  const stack = [root];

  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;

    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      // Ignore directories we cannot read
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile()) {
        if (!predicate || predicate(fullPath)) {
          results.push(fullPath);
        }
      }
    }
  }

  return results;
}

function isNativeTsx(filePath) {
  return filePath.endsWith(".native.tsx");
}

function isNonNativeComponentTsx(filePath) {
  return filePath.endsWith(".tsx") && !filePath.endsWith(".native.tsx");
}

function basenameWithoutNative(filePath) {
  const base = path.basename(filePath);
  return base.replace(/\.native\.tsx$/, "");
}

function findFeaturePairs() {
  const nativeFiles = walkFiles(FEATURES_ROOT, isNativeTsx);
  const pairs = [];

  for (const nativePath of nativeFiles) {
    const dir = path.dirname(nativePath);
    const base = basenameWithoutNative(nativePath);

    const regularCandidates = [
      path.join(dir, `${base}.tsx`),
      path.join(dir, `${base}.web.tsx`),
    ].filter((candidate) => fs.existsSync(candidate));

    if (regularCandidates.length === 0) continue;

    for (const regularPath of regularCandidates) {
      pairs.push({
        kind: "feature",
        nativePath,
        regularPath,
      });
    }
  }

  return pairs;
}

function buildNonNativeIndex() {
  const index = new Map();

  const allRoots = [FEATURES_ROOT, WEB_ROOT];
  for (const root of allRoots) {
    const files = walkFiles(root, isNonNativeComponentTsx);
    for (const file of files) {
      const base = path.basename(file).replace(/\.web\.tsx$|\.tsx$/u, "");
      if (!index.has(base)) {
        index.set(base, []);
      }
      index.get(base).push(file);
    }
  }

  return index;
}

function findMobilePairs(nonNativeIndex) {
  const nativeFiles = walkFiles(MOBILE_ROOT, isNativeTsx);
  const pairs = [];

  for (const nativePath of nativeFiles) {
    const base = basenameWithoutNative(nativePath);
    const matches = nonNativeIndex.get(base) ?? [];
    for (const regularPath of matches) {
      pairs.push({
        kind: "mobile",
        nativePath,
        regularPath,
      });
    }
  }

  return pairs;
}

function readLines(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  // Preserve line structure; split on \n only since repo is unix-style.
  return content.split("\n");
}

function stripLeadingImports(lines) {
  let i = 0;
  while (i < lines.length && lines[i].trimStart().startsWith("import ")) {
    i += 1;
  }
  return {
    stripped: lines.slice(i),
    offset: i,
  };
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function longestCommonContiguousBlock(a, b) {
  const aLen = a.length;
  const bLen = b.length;
  if (aLen === 0 || bLen === 0) {
    return { length: 0, aStart: 0, bStart: 0 };
  }

  const dp = Array.from({ length: aLen + 1 }, () => new Array(bLen + 1).fill(0));
  let maxLen = 0;
  let aEnd = 0;
  let bEnd = 0;

  for (let i = 1; i <= aLen; i += 1) {
    for (let j = 1; j <= bLen; j += 1) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
        if (dp[i][j] > maxLen) {
          maxLen = dp[i][j];
          aEnd = i;
          bEnd = j;
        }
      } else {
        dp[i][j] = 0;
      }
    }
  }

  return {
    length: maxLen,
    aStart: aEnd - maxLen,
    bStart: bEnd - maxLen,
  };
}

function analyzePair(nativePath, regularPath, minLines) {
  const nativeLines = readLines(nativePath);
  const regularLines = readLines(regularPath);

  const { stripped: nativeBody, offset: nativeOffset } = stripLeadingImports(nativeLines);
  const { stripped: regularBody, offset: regularOffset } = stripLeadingImports(regularLines);

  const importOnlyEqual =
    nativeBody.length >= minLines &&
    regularBody.length >= minLines &&
    arraysEqual(nativeBody, regularBody);

  if (importOnlyEqual) {
    return {
      type: "import-only-equal",
      length: nativeBody.length,
      nativeRange: {
        start: nativeOffset + 1,
        end: nativeOffset + nativeBody.length,
      },
      regularRange: {
        start: regularOffset + 1,
        end: regularOffset + regularBody.length,
      },
    };
  }

  const { length, aStart, bStart } = longestCommonContiguousBlock(nativeLines, regularLines);
  if (length < minLines) {
    return null;
  }

  return {
    type: "exact-block",
    length,
    nativeRange: {
      start: aStart + 1,
      end: aStart + length,
    },
    regularRange: {
      start: bStart + 1,
      end: bStart + length,
    },
  };
}

function relativeFromClient(filePath) {
  return path.relative(CLIENT_ROOT, filePath);
}

function runAudit({ minLines, json }) {
  const featurePairs = findFeaturePairs();
  const nonNativeIndex = buildNonNativeIndex();
  const mobilePairs = findMobilePairs(nonNativeIndex);

  const allPairs = [...featurePairs, ...mobilePairs];
  const findings = [];

  for (const pair of allPairs) {
    const result = analyzePair(pair.nativePath, pair.regularPath, minLines);
    if (!result) continue;

    findings.push({
      kind: pair.kind,
      nativePath: relativeFromClient(pair.nativePath),
      regularPath: relativeFromClient(pair.regularPath),
      duplicationType: result.type,
      length: result.length,
      nativeRange: result.nativeRange,
      regularRange: result.regularRange,
    });
  }

  if (json) {
    console.log(
      JSON.stringify(
        {
          minLines,
          findings,
        },
        null,
        2
      )
    );
    return findings;
  }

  if (findings.length === 0) {
    console.log(
      `No native vs regular component pairs with contiguous duplicated blocks of at least ${minLines} lines were found.`
    );
    return findings;
  }

  console.log(
    `Found ${findings.length} native vs regular component pair(s) with contiguous duplicated blocks of at least ${minLines} lines:\n`
  );

  for (const finding of findings) {
    const header = `- [${finding.kind}] ${finding.nativePath}  <->  ${finding.regularPath}`;
    const detail =
      `  - type: ${finding.duplicationType}, length: ${finding.length} lines\n` +
      `  - native:  L${finding.nativeRange.start}–L${finding.nativeRange.end}\n` +
      `  - regular: L${finding.regularRange.start}–L${finding.regularRange.end}`;

    console.log(`${header}\n${detail}\n`);
  }

  return findings;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const findings = runAudit(args);

  if (args.failOnDuplication && findings && findings.length > 0) {
    process.exitCode = 1;
  }
}

main();
