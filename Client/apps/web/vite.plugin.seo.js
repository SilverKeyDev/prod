import fs from "fs";
import path from "path";

/**
 * Writes robots.txt and sitemap.xml into the Vite outDir after build.
 * @param {{ root: string; publicSiteUrl: string }} opts
 */
export function seoStaticFilesPlugin(opts) {
  var root = opts.root;
  var publicSiteUrl = (opts.publicSiteUrl || "").trim().replace(/\/$/, "");
  var googleVerification = (opts.googleSiteVerification || "").trim();
  return {
    name: "silverkey-seo-static",
    transformIndexHtml: function (html) {
      if (!googleVerification) return html;
      var safe = googleVerification.replace(/"/g, "");
      return html.replace(
        "</head>",
        '<meta name="google-site-verification" content="' + safe + '" />\n    </head>'
      );
    },
    closeBundle: function () {
      var outDir = path.join(root, "dist");
      var disallow = [
        "/dashboard",
        "/search",
        "/messaging",
        "/profile",
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
