import fs from "fs";
import path from "path";

/**
 * Static SEO for the web production build (Vite-only; values come from `loadEnv` in
 * `vite.config.js`, not from `packages/config/env.ts`).
 *
 * **transformIndexHtml** — When `googleSiteVerification` is non-empty, injects
 * `<meta name="google-site-verification" content="…">` before `</head>` (Google Search Console
 * HTML tag method).
 *
 * **closeBundle** — Writes `robots.txt` into the resolved `build.outDir` with `Disallow` rules
 * for authenticated / app shells. When `publicSiteUrl` is set (canonical origin, no trailing
 * slash, e.g. `https://usesilverkey.com`), adds `Sitemap: {origin}/sitemap.xml` and writes
 * `sitemap.xml` for a small set of public marketing paths.
 *
 * Env (optional, in `Client/.env`): `EXPO_PUBLIC_SITE_URL`, `EXPO_PUBLIC_GOOGLE_SITE_VERIFICATION`.
 *
 * @param {{ root: string; publicSiteUrl: string; googleSiteVerification?: string }} opts
 *   - `root` — Client workspace root; fallback if `build.outDir` is not resolved yet.
 *   - `publicSiteUrl` — Canonical public origin for sitemap absolute `<loc>` URLs.
 *   - `googleSiteVerification` — Optional verification token for the meta tag.
 */
export function seoStaticFilesPlugin(opts) {
  var clientRoot = opts.root;
  var publicSiteUrl = (opts.publicSiteUrl || "").trim().replace(/\/$/, "");
  var googleVerification = (opts.googleSiteVerification || "").trim();
  /** Filled in `configResolved`; default matches `build.outDir` when outDir is `Client/dist`. */
  var resolvedOutDir = path.join(clientRoot, "dist");

  return {
    name: "silverkey-seo-static",
    configResolved: function (config) {
      resolvedOutDir = path.resolve(config.root, config.build.outDir);
    },
    transformIndexHtml: function (html) {
      if (!googleVerification) return html;
      var safe = googleVerification.replace(/"/g, "");
      return html.replace(
        "</head>",
        '<meta name="google-site-verification" content="' + safe + '" />\n    </head>'
      );
    },
    closeBundle: function () {
      var outDir = resolvedOutDir;
      var disallow = [
        "/dashboard",
        "/search",
        "/messaging",
        "/profile",
        "/library",
        "/saved",
        "/find-agents",
        "/admin",
        "/onboarding",
        "/button-showcase",
        "/login",
        "/signup",
        "/verification",
        "/forgot-password",
      ];
      var lines = ["User-agent: *", "Allow: /"];
      for (var i = 0; i < disallow.length; i++) {
        lines.push("Disallow: " + disallow[i]);
      }
      if (publicSiteUrl) {
        lines.push("");
        lines.push("Sitemap: " + publicSiteUrl + "/sitemap.xml");
      }
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, "robots.txt"), lines.join("\n") + "\n", "utf8");

      if (!publicSiteUrl) {
        return;
      }
      var urls = ["/", "/privacy", "/terms", "/contact"];
      var urlEntries = urls
        .map(function (u) {
          return "  <url><loc>" + publicSiteUrl + u + "</loc></url>";
        })
        .join("\n");
      var xml =
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        urlEntries +
        "\n</urlset>\n";
      fs.writeFileSync(path.join(outDir, "sitemap.xml"), xml, "utf8");
    },
  };
}
