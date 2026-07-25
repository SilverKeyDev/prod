# Mobile: iOS splash-screen freeze

`Shipped` — last verified 2026-07-25 (iPhone 17 Pro simulator, iOS 26.5, Expo SDK 52).

The React Native app installed and showed the native splash storyboard, then never rendered.
The cause turned out to be **thirteen independent bugs stacked on top of each other**: each fix
only revealed the next. This runbook records the symptom, every root cause, the two systemic
lessons worth internalising, and a diagnostic checklist so the next occurrence takes minutes
rather than days.

---

## Symptom

- `expo run:ios` / `xcodebuild` + `simctl install` succeed. App launches, shows the splash
  storyboard, and **never advances**. No crash, no red box, no visible error.
- `lldb` showed the RN bridge briefly initialising then tearing down (Scheduler/UIManager
  destructors) roughly **60 seconds** after launch.
- `curl` of the bundle URL hung with 0 bytes received, even from the Mac itself:
  ```
  curl "http://localhost:8081/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true"
  ```
- Metro's `/status` endpoint answered immediately, so Metro was alive — it was *bundle
  construction* that stalled, and **zero** `[Metro transform]` lines appeared, meaning the stall
  was in dependency resolution, before any file was transformed.

### Reproducing

1. Clear Metro's cache: `cd Client/apps/mobile && npx expo start -c`.
2. Launch the app on the simulator.
3. The bundle request is issued, receives nothing for 60s, and the bridge tears down.

---

## Root causes, in discovery order

Bugs 1–6 blocked the JS bundle from **building**. Bug 7 explains why a *successfully built*
bundle still never reached the device. Bugs 8–13 were runtime failures that only became
reachable once JS actually executed.

### Phase 1 — the bundle would not build

| # | Root cause | Location | Fix |
|---|-----------|----------|-----|
| 1 | `import { useRef } from "react";` duplicated on two consecutive lines — a hard parse error. RN ships one monolithic bundle, so a single broken file kills the whole build. | `Client/apps/mobile/app/navigation/AuthStack.native.tsx` | Removed the duplicate import. |
| 2 | macOS/APFS is **case-insensitive**, so `fs.existsSync("…/AlignedRow")` matched the sibling `alignedRow/` **directory**. The resolver concluded "this is a directory", skipped extension probing, and never found `AlignedRow.tsx`. | `Client/apps/mobile/metro.config.cjs` → `resolvePackagesPath` | Added `existsCaseSensitive()`, which verifies the parent directory's real listing (`readdirSync`) before trusting a no-extension `existsSync`/`statSync`. |
| 3 | A hand-rolled "possible infinite loop" guard counted resolutions globally, keyed only on `platform\|moduleName`, and never reset. It threw on ordinary widely-shared modules once they crossed 40 cumulative resolutions — trivially true for `@babel/runtime` helpers in a ~3,000-file codebase (observed at 208 hits for `interopRequireDefault`). | `Client/apps/mobile/metro.config.cjs` | Removed. It could not detect real cycles anyway — Metro's `context.resolveRequest` does not recurse back into the custom resolver. |
| 4 | A `packages/utils/core/` → `packages/utils/` rewrite rule produced paths that have never existed (`packages/utils/format/...`), then delegated to Metro's raw resolver, which cannot handle `packages/`-prefixed specifiers at all. It also pre-empted the generic resolution that *would* have worked. | `Client/apps/mobile/metro.config.cjs` | Removed the rule. |
| 5 | The cross-platform navigation barrel hardcoded `NavigationOutlet` from its `.web` file, with no `.native` counterpart. This dragged `react-router-dom` — and its Metro-incompatible dynamic `import()` — into every consumer, including iOS. | `Client/packages/navigation/index.ts` | Removed from the universal barrel; its one web-only consumer (`Client/packages/features/admin/components/layout/AdminWorkspaceLayout.web.tsx`) imports it directly. |
| 6 | The "force `.native` for `packages/navigation`" rule used `path.basename()`, discarding subdirectories — so it looked for `packages/navigation/Link.native.ts` instead of `packages/navigation/link/Link.native.ts` and silently failed for every nested file. This is why `react-router-dom` kept leaking even after fix 5. | `Client/apps/mobile/metro.config.cjs` | Resolve relative to the importing file's own directory. |

At this point the bundle built: `iOS Bundled … (5529 modules)`, HTTP 200, ~24 MB.

### Phase 2 — the built bundle never reached the device

