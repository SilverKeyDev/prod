"use strict";

const path = require("path");

var RN_ONLY_PACKAGES = [
  "react-native",
  "react-native-",
  "@react-navigation/native",
  "@react-navigation/",
  "react-native-svg",
  "react-native-reanimated",
  "react-native-gesture-handler",
  "react-native-safe-area-context",
];

var WEB_ONLY_PACKAGES = [
  "react-dom",
  "react-router-dom",
  "react-router/",
  "@headlessui/react",
  "react-virtuoso",
];

function isTypeOnlyImport(node) {
  return node.importKind === "type";
}

function getImportSource(node) {
  var src = node.source && node.source.value;
  return typeof src === "string" ? src : "";
}

function isBareOrScopedPackage(specifier) {
  return (
    !specifier.startsWith(".") &&
    !specifier.startsWith("/") &&
    !specifier.startsWith("@/") &&
    !specifier.startsWith("packages/") &&
    !specifier.startsWith("logger")
  );
}

function matchesAny(specifier, patterns) {
  return patterns.some(function (p) {
    return specifier === p || specifier.startsWith(p.replace(/\/$/, ""));
  });
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce platform-appropriate imports: .web.* files must not import React Native-only packages; .native.* files must not import web-only packages.",
    },
    schema: [],
    messages: {
      webFileNoRN:
        "*.web.* files must not import React Native-only packages. Forbidden: {{specifier}}",
      nativeFileNoWeb:
        "*.native.* files must not import web-only packages. Forbidden: {{specifier}}",
    },
  },

  create: function (context) {
    var filename = context.getFilename();
    var normalized = filename.split(path.sep).join("/");
    var isWeb = /\.web\.(tsx?|jsx?)$/.test(normalized);
    var isNative = /\.native\.(tsx?|jsx?)$/.test(normalized);

    if (!isWeb && !isNative) return {};

    return {
      ImportDeclaration: function (node) {
        if (isTypeOnlyImport(node)) return;
        var specifier = getImportSource(node);
        if (!specifier || !isBareOrScopedPackage(specifier)) return;

        if (isWeb && matchesAny(specifier, RN_ONLY_PACKAGES)) {
          context.report({
            node: node.source,
            messageId: "webFileNoRN",
            data: { specifier: specifier },
          });
        }
        if (isNative && matchesAny(specifier, WEB_ONLY_PACKAGES)) {
          context.report({
            node: node.source,
            messageId: "nativeFileNoWeb",
            data: { specifier: specifier },
          });
        }
      },
    };
  },
};
