import fs from "fs";
import path from "path";

const VIRTUAL_ID = "virtual:silverkey-wiki";
const RESOLVED_ID = "\0" + VIRTUAL_ID;

/**
 * Build-time / dev ingest of repo-root documentation markdown into a virtual module
 * consumed by the admin Wiki tab.
 *
 * @param {{ docsRoot: string }} opts Absolute path to the documentation directory.
 */
export function silverkeyWikiPlugin(opts) {
  var docsRoot = path.resolve(opts.docsRoot);

  function humanize(name) {
    var base = name.replace(/\.md$/i, "");
    return base.replace(/[-_]+/g, " ").replace(/\b\w/g, function (c) {
      return c.toUpperCase();
    });
  }

  function extractTitle(content, fallback) {
    var match = content.match(/^#\s+(.+)$/m);
    if (!match) return fallback;
    return match[1].trim();
  }

  /**
   * @param {string} absDir
   * @param {string} relDir slash-separated relative path (no leading/trailing slash)
   * @param {Record<string, { title: string; content: string }>} pages
   */
  function walkDir(absDir, relDir, pages) {
    if (!fs.existsSync(absDir)) {
      return [];
    }

    var entries = fs.readdirSync(absDir, { withFileTypes: true });
    entries.sort(function (a, b) {
      if (a.isDirectory() !== b.isDirectory()) {
        return a.isDirectory() ? -1 : 1;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

    /** @type {Array<object>} */
    var children = [];

    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      if (entry.name.startsWith(".")) continue;

      var absChild = path.join(absDir, entry.name);
      var relChild = relDir ? relDir + "/" + entry.name : entry.name;

      if (entry.isDirectory()) {
        var nested = walkDir(absChild, relChild, pages);
        if (nested.length === 0) continue;
        children.push({
          type: "folder",
          name: entry.name,
          label: humanize(entry.name),
          path: relChild,
          children: nested,
        });
        continue;
      }

      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".md")) {
        continue;
      }

      var content = fs.readFileSync(absChild, "utf8");
      var pagePath = relChild.replace(/\.md$/i, "");
      var title = extractTitle(content, humanize(entry.name));
      pages[pagePath] = { title: title, content: content };
      children.push({
        type: "page",
        name: entry.name,
        label: title,
        path: pagePath,
        title: title,
      });
    }

    return children;
  }

  function buildModuleSource() {
    /** @type {Record<string, { title: string; content: string }>} */
    var pages = {};
    var tree = walkDir(docsRoot, "", pages);
    return (
      "export const tree = " +
      JSON.stringify(tree) +
      ";\n" +
      "export const pages = " +
      JSON.stringify(pages) +
      ";\n"
    );
  }

  return {
    name: "silverkey-wiki",
    resolveId: function (id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
      return null;
    },
    load: function (id) {
      if (id === RESOLVED_ID) {
        return buildModuleSource();
      }
      return null;
    },
    configureServer: function (server) {
      if (fs.existsSync(docsRoot)) {
        server.watcher.add(docsRoot);
      }
      server.watcher.on("all", function (_event, file) {
        if (!file || !file.startsWith(docsRoot)) return;
        var mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) {
          void server.reloadModule(mod);
        }
      });
    },
  };
}