| # | Root cause | Location | Fix |
|---|-----------|----------|-----|
| 7 | **iOS gives up after 60 seconds.** A cold Metro build for this app takes ~217 s. `RCTJavaScriptLoader` uses `NSURLSession` with the default `timeoutIntervalForRequest = 60`, and Metro streams **no bytes** while building — so the request expired and the bridge tore down, leaving the native splash up forever. Confirmed in the device log: `Task <…> resuming, timeouts(60.0, 604800.0)`. | Interaction between `Client/apps/mobile/metro.config.cjs` build time and RN's loader | Warm the cache before launching (a warm build is ~15–25 s, well inside the budget). The durable fix — memoising the resolver's synchronous `fs` probes — is a tracked follow-up, see [Known follow-ups](#known-follow-ups). |

This is the key insight for the original symptom: **a healthy-looking bundle and a working app are
not the same thing when the build is slower than the client's timeout.**

### Phase 3 — runtime failures, once JS finally executed

| # | Root cause | Location | Fix |
|---|-----------|----------|-----|
| 8 | `react-native-blob-util` was **never linked natively**. It is a `peerDependency` of the declared `react-native-pdf`, so pnpm hoisted it and Metro resolved it fine — but autolinking only links *declared* dependencies, so no pod existed. Its `fetch.js` calls `new NativeEventEmitter(ReactNativeBlobUtil)` **at module scope** with a `null` native module, throwing during import and aborting the entire import graph before bootstrap. An audit of every podspec-bearing package against `Podfile.lock` found `expo-blur` and `expo-linear-gradient` in the same state — declared only in the *root* manifest at SDK-51 versions while the app is SDK 52. | `Client/apps/mobile/package.json`, `Client/package.json` | Declared all three in the app manifest at SDK-compatible versions; aligned the root manifest to a single version so no duplicate native registration. Then `pod install` + native rebuild. |
| 9 | `landingPartnerLogos.native.ts` imported `"./landingPartnerLogos"`, which on native resolves **back to itself** (`.native.ts` wins over `.ts`), leaving the binding `undefined` at module init. | `Client/packages/features/homeauth/utils/landingPartnerLogos.native.ts` | Extracted the shared data to `landingPartnerLogoUris.ts`, a file with no platform variants, and imported that from both. |
| 10 | The `design-tokens` barrel re-exported `shadowTokens` but not `shadowElevated` / `shadowSubtle`, so `shadows.native.ts` dereferenced `undefined` at module scope. Web never noticed because only the native file used them. | `Client/packages/design-tokens/index.ts` | Added the missing re-exports. |
| 11 | **Systemic.** Metro probes candidates *extension-major* in `sourceExts` order (`ts` before `tsx`). Many primitives ship a `.ts` shim that hardcodes `export … from "./X.web"` purely so TypeScript and ESLint can resolve `./X`. For `./Text`, Metro therefore found `Text.ts` → `Text.web.tsx` **before** `Text.native.tsx`. `Text.web` renders `<p>`, which RN cannot mount. **33 files share this exact shape.** | `Client/apps/mobile/metro.config.cjs` (rule `0h`) | On iOS/Android, prefer a `.native.*` sibling for extensionless relative imports. Leaked `.web` modules in the native bundle dropped from ~200 to 113. |
| 12 | `homeauth/index.native.ts` *replaces* `index.ts` on native (the resolver prefers `index.native.ts` for package barrels) but only exported native screens — so `runAuthBootstrap`, `useActiveWorkspace`, `useIsAgent` and friends were `undefined` for every native consumer. | `Client/packages/features/homeauth/index.native.ts` | Re-exported the platform-neutral members from their own modules (not from `./index`, which would resolve back to itself). Web-only members such as `HomeFeature` deliberately omitted so they stay out of the native bundle. |
| 13 | **Web markup rendered on native.** Four variants of the same mistake: a `<header>` root in a file already named `.native.tsx`; a polymorphic component defaulting to `as="section"`; an inline `<svg><path>` icon; and a bare `" "` string inside a `View`. Plus 11 platform-neutral files importing icons from web `lucide-react`, whose components render raw `<svg>/<path>`. | `…/landing/nav/LandingNav.native.tsx`, `…/landing/shared/LandingSectionShell.tsx`, `…/landing/footer/LandingFooter.tsx`, `…/landing/hero/LandingHero.tsx`, `Client/apps/mobile/metro.config.cjs` (rule `0c2`) | RN primitives instead of HTML; `isWeb` branch for the semantic landmark; `XIcon` split into `.tsx`/`.native.tsx` (shared path in `xIconPath.ts`, documented in `packages/config/platform/variants.json`); wrapped the bare string in a text component; aliased `lucide-react` → `lucide-react-native` on native. |

**Result:** app launches past the splash and renders the landing UI with zero JS errors.

---

## The two lessons that matter

### 1. iOS abandons the bundle fetch after 60 s; cold Metro builds here take ~3–4 min

`RCTJavaScriptLoader` uses `NSURLSession`'s default `timeoutIntervalForRequest` of **60 seconds**,
and Metro sends **no bytes at all** while it builds. So any cold build slower than 60 s presents
as an app frozen on the splash screen with *no error anywhere* — the bundle is fine, the app just
never receives it.

Consequences:

- **A successful `curl` of the bundle does not mean the app can load it.** Always compare the
  build *duration* against the 60 s budget, not just the HTTP status.
- **Always warm the cache before launching** after `expo start -c`, a dependency change, or on a
  fresh machine:
  ```bash
  curl -s -o /dev/null -w '%{http_code} %{size_download}\n' \
    "http://localhost:8081/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.silverkey.mobile"
  ```
- Cold ≈ 217 s, warm ≈ 15–25 s. Only the warm path fits the budget, which is why "it works for me"
  and "it hangs forever" can both be true on the same commit.

### 2. pnpm hoisting makes unlinked native modules invisible

`Client/.npmrc` sets `node-linker=hoisted`, so transitive and peer dependencies land in
`Client/node_modules` as real directories. That means:

- **Metro resolves them perfectly.** The JS bundle builds clean and looks completely healthy.
- **Autolinking ignores them.** React Native and Expo autolinking only link packages listed in
  the app's own `dependencies`. A hoisted peer dep gets **no pod and no native module**.

The failure therefore appears only at runtime, and often as something that looks unrelated —
here, `new NativeEventEmitter()` requires a non-null argument, thrown at *module scope*, which
aborts the whole import graph and leaves the app stuck on a loading state with no obvious link to
a missing pod.

**Rule of thumb:** if JS imports a native module, that module must be an explicit entry in
`Client/apps/mobile/package.json` — never relied upon via hoisting. Audit with:

```bash
# every package with a podspec that is absent from Podfile.lock
cd Client && node -e '
const fs=require("fs"),path=require("path");
const lock=fs.readFileSync("apps/mobile/ios/Podfile.lock","utf8");
for (const d of fs.readdirSync("node_modules").flatMap(e=>e.startsWith("@")?fs.readdirSync("node_modules/"+e).map(s=>e+"/"+s):[e])) {
  const full="node_modules/"+d;
  let specs=[]; try{specs=fs.readdirSync(full).filter(f=>f.endsWith(".podspec"))}catch{continue}
  if(!specs.length){try{specs=fs.readdirSync(full+"/ios").filter(f=>f.endsWith(".podspec"))}catch{}}
  if(!specs.length) continue;
  const name=path.basename(specs[0],".podspec");
  if(!new RegExp("(^|\\n)\\s+-?\\s*"+name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"[\\s(:]").test(lock)) console.log("UNLINKED:",d);
}'
```

Then cross-reference each hit against what the app actually imports — only the imported ones matter.

---

## Fast diagnostic checklist

Work top to bottom. Each step is cheap and eliminates a whole class of cause.

### A. Is it a bundle-delivery problem or a JS problem?

1. **Is Metro serving at all?** `curl -s localhost:8081/status` → expect `packager-status:running`.
2. **Time a real bundle request** (URL above). Note the **duration**:
   - hangs / >60 s → **bundle-delivery problem**, go to §B.
   - HTTP 500 → read the JSON body; it names the failing module or syntax error. Fix and repeat.
   - HTTP 200 in <60 s → delivery is fine, go to §C.
3. **Confirm the client's timeout in the device log** — this is the tell for the splash freeze:
   ```bash
   xcrun simctl spawn booted log stream --level debug \
     --predicate 'processImagePath CONTAINS "SilverKey"' | grep -i 'timeouts('
   ```
   `timeouts(60.0, …)` on the bundle request means the 60 s budget applies.

### B. Bundle delivery / build-time

4. **Warm the cache and retime.** If warm fits under 60 s, the app will load — the cold build is
   the problem, not correctness.
5. **Restart Metro without `-c`** so the on-disk transform cache survives
   (`/var/folders/**/metro-cache`, ~90 MB when warm). `-c` throws it away and re-costs ~217 s.
6. **Zero `[Metro transform]` lines** means the stall is in resolution, not transformation —
   suspect the custom `resolveRequest` in `Client/apps/mobile/metro.config.cjs`.
7. Confirm **Watchman** is installed (`watchman version`); without it Metro's initial crawl hangs.

### C. JS runs but the app does not render

8. **Read the LogBox.** Screenshot the simulator — the red box gives the exact file, line, and
   component stack:
   ```bash
   xcrun simctl io booted screenshot /tmp/shot.png
   ```
9. **Read Metro's terminal output** for `(NOBRIDGE) ERROR` lines and the accompanying
   `in <Component>` stack. Read it **inside-out**: the first frame is the culprit.
10. **Classify the error** — these four cover nearly everything seen here:

| Error | Means | Where to look |
|-------|-------|---------------|
| `new NativeEventEmitter() requires a non-null argument` | a native module is imported by JS but not linked | §2 above — audit podspecs vs `Podfile.lock` |
| `View config getter callback for component \`x\` must be a function` (lowercase `x`) | a **web HTML/SVG element** reached native | a `.web` file or a raw tag / `as="…"` default in a shared file |
| `Text strings must be rendered within a <Text> component` | a bare string sits directly inside a `View` | often a stray `" "` separator in a `.map()` |
| `Cannot read property 'x' of undefined` at module scope | a self-resolving import or a barrel missing an export | §D below |

### D. Platform-variant resolution

11. **Check what actually got bundled** — authoritative, and faster than reasoning about
    resolution order. Metro dev bundles embed module paths:
    ```bash
    grep -o 'primitives/text/Text\.[a-z.]*tsx\?' /tmp/bundle.bin | sort | uniq -c
    grep -oE '[A-Za-z0-9_/-]+\.web\.(tsx|ts)' /tmp/bundle.bin | sort -u | wc -l
    ```
    Seeing `X.ts` + `X.web.tsx` but **not** `X.native.tsx` is the signature of bug 11.
12. **Look for self-resolving platform files** — a `.native.tsx` importing its own basename.
    Type-only imports are erased by Babel and are harmless; only runtime imports break:
    ```bash
    grep -rn 'from "\./<BASENAME>"' packages/**/<BASENAME>.native.tsx
    ```
13. **Check `index.native.ts` barrels for completeness.** They *replace* `index.ts` on native, so
    every symbol native code imports from the barrel must be re-exported there.
14. **Scan for web markup in native files:**
    ```bash
    grep -rnE '<(header|footer|nav|section|div|span|p|svg|path|ul|li|h[1-6])[ >/]' \
      packages --include='*.native.tsx'
    grep -rn 'from "lucide-react"' packages apps --include='*.tsx' | grep -v '\.web\.'
    ```

### E. Native build mechanics (this machine)

15. `expo run:ios --device "<name>"` crashes in Expo CLI's **physical-device** usbmux plist
    parsing (`DOMParser.parseFromString … mimeType "undefined"`). Build with `xcodebuild` and a
    simulator destination instead.
16. `pod install` fails with `Unicode Normalization not appropriate for ASCII-8BIT` unless the
    locale is UTF-8: `export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8`.
17. Codesign fails with `resource fork, Finder information, or similar detritus not allowed`
    because the repo sits under an iCloud-synced `~/Desktop` and the file-provider daemon keeps
    re-applying `com.apple.FinderInfo`. In-place `xattr -cr` does not stick; copy out and sign:
    ```bash
    ditto --norsrc --noextattr --noqtn "$APP" /tmp/sk-build/SilverKey.app
    codesign --force --sign - --entitlements "$XCENT" --timestamp=none \
      --generate-entitlement-der /tmp/sk-build/SilverKey.app
    xcrun simctl install booted /tmp/sk-build/SilverKey.app
    ```
18. **Verify a module is really in the binary** — the debug build keeps code in the dylib, not the
    thin stub executable:
    ```bash
    strings "$APP/SilverKey.debug.dylib" | grep -c ReactNativeBlobUtil
    ```

---

## Known follow-ups

- **Cold Metro build is ~3–4 min.** The custom `resolveRequest` performs dozens of synchronous
  `fs.existsSync` probes per module across ~12,000 resolutions with no memoisation. Until this is
  addressed, §2's 60 s trap can recur on any cold cache. Caching directory listings would remove
  most of the cost.
- **113 `.web` modules remain in the native bundle**, reached through *explicit* hardcoded `.web`
  specifiers in platform-neutral barrels (rule `0h` only covers extensionless relative imports).
  They are inert until rendered, so untested screens can still surface bug 13's error class.
- **Repo lives under an iCloud-synced `~/Desktop`**, which breaks codesign on every native build
  (§E17). Moving it out is a dev-environment change, not an app change.

## See also

- [web-mobile-parity.md](../guides/web-mobile-parity.md) — platform-variant conventions
- [platform-file-extensions.mdc](../../.cursor/rules/frontend/platform-file-extensions.mdc) — when to use `.web` / `.native`
- `Client/packages/config/platform/variants.json` — registry of justified technology variants
- [end-to-end-qa-runbook.md](./qa/end-to-end-qa-runbook.md) — QA sweep after a change like this
