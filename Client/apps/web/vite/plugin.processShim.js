/**
 * ESM virtual module + dev middleware for process.env shim (see vite.config.js).
 * @param {{ envVars: Record<string, string>; shimPath: string }} opts
 * @returns {import("vite").Plugin[]}
 */
export function createProcessShimPlugins(opts) {
  var envVars = opts.envVars;
  var shimPath = opts.shimPath;
  var esmBody = "export default { env: ".concat(JSON.stringify(envVars), " };");
  return [
    {
      name: "process-shim-esm",
      enforce: "pre",
      resolveId: function (id) {
        var normalized = id.replace(/\?.*$/, "").replace(/^file:\/\//, "");
        var isShim =
          normalized === shimPath ||
          id.includes("process-shim") ||
          normalized.endsWith("process-shim.cjs");
        if (isShim) {
          return "\0process-shim-esm";
        }
        return null;
      },
      load: function (id) {
        if (id === "\0process-shim-esm") {
          return esmBody;
        }
        return null;
      },
    },
    {
      name: "process-shim-middleware",
      configureServer: function (server) {
        server.middlewares.use(function (req, res, next) {
          if (req.url && req.url.includes("process-shim.cjs")) {
            res.setHeader("Content-Type", "application/javascript");
            res.setHeader("Cache-Control", "no-cache");
            res.end(esmBody);
            return;
          }
          next();
        });
      },
    },
  ];
}
