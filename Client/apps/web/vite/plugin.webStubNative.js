/**
 * Stub React Native and .native.* so no bare specifiers appear in the web bundle.
 * @param {{ reactNativeStub: string }} opts
 * @returns {import("vite").Plugin}
 */
export function createWebStubNativePlugin(opts) {
  var reactNativeStub = opts.reactNativeStub;
  return {
    name: "exclude-native-files",
    enforce: "pre",
    resolveId: function (id, importer) {
      var isReactNative =
        id === "react-native" ||
        id.startsWith("react-native/") ||
        id.startsWith("@react-native/") ||
        id.includes("/react-native/") ||
        id.includes("node_modules/react-native");
      var isNativeFile =
        id.includes(".native.") ||
        (importer && importer.includes(".native.")) ||
        (importer && importer.includes("react-native"));
      if (isReactNative) {
        return "\0web-stub:react-native";
      }
      if (isNativeFile) {
        return "\0web-stub:native";
      }
      return null;
    },
    load: function (id) {
      if (id === "\0web-stub:react-native") {
        return reactNativeStub;
      }
      if (id === "\0web-stub:native") {
        return "export {};";
      }
      if (id.includes("react-native") || id.includes(".native.")) {
        return "export {};";
      }
      return null;
    },
  };
}
